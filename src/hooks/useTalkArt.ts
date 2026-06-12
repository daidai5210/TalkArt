/**
 * @hook useTalkArt
 * Main orchestration hook that ties together all TalkArt modules.
 *
 * Wires up the full state machine:
 *   WakeWordDetector.onWake → setAgentState('listening') → VoiceManager.startListening()
 *   VoiceManager.onSpeechResult → setTranscript(text)
 *     → if isFinal: EndPhraseDetector.detect(text)
 *       → if 'correction': reset, go back to listening
 *       → if 'end': setAgentState('executing') → processConfirmation()
 *       → if 'none': send to LLM for confirmation → processVoiceInput()
 *   LLM response (confirmation) → setConfirmation(text) → setAgentState('confirming')
 *   LLM response (function_call) → ToolDispatcher.dispatch() → update canvas store
 *
 * Also handles:
 * - Manual start/stop listening (fallback to wake word)
 * - Browser support detection for Web Speech API
 * - Text input fallback when voice is not supported
 * - Export functionality (SVG/PNG)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { VoiceManager } from '@/modules/voice-input/VoiceManager';
import { WakeWordDetector } from '@/modules/voice-input/WakeWordDetector';
import { EndPhraseDetector } from '@/modules/voice-input/EndPhraseDetector';
import { exportSVG, exportPNG } from '@/modules/export';
import type { AgentState } from '@/modules/ai-agent/types';
import type { SVGElement } from '@/store/canvas-slice';
import type { ConversationMessage } from '@/store/agent-slice';

/** Return type of the useTalkArt hook. */
export interface TalkArtState {
  // Agent state
  /** Current state machine state. */
  agentState: AgentState;
  /** Current ASR transcript (interim + final). */
  currentTranscript: string;
  /** AI confirmation text to display. */
  confirmationText: string;
  /** Whether the microphone is currently active. */
  isListening: boolean;
  /** Whether the browser supports Web Speech API. */
  isSupported: boolean;
  /** Agent-level error message, or null if no error. */
  error: string | null;
  /** Voice-specific warning (does not block the app). */
  voiceError: string | null;

  // Actions
  /** Manually start listening (fallback to wake word). */
  startListening: () => void;
  /** Manually stop listening. */
  stopListening: () => void;
  /** Submit text input (fallback when voice is not supported). */
  submitTextInput: (text: string) => void;
  /** Clear agent error and return to idle. */
  clearError: () => void;
  /** Clear voice warning. */
  clearVoiceError: () => void;

  // Canvas state
  /** Elements on the canvas. */
  elements: SVGElement[];
  /** Currently selected element ID. */
  selectedId: string | null;
  /** Whether undo is available. */
  canUndo: boolean;
  /** Whether redo is available. */
  canRedo: boolean;

  // Canvas actions
  /** Undo the last change. */
  undo: () => void;
  /** Redo the last undone change. */
  redo: () => void;
  /** Clear all elements from the canvas. */
  clearCanvas: () => void;
  /** Export canvas as SVG file. */
  exportSVGAction: () => void;
  /** Export canvas as PNG file. */
  exportPNGAction: () => void;

  // Conversation
  /** Conversation history for display. */
  conversation: ConversationMessage[];
}

