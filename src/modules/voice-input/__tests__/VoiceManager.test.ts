/**
 * @module voice-input/__tests__/VoiceManager.test
 * Unit tests for VoiceManager with injectable STT engine mock.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceManager } from '../VoiceManager';
import type { STTEngineLike, STTResult } from '../STTEngine';
import type { VoiceManagerState } from '../types';

const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
});

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
  Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
    configurable: true,
  });

  class MockMediaRecorder {
    static isTypeSupported = vi.fn().mockReturnValue(true);
    start = vi.fn();
    stop = vi.fn();
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    state = 'inactive';
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).MediaRecorder = MockMediaRecorder;

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

  it('should initialize with correct default state', () => {
    const manager = new VoiceManager(createMockEngine());
    const state = manager.getState();
    expect(state.isListening).toBe(false);
    expect(state.isSupported).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should call getUserMedia when startListening is called', async () => {
    const engine = createMockEngine();
    const manager = new VoiceManager(engine);
    await manager.startListening();

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(engine.startMock).toHaveBeenCalled();
  });

  it('should set isListening=true after startListening succeeds', async () => {
    const manager = new VoiceManager(createMockEngine());
    await manager.startListening();

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

  it('should handle permission denied error', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError'),
    );

    const manager = new VoiceManager(createMockEngine());
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.startListening();

    expect(manager.getState().isListening).toBe(false);
    expect(manager.getState().error).toContain('权限被拒绝');
    expect(errorCallback).toHaveBeenCalledWith(
      expect.stringContaining('权限被拒绝'),
      'unknown',
    );
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

  it('should forward interim STT results to onSpeechResult callback', async () => {
    const engine = createMockEngine();
    const manager = new VoiceManager(engine);
    const speechCallback = vi.fn();
    manager.onSpeechResult(speechCallback);

    await manager.startListening();
    engine.emitResult({
      transcript: '画一个',
      isFinal: false,
      confidence: 0.6,
    });

    expect(speechCallback).toHaveBeenCalledWith('画一个', false);
  });

  it('should notify state change callbacks when state changes', async () => {
    const manager = new VoiceManager(createMockEngine());
    const stateCallback = vi.fn();
    manager.onStateChange(stateCallback);

    await manager.startListening();

    const listeningCall = stateCallback.mock.calls.find(
      (call: [VoiceManagerState]) => call[0].isListening === true,
    );
    expect(listeningCall).toBeDefined();
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
