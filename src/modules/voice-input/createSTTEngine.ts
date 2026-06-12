/**
 * Create the default STT engine.
 * Prefers MiMo cloud ASR (works in China); falls back to browser SpeechRecognition.
 */

import type { STTEngineLike } from './STTEngine';
import { MimoSTTEngine } from './MimoSTTEngine';
import { WebSpeechSTTEngine } from './WebSpeechSTTEngine';

export function createDefaultSTTEngine(): STTEngineLike {
  // MiMo ASR is the primary path — browser SpeechRecognition often fails with
  // network errors in China because it depends on Google cloud.
  if (new MimoSTTEngine().isSupported()) {
    return new MimoSTTEngine();
  }
  return new WebSpeechSTTEngine('zh-CN');
}
