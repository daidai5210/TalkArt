/**
 * @module voice-input/VoiceManager
 * High-level manager that coordinates the ASR engine with the application.
 */

import type { ASREngineLike } from './ASREngineInterface';
import { WhisperASREngine } from './WhisperASREngine';
import type { VoiceManagerState, ASRResult } from './types';

/** Default error messages in Chinese for common failure scenarios. */
const ERRORS = {
  NOT_SUPPORTED: '您的浏览器不支持麦克风录音，请使用文字输入',
  PERMISSION_DENIED: '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
  MIC_UNAVAILABLE: '无法访问麦克风，请检查设备是否已连接',
} as const;

export class VoiceManager {
  private engine: ASREngineLike;
  private state: VoiceManagerState;
  private speechResultCallbacks: Array<(text: string, isFinal: boolean) => void> = [];
  private stateChangeCallbacks: Array<(state: VoiceManagerState) => void> = [];
  private errorCallbacks: Array<(error: string, code: string) => void> = [];

  constructor(engine?: ASREngineLike) {
    this.engine = engine ?? new WhisperASREngine();
    this.state = {
      isListening: false,
      isSupported: this.engine.isSupported(),
      error: null,
    };

    this.engine.onResult(this.handleASRResult.bind(this));
    this.engine.onError(this.handleASRError.bind(this));
    this.engine.onEnd(this.handleASREnd.bind(this));
  }

  async startListening(): Promise<void> {
    if (!this.state.isSupported) {
      this.updateState({ error: ERRORS.NOT_SUPPORTED });
      this.notifyError(ERRORS.NOT_SUPPORTED);
      return;
    }

    if (this.state.isListening) {
      return;
    }

    this.updateState({ error: null });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.engine.start(stream);
      this.updateState({ isListening: true });
    } catch (err) {
      this.handlePermissionError(err);
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

  private handleASRResult(result: ASRResult): void {
    this.speechResultCallbacks.forEach((cb) => {
      cb(result.transcript, result.isFinal);
    });
  }

  private handleASRError(error: string, code: string): void {
    this.updateState({ isListening: false, error });
    this.notifyError(error, code);
  }

  private handleASREnd(): void {
    if (this.state.isListening) {
      this.updateState({ isListening: false });
    }
  }

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
    return code === 'transcription-failed' || code === 'network' || code === 'no-speech';
  }
}
