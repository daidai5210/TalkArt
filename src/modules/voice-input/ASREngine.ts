/**
 * @module voice-input/ASREngine
 * Low-level wrapper around the browser Web Speech API (SpeechRecognition).
 *
 * Provides a thin, event-driven abstraction that:
 * - Detects browser support for SpeechRecognition
 * - Configures continuous listening with interim results
 * - Normalises result / error / end events into simple callbacks
 *
 * NOTE: The Web Speech API is currently best supported in Chromium-based
 * browsers (Chrome, Edge). Firefox and most mobile browsers do **not**
 * implement SpeechRecognition, so callers must check `isSupported()`
 * before using this engine.
 */

import type { ASREngineLike } from './ASREngineInterface';
import type { ASRResult } from './types';

/**
 * Map of SpeechRecognition error codes to user-friendly Chinese messages.
 * See https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent
 */
const ERROR_MESSAGES: Record<string, string> = {
  'no-speech': '未检测到语音，请再试一次',
  'aborted': '语音识别已中止',
  'audio-capture': '无法捕获音频，请检查麦克风是否连接',
  'network': '语音识别服务连接失败，请检查网络或使用下方文字输入',
  'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
  'service-not-allowed': '语音识别服务不可用，请使用下方文字输入',
  'bad-grammar': '语音识别语法错误',
  'language-not-supported': '不支持的语言',
};

/** Errors that should not surface as user-facing failures. */
const SILENT_ERROR_CODES = new Set(['aborted']);

/** Errors that are recoverable and should not block the rest of the app. */
const RECOVERABLE_ERROR_CODES = new Set(['no-speech', 'network', 'service-not-allowed']);

export function isSilentSpeechError(code: string): boolean {
  return SILENT_ERROR_CODES.has(code);
}

export function isRecoverableSpeechError(code: string): boolean {
  return RECOVERABLE_ERROR_CODES.has(code);
}

/** Default speech recognition language (Simplified Chinese). */
const DEFAULT_LANG = 'zh-CN';

/**
 * Resolve the SpeechRecognition constructor (or null if unsupported).
 * Chrome exposes it as `webkitSpeechRecognition`; the unprefixed
 * `SpeechRecognition` is the standard name.
 */
function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * ASREngine wraps the browser's SpeechRecognition API.
 *
 * Usage:
 * ```ts
 * const engine = new ASREngine();
 * if (!engine.isSupported()) { / handle unsupported / }
 * engine.onResult((r) => console.log(r.transcript, r.isFinal));
 * engine.start();
 * ```
 */
export class ASREngine implements ASREngineLike {
  private recognition: SpeechRecognition | null = null;
  private lang: string;
  private resultCallbacks: Array<(result: ASRResult) => void> = [];
  private errorCallbacks: Array<(error: string, code: string) => void> = [];
  private endCallbacks: Array<() => void> = [];

  /**
   * @param lang - BCP-47 language tag for recognition. Defaults to 'zh-CN'.
   */
  constructor(lang: string = DEFAULT_LANG) {
    this.lang = lang;
    this.initRecognition();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Start speech recognition.
   *
   * If a recognition instance already exists it will be stopped first,
   * then a fresh instance is created (the Web Speech API does not
   * reliably support restarting the same instance after `stop()`).
   */
  async start(_stream?: MediaStream): Promise<void> {
    if (!this.isSupported()) return;

    // Re-create the instance every time we start – the Web Speech API
    // does not allow calling start() again on a stopped recognition.
    this.initRecognition();

    try {
      this.recognition?.start();
    } catch (err) {
      // Already started – ignore
      if (err instanceof DOMException && err.name === 'InvalidStateError') {
        return;
      }
      throw err;
    }
  }

  /** Stop listening. The engine will finish processing any ongoing audio. */
  stop(): void {
    try {
      this.recognition?.stop();
    } catch {
      // Ignore if not started
    }
  }

  /** Immediately abort recognition without processing remaining audio. */
  abort(): void {
    try {
      this.recognition?.abort();
    } catch {
      // Ignore if not started
    }
  }

  /**
   * Register a callback for recognition results.
   * @param callback - Called with an {@link ASRResult} for each interim or final result.
   */
  onResult(callback: (result: ASRResult) => void): void {
    this.resultCallbacks.push(callback);
  }

  /**
   * Register a callback for recognition errors.
   * @param callback - Called with a Chinese error message string.
   */
  onError(callback: (error: string, code: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Register a callback for when recognition ends (whether by stop(), abort(),
   * or the engine itself after a silence timeout).
   */
  onEnd(callback: () => void): void {
    this.endCallbacks.push(callback);
  }

  /**
   * Check whether the browser supports the Web Speech API.
   * Returns `false` on Firefox and most mobile browsers.
   */
  isSupported(): boolean {
    return getSpeechRecognitionCtor() !== null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** (Re-)initialise the SpeechRecognition instance with current settings. */
  private initRecognition(): void {
    // Tear down any existing instance first
    if (this.recognition) {
      this.removeRecognitionListeners(this.recognition);
      try { this.recognition.abort(); } catch { /* noop */ }
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      this.recognition = null;
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true; // Keep listening after pauses
    recognition.interimResults = true; // Receive partial results
    recognition.lang = this.lang;
    recognition.maxAlternatives = 1;

    // -- Result event --------------------------------------------------------
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const resultLength = event.results.length;
      for (let i = event.resultIndex; i < resultLength; i++) {
        const result = event.results[i];
        const alternative = result[0];
        if (!alternative) continue;

        const asrResult: ASRResult = {
          transcript: alternative.transcript,
          isFinal: result.isFinal,
          confidence: alternative.confidence,
        };

        this.resultCallbacks.forEach((cb) => cb(asrResult));
      }
    };

    // -- Error event ---------------------------------------------------------
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (isSilentSpeechError(event.error)) {
        return;
      }
      const message = ERROR_MESSAGES[event.error] ?? `语音识别错误: ${event.error}`;
      this.errorCallbacks.forEach((cb) => cb(message, event.error));
    };

    // -- End event -----------------------------------------------------------
    recognition.onend = () => {
      this.endCallbacks.forEach((cb) => cb());
    };

    this.recognition = recognition;
  }

  /** Remove all event listeners from a recognition instance to avoid leaks. */
  private removeRecognitionListeners(recognition: SpeechRecognition): void {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
  }
}
