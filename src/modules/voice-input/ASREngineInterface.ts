/**
 * Shared interface for ASR engine implementations.
 */

import type { ASRResult } from './types';

export interface ASREngineLike {
  start(stream?: MediaStream): Promise<void>;
  stop(): void;
  abort(): void;
  onResult(callback: (result: ASRResult) => void): void;
  onError(callback: (error: string, code: string) => void): void;
  onEnd(callback: () => void): void;
  isSupported(): boolean;
}
