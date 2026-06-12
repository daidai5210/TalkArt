/**
 * @module voice-input/types
 * Type definitions for the TalkArt voice input module.
 */

/** Current state of the VoiceManager, exposed to the UI via callbacks. */
export interface VoiceManagerState {
  /** Whether the microphone is currently active and recording. */
  isListening: boolean;
  /** Whether the browser supports microphone recording for STT. */
  isSupported: boolean;
  /** Human-readable error message (Chinese), or null when no error. */
  error: string | null;
}
