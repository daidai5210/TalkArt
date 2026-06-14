import { describe, expect, it } from 'vitest';
import { parseRenderSketchStep, validateSketchMarks } from '../sketch-validator';
import { extractSketchBounds, summarizeSketchMarks } from '../sketch-bounds';
import { alignSketchMarksToLayout } from '../sketch-aligner';

describe('sketch-validator', () => {
  it('validates simple sketch marks', () => {
    const result = validateSketchMarks([
      { kind: 'ellipse', center: [400, 300], rx: 80, ry: 60, stroke: '#222' },
      { kind: 'polygon', points: [[340, 250], [365, 210], [390, 250]], stroke: '#222' },
      { kind: 'line', from: [360, 320], to: [320, 315], stroke: '#222' },
    ]);
    expect(result.valid).toBe(true);
    expect(result.normalized).toHaveLength(3);
  });

  it('rejects malformed marks', () => {
    const result = validateSketchMarks([{ kind: 'polygon', points: [[0, 0], [1, 1]] }]);
    expect(result.valid).toBe(false);
  });

  it('parses renderSketchStep tool arguments', () => {
    const parsed = parseRenderSketchStep({
      stepIndex: 0,
      label: '头部',
      marks: [{ kind: 'dot', center: [380, 290], r: 4, fill: '#222' }],
    });
    expect(parsed?.marks[0].kind).toBe('dot');
  });

  it('extracts bounds and aligns marks', () => {
    const marks = [{ kind: 'ellipse' as const, center: [100, 100] as [number, number], rx: 50, ry: 30 }];
    const bounds = extractSketchBounds(marks);
    expect(bounds).not.toBeNull();
    expect(summarizeSketchMarks(marks)).toContain('椭圆');

    const aligned = alignSketchMarksToLayout(marks, {
      anchorX: 400,
      anchorY: 300,
      snapEdge: 'center',
      width: 100,
      height: 60,
    });
    const alignedBounds = extractSketchBounds(aligned);
    expect(Math.round((alignedBounds!.minX + alignedBounds!.maxX) / 2)).toBe(400);
    expect(Math.round((alignedBounds!.minY + alignedBounds!.maxY) / 2)).toBe(300);
  });
});
