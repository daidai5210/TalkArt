/**
 * Capture microphone audio as raw PCM via Web Audio API.
 * Avoids MediaRecorder/webm decode issues on Windows browsers.
 */

export interface PcmSnapshot {
  samples: Float32Array;
  sampleRate: number;
  durationMs: number;
}

export class PcmRecorder {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;
  private stream: MediaStream | null = null;
  private samples: Float32Array[] = [];
  private sampleRate = 44100;
  private recording = false;

  async start(): Promise<void> {
    this.dispose();
    this.samples = [];
    this.recording = true;

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext();
    this.sampleRate = this.audioContext.sampleRate;

    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;

    this.processor.onaudioprocess = (event) => {
      if (!this.recording) return;
      this.samples.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };

    source.connect(this.processor);
    this.processor.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  getSnapshot(): PcmSnapshot | null {
    if (this.samples.length === 0) return null;
    const merged = mergeFloat32Arrays(this.samples);
    return {
      samples: merged,
      sampleRate: this.sampleRate,
      durationMs: (merged.length / this.sampleRate) * 1000,
    };
  }

  getRecentRms(windowMs = 300): number {
    if (this.samples.length === 0) return 0;
    const windowSamples = Math.max(1, Math.floor((windowMs / 1000) * this.sampleRate));
    const merged = mergeFloat32Arrays(this.samples);
    const start = Math.max(0, merged.length - windowSamples);
    let sum = 0;
    for (let i = start; i < merged.length; i++) {
      sum += merged[i] * merged[i];
    }
    return Math.sqrt(sum / (merged.length - start));
  }

  clearSamples(): void {
    this.samples = [];
  }

  stop(): void {
    this.recording = false;
  }

  dispose(): void {
    this.recording = false;
    this.processor?.disconnect();
    this.gainNode?.disconnect();
    void this.audioContext?.close();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.processor = null;
    this.gainNode = null;
    this.audioContext = null;
    this.stream = null;
    this.samples = [];
  }
}

function mergeFloat32Arrays(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}
