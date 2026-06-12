/**
 * @module voice-input/__tests__/VoiceManager.test
 * Unit tests for VoiceManager and ASREngine.
 *
 * The Web Speech API is not available in jsdom, so we mock
 * SpeechRecognition and navigator.mediaDevices entirely.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceManager } from '../VoiceManager';
import { ASREngine } from '../ASREngine';
import type { ASREngineLike } from '../ASREngineInterface';
import type { ASRResult, VoiceManagerState } from '../types';

// ---------------------------------------------------------------------------
// Mock: SpeechRecognition (Web Speech API)
// ---------------------------------------------------------------------------

type MockRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

let mockRecognitionInstance: MockRecognitionInstance;

const MockSpeechRecognition = vi.fn().mockImplementation(() => {
  mockRecognitionInstance = {
    continuous: false,
    interimResults: false,
    lang: '',
    maxAlternatives: 1,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    onresult: null,
    onerror: null,
    onend: null,
  };
  return mockRecognitionInstance;
});

// ---------------------------------------------------------------------------
// Mock: navigator.mediaDevices.getUserMedia
// ---------------------------------------------------------------------------

const mockGetUserMedia = vi.fn().mockResolvedValue({
  getTracks: () => [{ stop: vi.fn() }],
});

type MockEngine = ASREngineLike & {
  emitResult: (result: ASRResult) => void;
  emitError: (error: string, code?: string) => void;
  emitEnd: () => void;
  startMock: ReturnType<typeof vi.fn>;
  stopMock: ReturnType<typeof vi.fn>;
};

function createMockEngine(isSupported = true): MockEngine {
  const resultCallbacks: Array<(result: ASRResult) => void> = [];
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

// ---------------------------------------------------------------------------
// Test setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Mock window.SpeechRecognition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).SpeechRecognition = MockSpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webkitSpeechRecognition = undefined;

  // Mock getUserMedia
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

  // Reset all mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up window mocks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).SpeechRecognition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).webkitSpeechRecognition;
});

// ---------------------------------------------------------------------------
// ASREngine tests
// ---------------------------------------------------------------------------

describe('ASREngine', () => {
  it('should report isSupported=true when SpeechRecognition is available', () => {
    const engine = new ASREngine();
    expect(engine.isSupported()).toBe(true);
  });

  it('should report isSupported=false when SpeechRecognition is not available', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;

    const engine = new ASREngine();
    expect(engine.isSupported()).toBe(false);
  });

  it('should use webkitSpeechRecognition as fallback', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitSpeechRecognition = MockSpeechRecognition;

    const engine = new ASREngine();
    expect(engine.isSupported()).toBe(true);
  });

  it('should configure recognition with continuous=true and interimResults=true', () => {
    new ASREngine(); // eslint-disable-line no-new
    expect(mockRecognitionInstance.continuous).toBe(true);
    expect(mockRecognitionInstance.interimResults).toBe(true);
  });

  it('should set lang to zh-CN by default', () => {
    new ASREngine(); // eslint-disable-line no-new
    expect(mockRecognitionInstance.lang).toBe('zh-CN');
  });

  it('should allow setting a custom language', () => {
    new ASREngine('en-US'); // eslint-disable-line no-new
    expect(mockRecognitionInstance.lang).toBe('en-US');
  });

  it('should call recognition.start() on start()', async () => {
    const engine = new ASREngine();
    await engine.start();
    expect(mockRecognitionInstance.start).toHaveBeenCalled();
  });

  it('should call recognition.stop() on stop()', () => {
    const engine = new ASREngine();
    engine.stop();
    expect(mockRecognitionInstance.stop).toHaveBeenCalled();
  });

  it('should call recognition.abort() on abort()', () => {
    const engine = new ASREngine();
    engine.abort();
    expect(mockRecognitionInstance.abort).toHaveBeenCalled();
  });

  it('should invoke onResult callback with ASRResult when result event fires', () => {
    const engine = new ASREngine();
    const callback = vi.fn();
    engine.onResult(callback);

    // Simulate a SpeechRecognition result event
    const mockEvent = {
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal: false,
          0: { transcript: '你好', confidence: 0.85 },
          length: 1,
        },
      },
    } as unknown as SpeechRecognitionEvent;

    mockRecognitionInstance.onresult!(mockEvent);

    expect(callback).toHaveBeenCalledWith({
      transcript: '你好',
      isFinal: false,
      confidence: 0.85,
    } satisfies ASRResult);
  });

  it('should invoke onResult with isFinal=true for final results', () => {
    const engine = new ASREngine();
    const callback = vi.fn();
    engine.onResult(callback);

    const mockEvent = {
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal: true,
          0: { transcript: '画一个圆', confidence: 0.95 },
          length: 1,
        },
      },
    } as unknown as SpeechRecognitionEvent;

    mockRecognitionInstance.onresult!(mockEvent);

    expect(callback).toHaveBeenCalledWith({
      transcript: '画一个圆',
      isFinal: true,
      confidence: 0.95,
    } satisfies ASRResult);
  });

  it('should invoke onError callback with Chinese error message', () => {
    const engine = new ASREngine();
    const callback = vi.fn();
    engine.onError(callback);

    const mockErrorEvent = {
      error: 'not-allowed',
    } as unknown as SpeechRecognitionErrorEvent;

    mockRecognitionInstance.onerror!(mockErrorEvent);

    expect(callback).toHaveBeenCalledWith(
      '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问',
      'not-allowed',
    );
  });

  it('should ignore aborted errors when recognition is stopped', () => {
    const engine = new ASREngine();
    const callback = vi.fn();
    engine.onError(callback);

    const mockErrorEvent = {
      error: 'aborted',
    } as unknown as SpeechRecognitionErrorEvent;

    mockRecognitionInstance.onerror!(mockErrorEvent);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should provide a fallback Chinese message for unknown errors', () => {
    const engine = new ASREngine();
    const callback = vi.fn();
    engine.onError(callback);

    const mockErrorEvent = {
      error: 'some-unknown-error',
    } as unknown as SpeechRecognitionErrorEvent;

    mockRecognitionInstance.onerror!(mockErrorEvent);

    expect(callback).toHaveBeenCalledWith(
      '语音识别错误: some-unknown-error',
      'some-unknown-error',
    );
  });

  it('should invoke onEnd callback when recognition ends', () => {
    const engine = new ASREngine();
    const callback = vi.fn();
    engine.onEnd(callback);

    mockRecognitionInstance.onend!();

    expect(callback).toHaveBeenCalled();
  });

  it('should support multiple onResult callbacks', () => {
    const engine = new ASREngine();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    engine.onResult(cb1);
    engine.onResult(cb2);

    const mockEvent = {
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal: true,
          0: { transcript: '测试', confidence: 0.9 },
          length: 1,
        },
      },
    } as unknown as SpeechRecognitionEvent;

    mockRecognitionInstance.onresult!(mockEvent);

    expect(cb1).toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// VoiceManager tests
// ---------------------------------------------------------------------------

describe('VoiceManager', () => {
  it('should report isSupported=true when the ASR engine is available', () => {
    const manager = new VoiceManager(createMockEngine(true));
    expect(manager.isSupported()).toBe(true);
  });

  it('should report isSupported=false when the ASR engine is unavailable', () => {
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

  it('should call engine.start() after getUserMedia succeeds', async () => {
    const engine = createMockEngine();
    const manager = new VoiceManager(engine);
    await manager.startListening();

    expect(engine.startMock).toHaveBeenCalled();
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

  it('should handle mic unavailable error', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Not found', 'NotFoundError'),
    );

    const manager = new VoiceManager(createMockEngine());
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.startListening();

    expect(manager.getState().isListening).toBe(false);
    expect(errorCallback).toHaveBeenCalled();
  });

  it('should forward ASR results to onSpeechResult callback', async () => {
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

  it('should forward interim results to onSpeechResult callback', async () => {
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

  it('should update state when recognition ends on its own', async () => {
    const engine = createMockEngine();
    const manager = new VoiceManager(engine);
    await manager.startListening();

    expect(manager.getState().isListening).toBe(true);
    engine.emitEnd();

    expect(manager.getState().isListening).toBe(false);
  });

  it('should not start listening when browser is not supported', async () => {
    const manager = new VoiceManager(createMockEngine(false));
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.startListening();

    expect(manager.getState().isListening).toBe(false);
    expect(manager.getState().error).toContain('不支持');
    expect(errorCallback).toHaveBeenCalled();
  });

  it('should not call startListening twice if already listening', async () => {
    const manager = new VoiceManager(createMockEngine());
    await manager.startListening();
    await manager.startListening();

    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
  });

  it('should not call stopListening if not listening', () => {
    const manager = new VoiceManager(createMockEngine());
    manager.stopListening();
  });

  it('should clear previous error on successful startListening', async () => {
    const manager = new VoiceManager(createMockEngine());

    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError'),
    );
    await manager.startListening();
    expect(manager.getState().error).not.toBeNull();

    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: vi.fn() }],
    });
    await manager.startListening();
    expect(manager.getState().error).toBeNull();
  });
});
