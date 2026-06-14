import { describe, it, expect } from 'vitest';
import { validatePrimitives, parseRenderThreeStep } from '../primitive-validator';
import { extractPrimitiveBounds, summarizePrimitives } from '../primitive-bounds';
import { alignPrimitivesToLayout } from '../primitive-aligner';

describe('primitive-validator', () => {
  it('validates circle primitive', () => {
    const result = validatePrimitives([
      { kind: 'circle', x: 400, y: 300, width: 200, height: 120, color: '#fff' },
    ]);
    expect(result.valid).toBe(true);
    expect(result.normalized).toHaveLength(1);
  });

  it('rejects unknown kind', () => {
    const result = validatePrimitives([{ kind: 'hexagon', x: 0, y: 0 }]);
    expect(result.valid).toBe(false);
  });

  it('requires box depth', () => {
    const result = validatePrimitives([
      { kind: 'box', x: 0, y: 0, width: 80, height: 80 },
    ]);
    expect(result.valid).toBe(false);
  });

  it('parses renderThreeStep with primitives', () => {
    const parsed = parseRenderThreeStep({
      stepIndex: 0,
      label: '身体',
      primitives: [{ kind: 'circle', x: 400, y: 300, width: 200, height: 120, color: '#fff' }],
    });
    expect(parsed?.primitives).toHaveLength(1);
    expect(parsed?.primitives[0].kind).toBe('circle');
  });

  it('extracts bounds and aligns primitives', () => {
    const primitives = [{ kind: 'circle', x: 100, y: 100, width: 100, height: 100, color: '#fff' }];
    const bounds = extractPrimitiveBounds(primitives);
    expect(bounds).not.toBeNull();
    expect(summarizePrimitives(primitives)).toContain('椭圆');

    const aligned = alignPrimitivesToLayout(primitives, {
      anchorX: 400,
      anchorY: 300,
      snapEdge: 'center',
      width: 100,
      height: 100,
    });
    const ab = extractPrimitiveBounds(aligned);
    expect(ab).not.toBeNull();
    const cx = ((ab!.minX + ab!.maxX) / 2);
    expect(Math.round(cx)).toBe(400);
  });
});
