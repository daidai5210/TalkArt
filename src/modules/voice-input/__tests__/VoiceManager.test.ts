/**
 * @module voice-input/__tests__/VoiceManager.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceManager } from '../VoiceManager';
import type { STTEngineLike, STTResult } from '../STTEngine';
import type { VoiceManagerState } from '../types';

type MockEngine = STTEngineLike & {
  emitResult: (result: STTResult) => void;
  emitError: (error: string, code?: string) => void;
  emitEnd: () => void;
  startMock: ReturnType<typeof vi.fn>;
  stopMock: ReturnType<typeof vi.fn>;
};

function createMockEngine(isSupported = true): MockEngine {
  const resultCallbacks: Array<(result: STTResult) => void> = [];
  const errorCallbacks: Array<(error: string, code: string) => void> = [];
  const endCallbacks: Array<() => void> = [];
  const startMock = vi.fn().mockResolvedValue(undefined);
  const stopMock = vi.fn();

  return {
    start: startMock,
    stop: stopMock,
    abort: vi.fn(),
    onResult: (callback) => {
      resultCallbacks.push(callback);
    },
    onError: (callback) => {
      errorCallbacks.push(callback);
    },
    onEnd: (callback) => {
      endCallbacks.push(callback);
    },
    isSupported: () => isSupported,
    emitResult: (result) => {
      resultCallbacks.forEach((cb) => cb(result));
    },
    emitError: (error, code = 'test') => {
      errorCallbacks.forEach((cb) => cb(error, code));
    },
    emitEnd: () => {
      endCallbacks.forEach((cb) => cb());
    },
    startMock,
    stopMock,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('VoiceManager', () => {
  it('should report isSupported=true when the STT engine is available', () => {
    const manager = new VoiceManager(createMockEngine(true));
    expect(manager.isSupported()).toBe(true);
  });

  it('should report isSupported=false when the STT engine is unavailable', () => {
    const manager = new VoiceManager(createMockEngine(false));
    expect(manager.isSupported()).toBe(false);
  });

  it('should call engine.start when startListening is called', async () => {
    const engine = createMockEngine();
    const manager = new VoiceManager(engine);
    await manager.startListening();

    expect(engine.startMock).toHaveBeenCalled();
    expect(manager.getState().isListening).toBe(true);
  });

  it('should set isListening=false after stopListening', async () => {
    const engine = createMockEngine();
    const manager = new VoiceManager(engine);
    await manager.startListening();
    manager.stopListening();

    expect(manager.getState().isListening).toBe(false);
    expect(manager.getState().error).toBeNull();
    expect(engine.stopMock).toHaveBeenCalled();
  });

  it('should forward STT results to onSpeechResult callback', async () => {
    const engine = createMockEngine();
    const manager = new VoiceManager(engine);
    const speechCallback = vi.fn();
    manager.onSpeechResult(speechCallback);

    await manager.startListening();
    engine.emitResult({
      transcript: '画一个红色的圆',
      isFinal: true,
      confidence: 0.92,
    });

    expect(speechCallback).toHaveBeenCalledWith('画一个红色的圆', true);
  });

  it('should not start listening when STT is not supported', async () => {
    const manager = new VoiceManager(createMockEngine(false));
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.startListening();

    expect(manager.getState().isListening).toBe(false);
    expect(manager.getState().error).toContain('不支持');
    expect(errorCallback).toHaveBeenCalled();
  });
});
