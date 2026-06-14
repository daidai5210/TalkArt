import { describe, expect, it } from 'vitest';
import {
  extractLeaferJsonBounds,
  formatCompletedSteps,
  formatPlanOverview,
  mergeBounds,
  summarizeLeaferJson,
} from '../scene-bounds';

describe('scene-bounds', () => {
  it('extracts ellipse bounds from center coordinates', () => {
    const json = {
      tag: 'Group',
      children: [{ tag: 'Ellipse', x: 400, y: 300, width: 200, height: 100 }],
    };
    const bounds = extractLeaferJsonBounds(json);
    expect(bounds).toEqual({
      minX: 300,
      minY: 250,
      maxX: 500,
      maxY: 350,
    });
  });

  it('extracts rect bounds from top-left coordinates', () => {
    const json = { tag: 'Rect', x: 100, y: 50, width: 80, height: 40 };
    const bounds = extractLeaferJsonBounds(json);
    expect(bounds).toEqual({
      minX: 100,
      minY: 50,
      maxX: 180,
      maxY: 90,
    });
  });

  it('merges group children bounds', () => {
    const json = {
      tag: 'Group',
      children: [
        { tag: 'Ellipse', x: 400, y: 380, width: 200, height: 140 },
        { tag: 'Ellipse', x: 400, y: 260, width: 120, height: 100 },
      ],
    };
    const bounds = extractLeaferJsonBounds(json)!;
    expect(bounds.minX).toBe(300);
    expect(bounds.maxY).toBe(450);
  });

  it('summarizes leafer json', () => {
    const json = {
      tag: 'Group',
      children: [{ tag: 'Ellipse', x: 400, y: 300, width: 200, height: 100 }],
    };
    expect(summarizeLeaferJson(json)).toContain('Ellipse');
    expect(summarizeLeaferJson(json)).toContain('400');
  });

  it('formats completed steps and plan overview', () => {
    const steps = [
      {
        stepIndex: 0,
        label: '身体',
        bounds: { minX: 300, minY: 310, maxX: 500, maxY: 450 },
        summary: 'Ellipse 中心(400,380) 200×140',
      },
    ];
    expect(formatCompletedSteps(steps)).toContain('身体');
    const plan = formatPlanOverview(
      [
        { index: 0, label: '身体', description: '椭圆身体' },
        { index: 1, label: '头', description: '圆形头' },
      ],
      1,
    );
    expect(plan).toContain('→ 当前');
    expect(plan).toContain('✓ 已完成');
  });

  it('mergeBounds combines regions', () => {
    const a = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const b = { minX: 5, minY: 5, maxX: 20, maxY: 20 };
    expect(mergeBounds(a, b)).toEqual({ minX: 0, minY: 0, maxX: 20, maxY: 20 });
  });
});
