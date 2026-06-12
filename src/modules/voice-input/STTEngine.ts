/**
 * Speech-to-Text (STT) engine interface.
 *
 * STT: browser records audio, BFF calls MiMo ASR (mimo-v2.5-asr).
 * TTS uses browser SpeechSynthesis (see voice-output module).
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
