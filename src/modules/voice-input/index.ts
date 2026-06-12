/**
 * @module voice-input
 * STT: browser recording + MiMo ASR. TTS: see voice-output module.
 */

export { VoiceManager } from './VoiceManager';
export { MimoSTTEngine } from './MimoSTTEngine';
export { WebSpeechSTTEngine } from './WebSpeechSTTEngine';
export { transcribeAudioDataUrl } from './stt-client';
export type { STTEngineLike, STTResult } from './STTEngine';
export { WakeWordDetector } from './WakeWordDetector';
export { EndPhraseDetector } from './EndPhraseDetector';
export type { PhraseType } from './EndPhraseDetector';
export type { VoiceManagerState } from './types';
