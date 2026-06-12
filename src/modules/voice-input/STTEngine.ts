/**
 * Speech-to-Text (STT) engine interface.
 *
 * STT flow: browser records microphone audio → BFF transcribes via cloud API.
 * This is intentionally separate from browser SpeechRecognition (Web Speech API).
 */

export interface STTResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface STTEngineLike {
  start(stream?: MediaStream): Promise<void>;
  stop(): void;
  abort(): void;
  onResult(callback: (result: STTResult) => void): void;
  onError(callback: (error: string, code: string) => void): void;
  onEnd(callback: () => void): void;
  isSupported(): boolean;
}
