/**
 * @module voice-input/__tests__/WakeWordDetector.test
 * Unit tests for WakeWordDetector.
 *
 * Tests wake word detection with exact matches, homophones, pinyin variants,
 * state management (single-trigger-per-session), and reset behaviour.
 */

import { describe, it, expect, vi } from 'vitest';
import { WakeWordDetector } from '../WakeWordDetector';

describe('WakeWordDetector', () => {
  it('should detect "小智小智" as wake word', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('小智小智')).toBe(true);
  });

  it('should detect "嘿小智" as wake word', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('嘿小智')).toBe(true);
  });

  it('should detect "小志" as wake word (homophone)', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('小志')).toBe(true);
  });

  it('should detect "小知" as wake word (homophone)', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('小知')).toBe(true);
  });

  it('should detect "xiao zhi" as wake word (pinyin with space)', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('xiao zhi')).toBe(true);
  });

  it('should detect "xiaozhi" as wake word (pinyin no space)', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('xiaozhi')).toBe(true);
  });

  it('should detect "xiaozi" as wake word (pinyin variant)', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('xiaozi')).toBe(true);
  });

  it('should NOT detect "我想画个圆" as wake word', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('我想画个圆')).toBe(false);
  });

  it('should trigger wake only once per session', () => {
    const detector = new WakeWordDetector();
    const callback = vi.fn();
    detector.onWake(callback);

    expect(detector.detect('小智')).toBe(true);
    expect(callback).toHaveBeenCalledTimes(1);

    // Subsequent calls should not trigger again
    expect(detector.detect('小智小智')).toBe(false);
    expect(detector.detect('嘿小智')).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should report isAwake() as true after wake word detected', () => {
    const detector = new WakeWordDetector();
    expect(detector.isAwake()).toBe(false);

    detector.detect('小智');
    expect(detector.isAwake()).toBe(true);
  });

  it('should allow re-trigger after reset()', () => {
    const detector = new WakeWordDetector();
    const callback = vi.fn();
    detector.onWake(callback);

    // First wake
    detector.detect('小智');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(detector.isAwake()).toBe(true);

    // Reset
    detector.reset();
    expect(detector.isAwake()).toBe(false);

    // Can trigger again
    expect(detector.detect('嘿小智')).toBe(true);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should detect "小智在吗" as wake word (contains match)', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('小智在吗')).toBe(true);
  });

  it('should detect "你好小智帮我画个圆" as wake word (embedded)', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('你好小智帮我画个圆')).toBe(true);
  });

  it('should call onWake callback when wake word is detected', () => {
    const detector = new WakeWordDetector();
    const callback = vi.fn();
    detector.onWake(callback);

    detector.detect('小智');
    expect(callback).toHaveBeenCalledOnce();
  });

  it('should not call onWake callback when no wake word is detected', () => {
    const detector = new WakeWordDetector();
    const callback = vi.fn();
    detector.onWake(callback);

    detector.detect('你好');
    expect(callback).not.toHaveBeenCalled();
  });

  it('should support replacing onWake callback', () => {
    const detector = new WakeWordDetector();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    detector.onWake(callback1);
    detector.onWake(callback2); // replaces callback1

    detector.detect('小智');
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledOnce();
  });

  it('should match pinyin case-insensitively', () => {
    const detector1 = new WakeWordDetector();
    expect(detector1.detect('Xiao Zhi')).toBe(true);

    const detector2 = new WakeWordDetector();
    expect(detector2.detect('XIAOZHI')).toBe(true);

    const detector3 = new WakeWordDetector();
    expect(detector3.detect('XiaoZhi')).toBe(true);
  });

  it('should not trigger on empty string', () => {
    const detector = new WakeWordDetector();
    expect(detector.detect('')).toBe(false);
  });
});
