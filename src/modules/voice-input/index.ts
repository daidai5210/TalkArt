/**
 * @module voice-input
 * Barrel export for the TalkArt voice input module.
 */

export { VoiceManager } from './VoiceManager';
export { ASREngine } from './ASREngine';
export { WhisperASREngine } from './WhisperASREngine';
export { transcribeAudioBlob } from './asr-client';
export type { ASREngineLike } from './ASREngineInterface';
export { WakeWordDetector } from './WakeWordDetector';
export { EndPhraseDetector } from './EndPhraseDetector';
export type { PhraseType } from './EndPhraseDetector';
export type { VoiceManagerState, ASRResult } from './types';
