/**
 * Phase 5: insertImage and setFillGradient tests.
 */

import { describe, it, expect } from 'vitest';
import { ToolDispatcher } from '../../ai-agent/ToolDispatcher';
import type { CanvasContext } from '../types';
import { drawRect } from '../basic-shapes';
import { mmToPx } from '../coordinate-utils';

const defaultContext: CanvasContext = {
  width: 800,
  height: 600,
  defaultUnit: 'mm',
  elements: [],
};

describe('Phase 5 asset & style tools', () => {
  it('insertImage with preset bowl', () => {
    const dispatcher = new ToolDispatcher(defaultContext);
    const result = dispatcher.execute('insertImage', {
      position: { x: 100, y: 80 },
      width: 40,
      height: 30,
      unit: 'mm',
      presetId: 'bowl',
    });

    expect(result.success).toBe(true);
    expect(result.element?.type).toBe('image');
    expect(result.element?.props.href).toContain('bowl-placeholder');
    expect(result.element?.props.width).toBeCloseTo(mmToPx(40), 0);
  });

  it('setFillGradient on rect', () => {
    const rect = drawRect(defaultContext, {
      position: { semantic: 'center' },
      size: { semantic: 'medium' },
      style: { fill: '红色' },
    });
    const ctx: CanvasContext = {
      ...defaultContext,
      elements: [
        {
          id: rect.element!.id,
          type: 'rect',
          ...rect.element!.props,
        },
      ],
    };
    const dispatcher = new ToolDispatcher(ctx);
    const result = dispatcher.execute('setFillGradient', {
      elementId: rect.element!.id,
      gradient: { from: '红色', to: '橙色', direction: 'vertical' },
    });

    expect(result.success).toBe(true);
    expect(result.element?.props.fillGradient).toBeDefined();
  });
});
