/**
 * @module voice-input/BrowserSTTEngine
 * Browser microphone recording + cloud STT via BFF (/api/stt).
 */

import { transcribeAudioBlob } from './stt-client';
import type { STTEngineLike, STTResult } from './STTEngine';

const CHUNK_MS = 2500;
const SILENCE_FINALIZE_MS = 1800;
const MIN_CHUNK_BYTES = 1200;

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

function mergeTranscript(current: string, next: string): string {
  const trimmed = next.trim();
  if (!trimmed) return current;
  if (!current) return trimmed;
  if (current.endsWith(trimmed) || trimmed.startsWith(current)) {
    return trimmed.length > current.length ? trimmed : current;
  }
  return `${current}${trimmed}`;
}

export class BrowserSTTEngine implements STTEngineLike {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private utteranceText = '';
  private transcriptionChain: Promise<void> = Promise.resolve();
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  private resultCallbacks: Array<(result: STTResult) => void> = [];
  private errorCallbacks: Array<(error: string, code: string) => void> = [];
  private endCallbacks: Array<() => void> = [];

  async start(stream?: MediaStream): Promise<void> {
    if (!this.isSupported()) return;

    this.stopped = false;
    this.utteranceText = '';
    this.mediaStream = stream ?? await navigator.mediaDevices.getUserMedia({ audio: true });

    const mimeType = pickMimeType();
    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.mediaStream, { mimeType })
      : new MediaRecorder(this.mediaStream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size >= MIN_CHUNK_BYTES) {
        this.enqueueTranscription(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      void this.finalizeSession();
    };

    this.mediaRecorder.start(CHUNK_MS);
  }

  stop(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return;
    }
    this.stopped = true;
    this.mediaRecorder.stop();
  }

  abort(): void {
    this.stopped = true;
    this.clearSilenceTimer();
    try {
      this.mediaRecorder?.stop();
    } catch {
      // ignore
    }
    this.cleanupStream();
    this.mediaRecorder = null;
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
      typeof MediaRecorder !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia
    );
  }

  private enqueueTranscription(blob: Blob): void {
    this.transcriptionChain = this.transcriptionChain
      .then(() => this.transcribeChunk(blob))
      .catch((err) => {
        const message = err instanceof Error ? err.message : '语音转写失败';
        this.errorCallbacks.forEach((cb) => cb(message, 'transcription-failed'));
      });
  }

  private async transcribeChunk(blob: Blob): Promise<void> {
    const text = await transcribeAudioBlob(blob);
    if (!text) return;

    this.utteranceText = mergeTranscript(this.utteranceText, text);
    this.emitResult(this.utteranceText, false);
    this.scheduleFinalize();
  }

  private scheduleFinalize(): void {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      this.finalizeUtterance();
    }, SILENCE_FINALIZE_MS);
  }

  private finalizeUtterance(): void {
    if (!this.utteranceText) return;
    this.emitResult(this.utteranceText, true);
    this.utteranceText = '';
  }

  private async finalizeSession(): Promise<void> {
    this.clearSilenceTimer();
    await this.transcriptionChain;
    if (this.utteranceText) {
      this.emitResult(this.utteranceText, true);
      this.utteranceText = '';
    }
    this.cleanupStream();
    this.mediaRecorder = null;
    if (this.stopped) {
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

  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private cleanupStream(): void {
    if (!this.mediaStream) return;
    this.mediaStream.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }
}
