/**
 * @module voice-input/VoiceCommandRouter
 * Phase 4: maps spoken commands to canvas actions (undo, export).
 */

export type VoiceCommand = 'undo' | 'export' | 'none';

const UNDO_PATTERNS = [/撤销/, /撤回/, /上一步/, /取消上一步/];
const EXPORT_PATTERNS = [/导出/, /保存/, /下载/, /导出图片/, /导出svg/i];

/**
 * Detect direct voice commands that bypass the LLM.
 */
export class VoiceCommandRouter {
  detect(text: string): VoiceCommand {
    const normalized = text.trim();
    if (!normalized) return 'none';

    if (UNDO_PATTERNS.some((p) => p.test(normalized))) return 'undo';
    if (EXPORT_PATTERNS.some((p) => p.test(normalized))) return 'export';
    return 'none';
  }
}
