/**
 * @module voice-input/EndPhraseDetector
 * Detects end/confirmation phrases and correction phrases in ASR transcripts.
 *
 * In the TalkArt interaction flow, after the user describes what they want to
 * draw, the AI asks back to confirm. The user then either:
 * 1. Confirms with an end phrase (e.g. "开始吧", "好的") → triggers drawing
 * 2. Corrects with a correction phrase (e.g. "不对", "重新来") → go back to listening
 *
 * This detector provides simple string matching for these short Chinese phrases.
 * It is stateless and can be called repeatedly with each new transcript.
 */

/** Phrases that indicate the user wants to proceed with drawing. */
const END_PHRASES = [
  '开始吧',
  '可以了',
  '好的',
  '行',
  '画吧',
  '执行',
  '确认',
  '没问题',
  '对',
  '是的',
  '嗯',
] as const;

/** Phrases that indicate the user wants to correct or change the request. */
const CORRECTION_PHRASES = [
  '不对',
  '不是',
  '重新来',
  '换个',
  '错了',
  '不要',
] as const;

/** Result type for phrase detection. */
export type PhraseType = 'end' | 'correction' | 'none';

/**
 * EndPhraseDetector checks whether a transcript contains an end phrase
 * (confirmation) or a correction phrase.
 *
 * The detector is stateless — it simply checks for substring matches.
 * The caller is responsible for tracking the conversation state (e.g. whether
 * the AI has asked for confirmation).
 *
 * Usage:
 * ```ts
 * const detector = new EndPhraseDetector();
 *
 * detector.detect('开始吧');        // 'end'
 * detector.detect('不对');          // 'correction'
 * detector.detect('画一个圆');      // 'none'
 * detector.isEndPhrase('好的');     // true
 * detector.isCorrectionPhrase('不是'); // true
 * ```
 */
export class EndPhraseDetector {
  /**
   * Check if the text contains an end/confirmation phrase.
   *
   * @param text - The ASR transcript to check.
   * @returns `true` if any end phrase is found as a substring.
   */
  isEndPhrase(text: string): boolean {
    return END_PHRASES.some((phrase) => text.includes(phrase));
  }

  /**
   * Check if the text contains a correction phrase.
   *
   * @param text - The ASR transcript to check.
   * @returns `true` if any correction phrase is found as a substring.
   */
  isCorrectionPhrase(text: string): boolean {
    return CORRECTION_PHRASES.some((phrase) => text.includes(phrase));
  }

  /**
   * Detect what kind of phrase (if any) is in the text.
   *
   * If both an end phrase and a correction phrase are present, correction
   * takes precedence (the user is more likely correcting than confirming).
   *
   * @param text - The ASR transcript to check.
   * @returns 'end' if an end phrase is found, 'correction' if a correction
   *   phrase is found, 'none' otherwise.
   */
  detect(text: string): PhraseType {
    // Check correction first — if user says "不对，好的", they're correcting
    if (this.isCorrectionPhrase(text)) {
      return 'correction';
    }
    if (this.isEndPhrase(text)) {
      return 'end';
    }
    return 'none';
  }
}
