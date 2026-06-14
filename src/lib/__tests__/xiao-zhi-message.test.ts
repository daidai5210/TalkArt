import { describe, it, expect } from 'vitest';
import { formatStepDrawGuide } from '../xiao-zhi-message';

describe('formatStepDrawGuide', () => {
  it('adds 先画 for body-part labels', () => {
    expect(formatStepDrawGuide('头部')).toBe('现在让我们先画头部吧！');
    expect(formatStepDrawGuide('耳朵')).toBe('现在让我们先画耳朵吧！');
  });

  it('preserves labels that already start with 画', () => {
    expect(formatStepDrawGuide('画一个圆')).toBe('现在让我们画一个圆吧！');
  });
});

import { normalizeChildColor, CHILDREN_PALETTE } from '../../modules/three-renderer/children-palette';

describe('children-palette', () => {
  it('remaps dark brown to a bright palette color', () => {
    const result = normalizeChildColor('#8B4513');
    expect(CHILDREN_PALETTE).toContain(result);
  });

  it('keeps bright colors unchanged', () => {
    expect(normalizeChildColor('#FFD93D')).toBe('#FFD93D');
  });
});
