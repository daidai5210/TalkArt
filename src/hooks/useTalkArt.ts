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
 * - Browser STT input (microphone recording + cloud transcription)
 * - Text input fallback when microphone is not supported
 * - Export functionality (SVG/PNG)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import { VoiceManager } from '@/modules/voice-input/VoiceManager';
import { WakeWordDetector } from '@/modules/voice-input/WakeWordDetector';
import { EndPhraseDetector } from '@/modules/voice-input/EndPhraseDetector';
import { VoiceCommandRouter } from '@/modules/voice-input/VoiceCommandRouter';
import { normalizeVoiceTranscript } from '@/modules/voice-input/normalize-transcript';
import { exportSVG, exportPNG } from '@/modules/export';
import { useDemoMode } from './useDemoMode';
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
  /** Whether the browser supports microphone STT input. */
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
  /** Pure voice demo mode (hides text input / toolbar). */
  demoMode: boolean;
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
  const voiceCommandRouterRef = useRef<VoiceCommandRouter | null>(null);
  const { demoMode } = useDemoMode();
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Refs to always have the latest store actions in callbacks
  const agentStateRef = useRef(agentState);
  const setAgentStateRef = useRef(setAgentState);
  const setTranscriptRef = useRef(setTranscript);
  const setConfirmationRef = useRef(setConfirmation);
  const setErrorRef = useRef(setError);
  const processVoiceInputRef = useRef(processVoiceInput);
  const processConfirmationRef = useRef(processConfirmation);
  const undoRef = useRef(undo);
  const exportSVGActionRef = useRef<(() => void) | null>(null);

  // Keep refs in sync with latest values
  agentStateRef.current = agentState;
  setAgentStateRef.current = setAgentState;
  setTranscriptRef.current = setTranscript;
  setConfirmationRef.current = setConfirmation;
  setErrorRef.current = setError;
  processVoiceInputRef.current = processVoiceInput;
  processConfirmationRef.current = processConfirmation;
  undoRef.current = undo;

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
  if (!voiceCommandRouterRef.current) {
    voiceCommandRouterRef.current = new VoiceCommandRouter();
  }
  const voiceManager = voiceManagerRef.current;
  const wakeWordDetector = wakeWordDetectorRef.current;
  const endPhraseDetector = endPhraseDetectorRef.current;
  const voiceCommandRouter = voiceCommandRouterRef.current;

  // ---------------------------------------------------------------------------
  // Wire up voice callbacks (once)
  // ---------------------------------------------------------------------------
  const callbacksInitializedRef = useRef(false);

  useEffect(() => {
    if (callbacksInitializedRef.current) return;
    callbacksInitializedRef.current = true;

    const stopMicAfterUtterance = () => {
      if (isListeningRef.current) {
        voiceManager.stopListening();
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    // Speech result handler: core of the state machine
    voiceManager.onSpeechResult((text, isFinal) => {
      // Always update the transcript for UI display
      setTranscriptRef.current(text);

      if (!isFinal) return;

      const state = agentStateRef.current;
      if (state !== 'listening' && state !== 'confirming') return;

      // Utterance complete — stop mic; user must click mic again for next input
      stopMicAfterUtterance();

      const cleaned = normalizeVoiceTranscript(text);
      setTranscriptRef.current(cleaned);

      const voiceCmd = voiceCommandRouter.detect(cleaned);
      if (voiceCmd === 'undo') {
        undoRef.current();
        setAgentStateRef.current('idle');
        return;
      }
      if (voiceCmd === 'export') {
        exportSVGActionRef.current?.();
        setAgentStateRef.current('idle');
        return;
      }

      const phraseType = endPhraseDetector.detect(cleaned);

      if (phraseType === 'correction') {
        setConfirmationRef.current('');
        setAgentStateRef.current('idle');
        return;
      }

      if (phraseType === 'end') {
        if (state === 'confirming') {
          processConfirmationRef.current(cleaned).catch((err) => {
            setErrorRef.current(err instanceof Error ? err.message : '执行失败');
          });
        } else if (state === 'listening' && !isProcessingRef.current) {
          // One-shot utterance with direct-draw intent (e.g. 「现在就画」)
          isProcessingRef.current = true;
          processVoiceInputRef.current(cleaned)
            .then(() => {
              isProcessingRef.current = false;
            })
            .catch((err) => {
              isProcessingRef.current = false;
              setErrorRef.current(err instanceof Error ? err.message : '处理失败');
            });
        }
        return;
      }

      // No end/correction phrase — send to LLM
      if (!isProcessingRef.current) {
        isProcessingRef.current = true;
        processVoiceInputRef.current(cleaned)
          .then(() => {
            isProcessingRef.current = false;
          })
          .catch((err) => {
            isProcessingRef.current = false;
            setErrorRef.current(err instanceof Error ? err.message : '处理失败');
          });
      }
    });

    // State change: track listening state only (voice errors handled separately)
    voiceManager.onStateChange((state) => {
      isListeningRef.current = state.isListening;
      setIsListening(state.isListening);
    });

    // Voice errors stay local — recoverable STT errors keep the session alive
    voiceManager.onError((errorMsg, code) => {
      setVoiceError(errorMsg);
      if (!voiceManager.isRecoverableError(code)) {
        isListeningRef.current = false;
        setIsListening(false);
        setAgentStateRef.current('idle');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset wake-word detector when returning to idle (manual mic click only)
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
      void voiceManager.startListening().then(() => {
        const listening = voiceManager.getState().isListening;
        isListeningRef.current = listening;
        setIsListening(listening);
      });
    }
  }, [voiceManager, wakeWordDetector, setAgentState]);

  /** Manually stop listening. */
  const stopListening = useCallback(() => {
    voiceManager.stopListening();
    isListeningRef.current = false;
    setIsListening(false);
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

  exportSVGActionRef.current = exportSVGAction;

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
    isListening,
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
    demoMode,
  };
}
