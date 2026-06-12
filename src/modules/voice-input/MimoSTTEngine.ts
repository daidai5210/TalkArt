/**
 * @module voice-input/MimoSTTEngine
 * Microphone PCM capture + Xiaomi MiMo ASR via BFF (/api/stt).
 */

import { encodePcmAsWavDataUrl } from './audio-utils';
import { PcmRecorder } from './pcm-recorder';
import { transcribeAudioDataUrl } from './stt-client';
import type { STTEngineLike, STTResult } from './STTEngine';

const INTERIM_INTERVAL_MS = 2000;
/** Stop and send transcript after this much silence following speech (ms). */
export const SILENCE_FINALIZE_MS = 1500;
const MIN_DURATION_MS = 600;
const SPEECH_RMS_THRESHOLD = 0.008;
const SILENCE_CHECK_MS = 250;

function mergeTranscript(current: string, next: string): string {
  const trimmed = next.trim();
  if (!trimmed) return current;
  if (!current) return trimmed;
  if (current.endsWith(trimmed) || trimmed.startsWith(current)) {
    return trimmed.length > current.length ? trimmed : current;
  }
  return `${current}${trimmed}`;
}

export class MimoSTTEngine implements STTEngineLike {
  private recorder: PcmRecorder | null = null;
  private utteranceText = '';
  private transcriptionChain: Promise<void> = Promise.resolve();
  private interimTimer: ReturnType<typeof setInterval> | null = null;
  private silenceCheckTimer: ReturnType<typeof setInterval> | null = null;
  private lastSpeechAt = 0;
  private hasDetectedSpeech = false;
  private stopped = false;
  private lastInterimAt = 0;

  private resultCallbacks: Array<(result: STTResult) => void> = [];
  private errorCallbacks: Array<(error: string, code: string) => void> = [];
  private endCallbacks: Array<() => void> = [];

  async start(): Promise<void> {
    if (!this.isSupported()) return;

    this.abortInternal(false);

    this.stopped = false;
    this.utteranceText = '';
    this.hasDetectedSpeech = false;
    this.lastSpeechAt = 0;
    this.lastInterimAt = 0;

    this.recorder = new PcmRecorder();
    await this.recorder.start();

    this.interimTimer = setInterval(() => {
      if (this.stopped || !this.hasDetectedSpeech) return;
      void this.enqueueTranscription(false);
    }, INTERIM_INTERVAL_MS);

    this.silenceCheckTimer = setInterval(() => {
      this.checkSilence();
    }, SILENCE_CHECK_MS);
  }

  stop(): void {
    if (!this.recorder || this.stopped) return;
    this.stopped = true;
    this.clearTimers();
    this.recorder.stop();
    void this.finalizeSession();
  }

  abort(): void {
    this.abortInternal(true);
  }

  onResult(callback: (result: STTResult) => void): void {
    this.resultCallbacks.push(callback);
  }

  onError(callback: (error: string, code: string) => void): void {
    this.errorCallbacks.push(callback);
  }

  onEnd(callback: () => void): void {
    this.endCallbacks.push(callback);
  }

  isSupported(): boolean {
    return (
      typeof AudioContext !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia
    );
  }

  private checkSilence(): void {
    if (this.stopped || !this.recorder) return;

    const rms = this.recorder.getRecentRms(300);
    if (rms >= SPEECH_RMS_THRESHOLD) {
      this.hasDetectedSpeech = true;
      this.lastSpeechAt = Date.now();
      return;
    }

    if (!this.hasDetectedSpeech) return;

    const silentFor = Date.now() - this.lastSpeechAt;
    if (silentFor >= SILENCE_FINALIZE_MS) {
      this.stop();
    }
  }

  private enqueueTranscription(finalize: boolean): void {
    this.transcriptionChain = this.transcriptionChain
      .then(() => this.transcribeSnapshot(finalize))
      .catch((err) => {
        const message = err instanceof Error ? err.message : '语音转写失败';
        this.errorCallbacks.forEach((cb) => cb(message, 'transcription-failed'));
      });
  }

  private async transcribeSnapshot(finalize: boolean): Promise<void> {
    if (!this.recorder) return;

    const snapshot = this.recorder.getSnapshot();
    if (!snapshot || snapshot.durationMs < MIN_DURATION_MS) {
      if (finalize) this.finalizeUtterance();
      return;
    }

    if (!finalize) {
      const now = Date.now();
      if (now - this.lastInterimAt < INTERIM_INTERVAL_MS - 200) return;
      this.lastInterimAt = now;
    }

    const wavDataUrl = encodePcmAsWavDataUrl(snapshot.samples, snapshot.sampleRate);
    const text = await transcribeAudioDataUrl(wavDataUrl, 'zh');
    if (!text) {
      if (finalize) this.finalizeUtterance();
      return;
    }

    this.utteranceText = mergeTranscript(this.utteranceText, text);
    this.emitResult(this.utteranceText, false);

    if (finalize) {
      this.finalizeUtterance();
    }
  }

  private finalizeUtterance(): void {
    if (!this.utteranceText) return;
    this.emitResult(this.utteranceText, true);
    this.utteranceText = '';
    this.recorder?.clearSamples();
  }

  private async finalizeSession(): Promise<void> {
    this.enqueueTranscription(true);
    await this.transcriptionChain;
    this.recorder?.dispose();
    this.recorder = null;
    this.endCallbacks.forEach((cb) => cb());
  }

  private abortInternal(notifyEnd: boolean): void {
    this.stopped = true;
    this.clearTimers();
    this.recorder?.dispose();
    this.recorder = null;
    this.utteranceText = '';
    if (notifyEnd) {
      this.endCallbacks.forEach((cb) => cb());
    }
  }

  private emitResult(transcript: string, isFinal: boolean): void {
    const result: STTResult = {
      transcript,
      isFinal,
      confidence: isFinal ? 0.9 : 0.5,
    };
    this.resultCallbacks.forEach((cb) => cb(result));
  }

  private clearTimers(): void {
    if (this.interimTimer) {
      clearInterval(this.interimTimer);
      this.interimTimer = null;
    }
    if (this.silenceCheckTimer) {
      clearInterval(this.silenceCheckTimer);
      this.silenceCheckTimer = null;
    }
  }
}
