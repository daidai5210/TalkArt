/**
 * @module voice-input
 * Browser STT input via SpeechRecognition (TalkMate-compatible).
 */

export { VoiceManager } from './VoiceManager';
export { WebSpeechSTTEngine } from './WebSpeechSTTEngine';
export type { STTEngineLike, STTResult } from './STTEngine';
export { WakeWordDetector } from './WakeWordDetector';
export { EndPhraseDetector } from './EndPhraseDetector';
export type { PhraseType } from './EndPhraseDetector';
export type { VoiceManagerState } from './types';
