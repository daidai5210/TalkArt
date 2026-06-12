/**
 * @module voice-input/WebSpeechSTTEngine
 * Browser STT via SpeechRecognition API (TalkMate-compatible approach).
 *
 * Uses the browser's built-in speech recognition — no API key required.
 * DeepSeek / OpenAI keys are only used for LLM chat, not for STT.
 */

import type { STTEngineLike, STTResult } from './STTEngine';

const DEFAULT_LANG = 'zh-CN';

const ERROR_MESSAGES: Record<string, string> = {
  'no-speech': '未检测到语音，请再试一次',
  'audio-capture': '无法捕获音频，请检查麦克风是否连接',
  'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
  'network': '语音识别服务连接失败，请检查网络或使用文字输入',
  'service-not-allowed': '当前浏览器不支持语音识别，请使用文字输入',
};

const SILENT_ERRORS = new Set(['aborted']);

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export class WebSpeechSTTEngine implements STTEngineLike {
  private recognition: SpeechRecognition | null = null;
  private lang: string;
  private resultCallbacks: Array<(result: STTResult) => void> = [];
  private errorCallbacks: Array<(error: string, code: string) => void> = [];
  private endCallbacks: Array<() => void> = [];

  constructor(lang: string = DEFAULT_LANG) {
    this.lang = lang;
  }

  async start(_stream?: MediaStream): Promise<void> {
    if (!this.isSupported()) return;

    this.initRecognition();

    try {
      this.recognition?.start();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'InvalidStateError') {
        return;
      }
      throw err;
    }
  }

  stop(): void {
    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }
  }

  abort(): void {
    try {
      this.recognition?.abort();
    } catch {
      // ignore
    }
  }

  onResult(callback: (result: STTResult) => void): void {
    this.resultCallbacks.push(callback);
  }

  onError(callback: (error: string, code: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  onEnd(callback: () => void): void {
    this.endCallbacks.push(callback);
  }

  isSupported(): boolean {
    return getSpeechRecognitionCtor() !== null;
  }

  private initRecognition(): void {
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.recognition = null;
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];
        if (!alternative?.transcript) continue;

        const sttResult: STTResult = {
          transcript: alternative.transcript,
          isFinal: result.isFinal,
          confidence: alternative.confidence,
        };
        this.resultCallbacks.forEach((cb) => cb(sttResult));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (SILENT_ERRORS.has(event.error)) return;
      const message = ERROR_MESSAGES[event.error] ?? `语音识别错误: ${event.error}`;
      this.errorCallbacks.forEach((cb) => cb(message, event.error));
    };

    recognition.onend = () => {
      this.endCallbacks.forEach((cb) => cb());
    };

    this.recognition = recognition;
  }
}
