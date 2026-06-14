import { describe, expect, it } from 'vitest';
import {
  alignStepJsonToLayout,
  resolveStepLayoutTarget,
} from '../step-layout-aligner';
import { extractLeaferJsonBounds } from '../scene-bounds';

describe('step-layout-aligner', () => {
  it('centers step group on anchor', () => {
    const json = {
      tag: 'Group',
      children: [{ tag: 'Ellipse', x: 100, y: 100, width: 80, height: 60 }],
    };
    const aligned = alignStepJsonToLayout(json, {
      anchorX: 400,
      anchorY: 300,
      snapEdge: 'center',
    });
    const b = extractLeaferJsonBounds(aligned)!;
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    expect(Math.round(cx)).toBe(400);
    expect(Math.round(cy)).toBe(300);
  });

  it('snaps head bottom to body top anchor (overlap-friendly)', () => {
    const bodyBounds = { minX: 300, minY: 320, maxX: 500, maxY: 440 };
    const completed = [
      { stepIndex: 0, label: '身体', bounds: bodyBounds, summary: 'body' },
    ];
    const target = resolveStepLayoutTarget(
      { attachTo: 0, attachEdge: 'top', offsetY: -10, width: 110, height: 100 },
      completed,
    )!;
    expect(target.snapEdge).toBe('bottom');

    const headJson = {
      tag: 'Group',
      children: [{ tag: 'Ellipse', x: 50, y: 50, width: 40, height: 40 }],
    };
    const aligned = alignStepJsonToLayout(headJson, target);
    const hb = extractLeaferJsonBounds(aligned)!;
    expect(Math.round(hb.maxY)).toBe(Math.round(bodyBounds.minY - 10));
  });

  it('snaps leg top to body bottom anchor', () => {
    const bodyBounds = { minX: 300, minY: 320, maxX: 500, maxY: 440 };
    const completed = [
      { stepIndex: 0, label: '身体', bounds: bodyBounds, summary: 'body' },
    ];
    const target = resolveStepLayoutTarget(
      { attachTo: 0, attachEdge: 'bottom', offsetX: -40, offsetY: 8, width: 28, height: 55 },
      completed,
    )!;

    const legJson = {
      tag: 'Group',
      children: [{ tag: 'Rect', x: 0, y: 0, width: 10, height: 10 }],
    };
    const aligned = alignStepJsonToLayout(legJson, target);
    const lb = extractLeaferJsonBounds(aligned)!;
    expect(Math.round(lb.minY)).toBe(Math.round(bodyBounds.maxY + 8));
    expect(Math.round((lb.minX + lb.maxX) / 2)).toBe(Math.round(400 - 40));
  });
});