export function useTalkArt(): TalkArtState {
  // ---------------------------------------------------------------------------
  // Store bindings
  // ---------------------------------------------------------------------------
  const agentState = useStore((s) => s.agentState);
  const currentTranscript = useStore((s) => s.currentTranscript);
  const confirmationText = useStore((s) => s.confirmationText);
  const error = useStore((s) => s.error);
  const conversation = useStore((s) => s.conversation);
  const elements = useStore((s) => s.elements);
  const selectedId = useStore((s) => s.selectedId);
  const history = useStore((s) => s.history);
  const historyIndex = useStore((s) => s.historyIndex);

  const setAgentState = useStore((s) => s.setAgentState);
  const setTranscript = useStore((s) => s.setTranscript);
  const setConfirmation = useStore((s) => s.setConfirmation);
  const setError = useStore((s) => s.setError);
  const processVoiceInput = useStore((s) => s.processVoiceInput);
  const processConfirmation = useStore((s) => s.processConfirmation);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const clearCanvas = useStore((s) => s.clearCanvas);

  // ---------------------------------------------------------------------------
  // Singleton instances (persist across re-renders)
  // ---------------------------------------------------------------------------
  const voiceManagerRef = useRef<VoiceManager | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const endPhraseDetectorRef = useRef<EndPhraseDetector | null>(null);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Refs to always have the latest store actions in callbacks
  const agentStateRef = useRef(agentState);
  const setAgentStateRef = useRef(setAgentState);
  const setTranscriptRef = useRef(setTranscript);
  const setConfirmationRef = useRef(setConfirmation);
  const setErrorRef = useRef(setError);
  const processVoiceInputRef = useRef(processVoiceInput);
  const processConfirmationRef = useRef(processConfirmation);

  // Keep refs in sync with latest values
  agentStateRef.current = agentState;
  setAgentStateRef.current = setAgentState;
  setTranscriptRef.current = setTranscript;
  setConfirmationRef.current = setConfirmation;
  setErrorRef.current = setError;
  processVoiceInputRef.current = processVoiceInput;
  processConfirmationRef.current = processConfirmation;

  // Lazy initialization
  if (!voiceManagerRef.current) {
    voiceManagerRef.current = new VoiceManager();
  }
  if (!wakeWordDetectorRef.current) {
    wakeWordDetectorRef.current = new WakeWordDetector();
  }
  if (!endPhraseDetectorRef.current) {
    endPhraseDetectorRef.current = new EndPhraseDetector();
  }

  const voiceManager = voiceManagerRef.current;
  const wakeWordDetector = wakeWordDetectorRef.current;
  const endPhraseDetector = endPhraseDetectorRef.current;

  // ---------------------------------------------------------------------------
  // Wire up voice callbacks (once)
  // ---------------------------------------------------------------------------
  const callbacksInitializedRef = useRef(false);

  useEffect(() => {
    if (callbacksInitializedRef.current) return;
    callbacksInitializedRef.current = true;

    // Speech result handler: core of the state machine
    voiceManager.onSpeechResult((text, isFinal) => {
      // Always update the transcript for UI display
      setTranscriptRef.current(text);

      // Check for wake word when idle
      if (agentStateRef.current === 'idle' || !isListeningRef.current) {
        const wakeDetected = wakeWordDetector.detect(text);
        if (wakeDetected) {
          setAgentStateRef.current('wake_word');
          // Start listening after wake word detection
          setAgentStateRef.current('listening');
          voiceManager.startListening();
          isListeningRef.current = true;
          return;
        }
      }

      // Process final transcripts when in listening/confirming state
      if (isFinal && isListeningRef.current) {
        const phraseType = endPhraseDetector.detect(text);

        if (phraseType === 'correction') {
          // User wants to correct — go back to listening
          setConfirmationRef.current('');
          setAgentStateRef.current('listening');
          return;
        }

        if (phraseType === 'end') {
          // User confirmed — execute
          if (agentStateRef.current === 'confirming') {
            setAgentStateRef.current('executing');
            isListeningRef.current = false;
            voiceManager.stopListening();
            processConfirmationRef.current(text).catch((err) => {
              setErrorRef.current(err instanceof Error ? err.message : '执行失败');
            });
          }
          return;
        }

        // No end/correction phrase detected — send to LLM
        if (!isProcessingRef.current) {
          isProcessingRef.current = true;
          setAgentStateRef.current('listening');
          processVoiceInputRef.current(text)
            .then(() => {
              isProcessingRef.current = false;
            })
            .catch((err) => {
              isProcessingRef.current = false;
              setErrorRef.current(err instanceof Error ? err.message : '处理失败');
            });
        }
      }
    });

    // State change: track listening state only (voice errors handled separately)
    voiceManager.onStateChange((state) => {
      isListeningRef.current = state.isListening;
    });

    // Voice errors stay local — do not pollute the global agent error state
    voiceManager.onError((errorMsg) => {
      setVoiceError(errorMsg);
      isListeningRef.current = false;
      setAgentStateRef.current('idle');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also update the wake word callback on state changes
  useEffect(() => {
    wakeWordDetector.onWake(() => {
      setAgentStateRef.current('wake_word');
      setAgentStateRef.current('listening');
      voiceManager.startListening();
      isListeningRef.current = true;
    });
  }, [voiceManager, wakeWordDetector]);

  // ---------------------------------------------------------------------------
  // Auto-restart wake word detection when returning to idle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (agentState === 'idle') {
      wakeWordDetector.reset();
      isProcessingRef.current = false;
    }
  }, [agentState, wakeWordDetector]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** Manually start listening (fallback to wake word). */
  const startListening = useCallback(() => {
    if (voiceManager.isSupported()) {
      wakeWordDetector.reset();
      setVoiceError(null);
      setAgentState('listening');
      voiceManager.startListening().then(() => {
        isListeningRef.current = voiceManager.getState().isListening;
      });
    }
  }, [voiceManager, wakeWordDetector, setAgentState]);

  /** Manually stop listening. */
  const stopListening = useCallback(() => {
    voiceManager.stopListening();
    isListeningRef.current = false;
    setVoiceError(null);
    setAgentState('idle');
    setTranscript('');
  }, [voiceManager, setAgentState, setTranscript]);

  /** Submit text input (fallback when voice is not supported). */
  const submitTextInput = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const phraseType = endPhraseDetector.detect(text);

      if (phraseType === 'correction') {
        setConfirmation('');
        setAgentState('listening');
        return;
      }

      if (phraseType === 'end' && agentState === 'confirming') {
        setAgentState('executing');
        processConfirmation(text).catch((err) => {
          setError(err instanceof Error ? err.message : '执行失败');
        });
        return;
      }

      // No special phrase — send to LLM
      setAgentState('listening');
      processVoiceInput(text).catch((err) => {
        setError(err instanceof Error ? err.message : '处理失败');
      });
    },
    [endPhraseDetector, agentState, setAgentState, setConfirmation, processVoiceInput, processConfirmation, setError],
  );

  /** Clear error and return to idle. */
  const clearError = useCallback(() => {
    setError(null);
    setAgentState('idle');
  }, [setError, setAgentState]);

  const clearVoiceError = useCallback(() => {
    setVoiceError(null);
    voiceManager.clearError();
  }, [voiceManager]);

  /** Export canvas as SVG file. */
  const exportSVGAction = useCallback(() => {
    const svg = document.querySelector('svg') as SVGSVGElement | null;
    if (svg) {
      exportSVG(svg, `talkart-${Date.now()}`);
    }
  }, []);

  /** Export canvas as PNG file. */
  const exportPNGAction = useCallback(async () => {
    const svg = document.querySelector('svg') as SVGSVGElement | null;
    if (svg) {
      try {
        await exportPNG(svg, `talkart-${Date.now()}`);
      } catch (_err) {
        setError('PNG 导出失败');
      }
    }
  }, [setError]);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    // Agent state
    agentState,
    currentTranscript,
    confirmationText,
    isListening: isListeningRef.current,
    isSupported: voiceManager.isSupported(),
    error,
    voiceError,

    // Actions
    startListening,
    stopListening,
    submitTextInput,
    clearError,
    clearVoiceError,

    // Canvas state
    elements,
    selectedId,
    canUndo,
    canRedo,

    // Canvas actions
    undo,
    redo,
    clearCanvas,
    exportSVGAction,
    exportPNGAction,

    // Conversation
    conversation,
  };
}
