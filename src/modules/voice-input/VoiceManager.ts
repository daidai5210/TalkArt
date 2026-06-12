/**
 * @module voice-input/VoiceManager
 * STT: browser recording + MiMo ASR (cloud). TTS handled separately in voice-output.
 */

import type { STTEngineLike } from './STTEngine';
import { createDefaultSTTEngine } from './createSTTEngine';
import type { VoiceManagerState } from './types';
import type { STTResult } from './STTEngine';

const ERRORS = {
  NOT_SUPPORTED: '您的浏览器不支持麦克风录音，请使用文字输入',
  PERMISSION_DENIED: '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
  MIC_UNAVAILABLE: '无法访问麦克风，请检查设备是否已连接',
} as const;

export class VoiceManager {
  private engine: STTEngineLike;
  private state: VoiceManagerState;
  private speechResultCallbacks: Array<(text: string, isFinal: boolean) => void> = [];
  private stateChangeCallbacks: Array<(state: VoiceManagerState) => void> = [];
  private errorCallbacks: Array<(error: string, code: string) => void> = [];

  constructor(engine?: STTEngineLike) {
    this.engine = engine ?? createDefaultSTTEngine();
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

  private handleSTTResult(result: STTResult): void {
    this.speechResultCallbacks.forEach((cb) => {
      cb(result.transcript, result.isFinal);
    });
  }

  private handleSTTError(error: string, code: string): void {
    if (this.isRecoverableError(code)) {
      this.notifyError(error, code);
      return;
    }
    this.updateState({ isListening: false, error });
    this.notifyError(error, code);
  }

  private handleSTTEnd(): void {
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
    this.notifyError(message, 'permission_denied');
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
    return code === 'transcription-failed' || code === 'no-speech';
  }
}
