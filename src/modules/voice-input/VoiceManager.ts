/**
 * @module voice-input/VoiceManager
 * Browser STT input via SpeechRecognition (no cloud speech API key).
 */

import type { STTEngineLike } from './STTEngine';
import { WebSpeechSTTEngine } from './WebSpeechSTTEngine';
import type { VoiceManagerState } from './types';
import type { STTResult } from './STTEngine';

const ERRORS = {
  NOT_SUPPORTED: '您的浏览器不支持语音识别，请使用 Chrome/Edge 或文字输入',
  PERMISSION_DENIED: '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
} as const;

export class VoiceManager {
  private engine: STTEngineLike;
  private state: VoiceManagerState;
  private speechResultCallbacks: Array<(text: string, isFinal: boolean) => void> = [];
  private stateChangeCallbacks: Array<(state: VoiceManagerState) => void> = [];
  private errorCallbacks: Array<(error: string, code: string) => void> = [];

  constructor(engine?: STTEngineLike) {
    this.engine = engine ?? new WebSpeechSTTEngine();
    this.state = {
      isListening: false,
      isSupported: this.engine.isSupported(),
      error: null,
    };

    this.engine.onResult(this.handleSTTResult.bind(this));
    this.engine.onError(this.handleSTTError.bind(this));
    this.engine.onEnd(this.handleSTTEnd.bind(this));
  }

  async startListening(): Promise<void> {
    if (!this.state.isSupported) {
      this.updateState({ error: ERRORS.NOT_SUPPORTED });
      this.notifyError(ERRORS.NOT_SUPPORTED, 'browser_not_supported');
      return;
    }

    if (this.state.isListening) {
      return;
    }

    this.updateState({ error: null });

    try {
      await this.engine.start();
      this.updateState({ isListening: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : ERRORS.PERMISSION_DENIED;
      this.updateState({ error: message, isListening: false });
      this.notifyError(message, 'start_failed');
    }
  }

  stopListening(): void {
    if (!this.state.isListening) return;

    this.engine.stop();
    this.updateState({ isListening: false, error: null });
  }

  onSpeechResult(callback: (text: string, isFinal: boolean) => void): void {
    this.speechResultCallbacks.push(callback);
  }

  onStateChange(callback: (state: VoiceManagerState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  onError(callback: (error: string, code: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  isSupported(): boolean {
    return this.state.isSupported;
  }

  getState(): VoiceManagerState {
    return { ...this.state };
  }

  private handleSTTResult(result: STTResult): void {
    this.speechResultCallbacks.forEach((cb) => {
      cb(result.transcript, result.isFinal);
    });
  }

  private handleSTTError(error: string, code: string): void {
    this.updateState({ isListening: false, error });
    this.notifyError(error, code);
  }

  private handleSTTEnd(): void {
    if (this.state.isListening) {
      this.updateState({ isListening: false });
    }
  }

  private updateState(partial: Partial<VoiceManagerState>): void {
    this.state = { ...this.state, ...partial };
    this.stateChangeCallbacks.forEach((cb) => cb(this.getState()));
  }

  private notifyError(error: string, code = 'unknown'): void {
    this.errorCallbacks.forEach((cb) => cb(error, code));
  }

  clearError(): void {
    if (!this.state.error) return;
    this.updateState({ error: null });
  }

  isRecoverableError(code: string): boolean {
    return code === 'network' || code === 'no-speech' || code === 'service-not-allowed';
  }
}
