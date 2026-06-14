import { describe, expect, it } from 'vitest';
import { alignStepJsonToLayout, resolveStepLayoutTarget } from '../step-layout-aligner';
import { extractLeaferJsonBounds } from '../scene-bounds';

describe('step-layout-aligner', () => {
  it('translates step group to planned center', () => {
    const json = {
      tag: 'Group',
      children: [{ tag: 'Ellipse', x: 100, y: 100, width: 80, height: 60 }],
    };
    const aligned = alignStepJsonToLayout(json, { centerX: 400, centerY: 300 });
    const b = extractLeaferJsonBounds(aligned)!;
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    expect(Math.round(cx)).toBe(400);
    expect(Math.round(cy)).toBe(300);
  });

  it('resolves attachTo top edge with offset', () => {
    const completed = [
      {
        stepIndex: 0,
        label: '身体',
        bounds: { minX: 300, minY: 320, maxX: 500, maxY: 460 },
        summary: 'body',
      },
    ];
    const target = resolveStepLayoutTarget(
      { attachTo: 0, attachEdge: 'top', offsetY: -55, width: 120, height: 100 },
      completed,
    );
    expect(target?.centerX).toBe(400);
    expect(target?.centerY).toBe(265);
  });
});
