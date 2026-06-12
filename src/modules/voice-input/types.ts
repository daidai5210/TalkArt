/**
 * @module voice-input/types
 * Type definitions for the TalkArt voice input module.
 *
 * These types define the state shape for VoiceManager and the
 * result format produced by the ASR (Automatic Speech Recognition) engine.
 */

/** Current state of the VoiceManager, exposed to the UI via callbacks. */
export interface VoiceManagerState {
  /** Whether the microphone is currently active and listening. */
  isListening: boolean;
  /** Whether the browser supports microphone recording for ASR. */
  isSupported: boolean;
  /** Human-readable error message (Chinese), or null when no error. */
  error: string | null;
}

/** A single recognition result emitted by the ASR engine. */
export interface ASRResult {
  /** The recognized text transcript. */
  transcript: string;
  /** Whether this is a final (stable) result or an interim (partial) result. */
  isFinal: boolean;
  /** Confidence score from 0 to 1; may be 0 for interim results. */
  confidence: number;
}
