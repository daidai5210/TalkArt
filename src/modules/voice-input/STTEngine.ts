/**
 * Speech-to-Text (STT) engine interface.
 *
 * TalkArt uses browser SpeechRecognition for STT (same as TalkMate).
 * No cloud speech API key is required for voice input.
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
