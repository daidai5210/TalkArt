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

  it('should call recognition.start() on start()', () => {
    const engine = new ASREngine();
    engine.start();
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

    expect(callback).toHaveBeenCalledWith('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
  });

  it('should provide a fallback Chinese message for unknown errors', () => {
    const engine = new ASREngine();
    const callback = vi.fn();
    engine.onError(callback);

    const mockErrorEvent = {
      error: 'some-unknown-error',
    } as unknown as SpeechRecognitionErrorEvent;

    mockRecognitionInstance.onerror!(mockErrorEvent);

    expect(callback).toHaveBeenCalledWith('语音识别错误: some-unknown-error');
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
  it('should report isSupported=true when SpeechRecognition is available', () => {
    const manager = new VoiceManager();
    expect(manager.isSupported()).toBe(true);
  });

  it('should report isSupported=false when SpeechRecognition is not available', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;

    const manager = new VoiceManager();
    expect(manager.isSupported()).toBe(false);
  });

  it('should initialize with correct default state', () => {
    const manager = new VoiceManager();
    const state = manager.getState();
    expect(state.isListening).toBe(false);
    expect(state.isSupported).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should call getUserMedia when startListening is called', async () => {
    const manager = new VoiceManager();
    await manager.startListening();

    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('should set isListening=true after startListening succeeds', async () => {
    const manager = new VoiceManager();
    await manager.startListening();

    expect(manager.getState().isListening).toBe(true);
  });

  it('should call recognition.start() after getUserMedia succeeds', async () => {
    const manager = new VoiceManager();
    await manager.startListening();

    expect(mockRecognitionInstance.start).toHaveBeenCalled();
  });

  it('should set isListening=false after stopListening', async () => {
    const manager = new VoiceManager();
    await manager.startListening();
    manager.stopListening();

    expect(manager.getState().isListening).toBe(false);
    expect(mockRecognitionInstance.stop).toHaveBeenCalled();
  });

  it('should handle permission denied error', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError'),
    );

    const manager = new VoiceManager();
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.startListening();

    expect(manager.getState().isListening).toBe(false);
    expect(manager.getState().error).toContain('权限被拒绝');
    expect(errorCallback).toHaveBeenCalledWith(
      expect.stringContaining('权限被拒绝'),
    );
  });

  it('should handle mic unavailable error', async () => {
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Not found', 'NotFoundError'),
    );

    const manager = new VoiceManager();
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.startListening();

    expect(manager.getState().isListening).toBe(false);
    expect(errorCallback).toHaveBeenCalled();
  });

  it('should forward ASR results to onSpeechResult callback', async () => {
    const manager = new VoiceManager();
    const speechCallback = vi.fn();
    manager.onSpeechResult(speechCallback);

    await manager.startListening();

    // Simulate a result from the engine
    const mockEvent = {
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal: true,
          0: { transcript: '画一个红色的圆', confidence: 0.92 },
          length: 1,
        },
      },
    } as unknown as SpeechRecognitionEvent;

    mockRecognitionInstance.onresult!(mockEvent);

    expect(speechCallback).toHaveBeenCalledWith('画一个红色的圆', true);
  });

  it('should forward interim results to onSpeechResult callback', async () => {
    const manager = new VoiceManager();
    const speechCallback = vi.fn();
    manager.onSpeechResult(speechCallback);

    await manager.startListening();

    const mockEvent = {
      resultIndex: 0,
      results: {
        length: 1,
        0: {
          isFinal: false,
          0: { transcript: '画一个', confidence: 0.6 },
          length: 1,
        },
      },
    } as unknown as SpeechRecognitionEvent;

    mockRecognitionInstance.onresult!(mockEvent);

    expect(speechCallback).toHaveBeenCalledWith('画一个', false);
  });

  it('should notify state change callbacks when state changes', async () => {
    const manager = new VoiceManager();
    const stateCallback = vi.fn();
    manager.onStateChange(stateCallback);

    await manager.startListening();

    // Should have been called at least once with isListening=true
    const listeningCall = stateCallback.mock.calls.find(
      (call: [VoiceManagerState]) => call[0].isListening === true,
    );
    expect(listeningCall).toBeDefined();
  });

  it('should update state when recognition ends on its own', async () => {
    const manager = new VoiceManager();
    await manager.startListening();

    expect(manager.getState().isListening).toBe(true);

    // Simulate the engine ending on its own (e.g. silence timeout)
    mockRecognitionInstance.onend!();

    expect(manager.getState().isListening).toBe(false);
  });

  it('should not start listening when browser is not supported', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).SpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).webkitSpeechRecognition;

    const manager = new VoiceManager();
    const errorCallback = vi.fn();
    manager.onError(errorCallback);

    await manager.startListening();

    expect(manager.getState().isListening).toBe(false);
    expect(manager.getState().error).toContain('不支持');
    expect(errorCallback).toHaveBeenCalled();
  });

  it('should not call startListening twice if already listening', async () => {
    const manager = new VoiceManager();
    await manager.startListening();
    await manager.startListening();

    // getUserMedia should only be called once
    expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
  });

  it('should not call stopListening if not listening', () => {
    const manager = new VoiceManager();
    // Should not throw
    manager.stopListening();
  });

  it('should clear previous error on successful startListening', async () => {
    const manager = new VoiceManager();

    // First, cause a permission error
    mockGetUserMedia.mockRejectedValueOnce(
      new DOMException('Permission denied', 'NotAllowedError'),
    );
    await manager.startListening();
    expect(manager.getState().error).not.toBeNull();

    // Then, succeed
    mockGetUserMedia.mockResolvedValueOnce({
      getTracks: () => [{ stop: vi.fn() }],
    });
    await manager.startListening();
    expect(manager.getState().error).toBeNull();
  });
});
