/**
 * @module voice-input/VoiceManager
 * High-level manager that coordinates the ASR engine with the application.
 *
 * Responsibilities:
 * - Request microphone permission via getUserMedia before starting ASR
 * - Track and expose listening state to the UI
 * - Forward ASR results and errors to registered callbacks
 * - Provide graceful error handling for common failure modes
 *
 * The VoiceManager is designed to be used as a singleton (e.g. via the
 * `useVoiceManager` hook) and will be integrated with the AgentStore
 * in a later phase.
 */

import { ASREngine } from './ASREngine';
import type { VoiceManagerState, ASRResult } from './types';

/** Default error messages in Chinese for common failure scenarios. */
const ERRORS = {
  NOT_SUPPORTED: '您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器',
  PERMISSION_DENIED: '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
  MIC_UNAVAILABLE: '无法访问麦克风，请检查设备是否已连接',
} as const;

/**
 * VoiceManager coordinates microphone access and speech recognition.
 *
 * Usage:
 * ```ts
 * const manager = new VoiceManager();
 *
 * if (!manager.isSupported()) {
 *   alert('Browser not supported');
 *   return;
 * }
 *
 * manager.onSpeechResult((text, isFinal) => {
 *   console.log(isFinal ? 'Final:' : 'Interim:', text);
 * });
 *
 * manager.onStateChange((state) => {
 *   console.log('Listening:', state.isListening);
 * });
 *
 * await manager.startListening();
 * // ... later
 * manager.stopListening();
 * ```
 */
export class VoiceManager {
  private engine: ASREngine;
  private state: VoiceManagerState;
  private speechResultCallbacks: Array<(text: string, isFinal: boolean) => void> = [];
  private stateChangeCallbacks: Array<(state: VoiceManagerState) => void> = [];
  private errorCallbacks: Array<(error: string) => void> = [];

  constructor() {
    this.engine = new ASREngine();
    this.state = {
      isListening: false,
      isSupported: this.engine.isSupported(),
      error: null,
    };

    // Wire up ASR engine callbacks
    this.engine.onResult(this.handleASRResult.bind(this));
    this.engine.onError(this.handleASRError.bind(this));
    this.engine.onEnd(this.handleASREnd.bind(this));
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Start listening for speech.
   *
   * This method first requests microphone permission via getUserMedia,
   * which triggers the browser's permission dialog. If permission is
   * granted, the ASR engine is started.
   *
   * @throws {Error} If the browser does not support SpeechRecognition.
   */
  async startListening(): Promise<void> {
    if (!this.state.isSupported) {
      this.updateState({ error: ERRORS.NOT_SUPPORTED });
      this.notifyError(ERRORS.NOT_SUPPORTED);
      return;
    }

    if (this.state.isListening) {
      return; // Already listening
    }

    // Clear any previous error
    this.updateState({ error: null });

    try {
      // Request microphone permission – this triggers the browser dialog.
      // We don't actually use the stream; the ASR engine manages its own.
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Permission granted – start the ASR engine
      this.engine.start();
      this.updateState({ isListening: true });
    } catch (err) {
      this.handlePermissionError(err);
    }
  }

  /** Stop listening for speech. */
  stopListening(): void {
    if (!this.state.isListening) return;

    this.engine.stop();
    this.updateState({ isListening: false });
  }

  /**
   * Register a callback for speech recognition results.
   * @param callback - Called with (transcript, isFinal) for each result.
   */
  onSpeechResult(callback: (text: string, isFinal: boolean) => void): void {
    this.speechResultCallbacks.push(callback);
  }

  /**
   * Register a callback for state changes.
   * @param callback - Called with the new {@link VoiceManagerState}.
   */
  onStateChange(callback: (state: VoiceManagerState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Register a callback for errors.
   * @param callback - Called with a Chinese error message string.
   */
  onError(callback: (error: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Check whether the browser supports the Web Speech API.
   * Returns `false` on Firefox and most mobile browsers.
   */
  isSupported(): boolean {
    return this.state.isSupported;
  }

  /** Get the current state snapshot. */
  getState(): VoiceManagerState {
    return { ...this.state };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Handle ASR result events and forward to registered callbacks. */
  private handleASRResult(result: ASRResult): void {
    this.speechResultCallbacks.forEach((cb) => {
      cb(result.transcript, result.isFinal);
    });
  }

  /** Handle ASR error events and forward to registered callbacks. */
  private handleASRError(error: string): void {
    this.updateState({ error });
    this.notifyError(error);
  }

  /** Handle ASR end events – update state if we weren't expecting it. */
  private handleASREnd(): void {
    // The engine may end on its own (e.g. after a long silence).
    // Update our state to reflect that we're no longer listening.
    if (this.state.isListening) {
      this.updateState({ isListening: false });
    }
  }

  /** Handle getUserMedia permission errors. */
  private handlePermissionError(err: unknown): void {
    let message: string = ERRORS.MIC_UNAVAILABLE;

    if (err instanceof DOMException) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = ERRORS.PERMISSION_DENIED;
      }
    }

    this.updateState({ error: message, isListening: false });
    this.notifyError(message);
  }

  /** Update internal state and notify listeners. */
  private updateState(partial: Partial<VoiceManagerState>): void {
    this.state = { ...this.state, ...partial };
    this.stateChangeCallbacks.forEach((cb) => cb(this.getState()));
  }

  /** Notify error callbacks. */
  private notifyError(error: string): void {
    this.errorCallbacks.forEach((cb) => cb(error));
  }
}
