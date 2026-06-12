import { describe, it, expect } from 'vitest';
import { VoiceCommandRouter } from '../VoiceCommandRouter';

describe('VoiceCommandRouter', () => {
  const router = new VoiceCommandRouter();

  it('detects undo commands', () => {
    expect(router.detect('撤销')).toBe('undo');
    expect(router.detect('帮我撤回')).toBe('undo');
    expect(router.detect('上一步')).toBe('undo');
  });

  it('detects export commands', () => {
    expect(router.detect('导出')).toBe('export');
    expect(router.detect('保存图片')).toBe('export');
    expect(router.detect('导出SVG')).toBe('export');
  });

  it('returns none for drawing intents', () => {
    expect(router.detect('画一个圆')).toBe('none');
    expect(router.detect('开始吧')).toBe('none');
  });
});
