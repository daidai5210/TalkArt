/**
 * @module voice-input
 * Browser STT input: microphone recording + cloud transcription.
 */

export { VoiceManager } from './VoiceManager';
export { BrowserSTTEngine } from './BrowserSTTEngine';
export { transcribeAudioBlob } from './stt-client';
export type { STTEngineLike, STTResult } from './STTEngine';
export { WakeWordDetector } from './WakeWordDetector';
export { EndPhraseDetector } from './EndPhraseDetector';
export type { PhraseType } from './EndPhraseDetector';
export type { VoiceManagerState } from './types';
