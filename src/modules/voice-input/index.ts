/**
 * @module voice-input
 * Barrel export for the TalkArt voice input module.
 */

export { VoiceManager } from './VoiceManager';
export { ASREngine } from './ASREngine';
export { WakeWordDetector } from './WakeWordDetector';
export { EndPhraseDetector } from './EndPhraseDetector';
export type { PhraseType } from './EndPhraseDetector';
export type { VoiceManagerState, ASRResult } from './types';
