/**
 * @module voice-input/WakeWordDetector
 * Detects the wake word "小智" (xiao zhi) in ASR transcripts with fuzzy matching.
 *
 * TalkArt uses a wake-word interaction model: the system stays dormant until the
 * user says the wake word, then begins listening for a drawing request. This
 * detector performs regex-based matching on the ASR transcript to identify the
 * wake word, supporting Chinese characters (including homophones) and pinyin
 * variants for robustness.
 *
 * The detector triggers **once per session**. After a session completes, call
 * `reset()` to allow the wake word to be detected again.
 *
 * Wake word patterns recognised (case-insensitive):
 * - "小智" (exact)
 * - "小志" / "小知" (homophones)
 * - "xiao zhi", "xiaozhi", "xiaozi" (pinyin variants)
 * - "嘿小智" (hey + wake word)
 * - "小智小智" (repeated wake word)
 */

/** Regex that matches the wake word in a transcript. Matches Chinese characters (including homophones) and pinyin variants (with/without space, with "zhi" or "zi" ending). */
const WAKE_WORD_PATTERN = /(小智|小志|小知|xi[ao]{1,2}\s*z[h]?i|xi[ao]{1,2}z[h]?i)/i;

/**
 * WakeWordDetector watches ASR transcripts and fires a callback the first time
 * a wake word is detected within a session.
 *
 * Usage:
 * ```ts
 * const detector = new WakeWordDetector();
 * detector.onWake(() => console.log('User is awake!'));
 *
 * // Feed each ASR transcript to detect()
 * detector.detect('我想画个圆');     // false
 * detector.detect('小智小智');       // true  → callback fires
 * detector.detect('小智在吗');       // false (already awake)
 *
 * // After the session ends, reset for the next one
 * detector.reset();
 * detector.detect('嘿小智');        // true  → callback fires again
 * ```
 */
export class WakeWordDetector {
  /** Whether the wake word has already been detected in this session. */
  private isWoken: boolean = false;

  /** Callback invoked the first time the wake word is detected. */
  private onWakeCallback: (() => void) | null = null;

  /**
   * Process an incoming transcript and check for the wake word.
   *
   * @param text - The ASR transcript (partial or final).
   * @returns `true` if the wake word was detected **in this call** (first
   *   detection in the session); `false` otherwise.
   *
   * The method is idempotent within a session: after the first detection it
   * returns `false` on subsequent calls until `reset()` is called.
   */
  detect(text: string): boolean {
    if (this.isWoken) {
      return false;
    }

    if (WAKE_WORD_PATTERN.test(text)) {
      this.isWoken = true;
      this.onWakeCallback?.();
      return true;
    }

    return false;
  }

  /**
   * Register a callback that fires when the wake word is first detected.
   *
   * Only one callback is supported; calling `onWake` again replaces the
   * previous callback.
   *
   * @param callback - Function invoked on first wake-word detection.
   */
  onWake(callback: () => void): void {
    this.onWakeCallback = callback;
  }

  /**
   * Reset the detector so the wake word can be detected again.
   *
   * Call this after a voice session ends (or is cancelled) to prepare
   * for the next interaction.
   */
  reset(): void {
    this.isWoken = false;
  }

  /**
   * Check whether the detector is currently in the "woken" state — i.e. the
   * wake word has been detected and the system should be listening for a
   * drawing request.
   */
  isAwake(): boolean {
    return this.isWoken;
  }
}
