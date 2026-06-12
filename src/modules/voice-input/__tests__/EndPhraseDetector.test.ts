/**
 * @module voice-input/__tests__/EndPhraseDetector.test
 * Unit tests for EndPhraseDetector.
 *
 * Tests end-phrase detection, correction-phrase detection, and the combined
 * detect() method that returns the phrase type.
 */

import { describe, it, expect } from 'vitest';
import { EndPhraseDetector } from '../EndPhraseDetector';

describe('EndPhraseDetector', () => {
  // ---------------------------------------------------------------------------
  // End phrase detection
  // ---------------------------------------------------------------------------

  describe('isEndPhrase', () => {
    it('should detect "开始吧" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('开始吧')).toBe(true);
    });

    it('should detect "可以了" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('可以了')).toBe(true);
    });

    it('should detect "好的" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('好的')).toBe(true);
    });

    it('should detect "行" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('行')).toBe(true);
    });

    it('should detect "画吧" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('画吧')).toBe(true);
    });

    it('should detect "执行" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('执行')).toBe(true);
    });

    it('should detect "确认" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('确认')).toBe(true);
    });

    it('should detect "没问题" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('没问题')).toBe(true);
    });

    it('should detect "对" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('对')).toBe(true);
    });

    it('should detect "是的" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('是的')).toBe(true);
    });

    it('should detect "嗯" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('嗯')).toBe(true);
    });

    it('should NOT detect "画一个圆" as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('画一个圆')).toBe(false);
    });

    it('should NOT detect empty string as end phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isEndPhrase('')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Correction phrase detection
  // ---------------------------------------------------------------------------

  describe('isCorrectionPhrase', () => {
    it('should detect "不对" as correction phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isCorrectionPhrase('不对')).toBe(true);
    });

    it('should detect "不是" as correction phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isCorrectionPhrase('不是')).toBe(true);
    });

    it('should detect "重新来" as correction phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isCorrectionPhrase('重新来')).toBe(true);
    });

    it('should detect "换个" as correction phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isCorrectionPhrase('换个')).toBe(true);
    });

    it('should detect "错了" as correction phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isCorrectionPhrase('错了')).toBe(true);
    });

    it('should detect "不要" as correction phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isCorrectionPhrase('不要')).toBe(true);
    });

    it('should NOT detect "好的" as correction phrase', () => {
      const detector = new EndPhraseDetector();
      expect(detector.isCorrectionPhrase('好的')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Combined detect() method
  // ---------------------------------------------------------------------------

  describe('detect', () => {
    it('should return "end" for "开始吧"', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('开始吧')).toBe('end');
    });

    it('should return "end" for "可以了"', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('可以了')).toBe('end');
    });

    it('should return "end" for "好的"', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('好的')).toBe('end');
    });

    it('should return "correction" for "不对"', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('不对')).toBe('correction');
    });

    it('should return "correction" for "不是"', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('不是')).toBe('correction');
    });

    it('should return "correction" for "重新来"', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('重新来')).toBe('correction');
    });

    it('should return "none" for "画一个圆"', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('画一个圆')).toBe('none');
    });

    it('should return "end" for "对" (simple affirmation)', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('对')).toBe('end');
    });

    it('should return "end" for "好的开始吧" (multiple end phrases)', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('好的开始吧')).toBe('end');
    });

    it('should return "correction" when both end and correction phrases are present', () => {
      const detector = new EndPhraseDetector();
      // Correction takes precedence — user is likely correcting
      expect(detector.detect('不对好的')).toBe('correction');
    });

    it('should return "none" for empty string', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('')).toBe('none');
    });

    it('should return "none" for unrelated text', () => {
      const detector = new EndPhraseDetector();
      expect(detector.detect('我想画一朵花')).toBe('none');
    });
  });
});
