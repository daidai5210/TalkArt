/**
 * @module drawing-tools/__tests__/plan-executor.test
 * Phase 2: executeDrawingPlan and mm coordinate tests.
 */

import { describe, it, expect } from 'vitest';
import { ToolDispatcher } from '../../ai-agent/ToolDispatcher';
import { mmToPx, pxToMm } from '../coordinate-utils';
import { executeDrawingPlan } from '../v2/plan-executor';
import { KANGSHIFU_PLAN_FIXTURE } from './kangshifu-plan.fixture';
import { OLYMPIC_FLAG_PLAN_FIXTURE } from './olympic-plan.fixture';
import { YELLOW_CAT_PLAN_FIXTURE } from './yellow-cat-plan.fixture';
import type { CanvasContext } from '../types';

function createContext(): CanvasContext {
  return {
    width: 800,
    height: 600,
    defaultUnit: 'mm',
    elements: [],
    selectedId: null,
  };
}

describe('coordinate-utils mm conversion', () => {
  it('converts mm to px at 96 DPI', () => {
    expect(mmToPx(50)).toBeCloseTo(188.976, 1);
    expect(mmToPx(30)).toBeCloseTo(113.386, 1);
  });

  it('converts px to mm at 96 DPI', () => {
    expect(pxToMm(188.976)).toBeCloseTo(50, 0);
  });
});

describe('executeDrawingPlan', () => {
  it('executes three circles in a row via plan', () => {
    const context = createContext();
    const dispatcher = new ToolDispatcher(context);
    const spacing = 60;
    const r = 20;

    const result = executeDrawingPlan(
      context,
      {
        steps: [
          {
            tool: 'drawCircle',
            args: {
              position: { x: spacing, y: 100, unit: 'mm' },
              r: 20,
              unit: 'mm',
              style: { fill: '蓝色' },
            },
          },
          {
            tool: 'drawCircle',
            args: {
              position: { x: spacing + r * 2 + 10, y: 100, unit: 'mm' },
              r: 20,
              unit: 'mm',
              style: { fill: '蓝色' },
            },
          },
          {
            tool: 'drawCircle',
            args: {
              position: { x: spacing + (r * 2 + 10) * 2, y: 100, unit: 'mm' },
              r: 20,
              unit: 'mm',
              style: { fill: '蓝色' },
            },
          },
        ],
      },
      (tool, args) => dispatcher.execute(tool, args),
    );

    expect(result.completedSteps).toBe(3);
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results.every((r) => r.success)).toBe(true);
  });

  it('draws a 50mm x 30mm red rect within 2px tolerance', () => {
    const context = createContext();
    const dispatcher = new ToolDispatcher(context);

    const result = dispatcher.execute('drawRect', {
      position: { x: 10, y: 10, unit: 'mm' },
      size: { width: 50, height: 30, unit: 'mm' },
      style: { fill: '红色' },
    });

    expect(result.success).toBe(true);
    expect(result.element?.props.width).toBeCloseTo(mmToPx(50), 0);
    expect(result.element?.props.height).toBeCloseTo(mmToPx(30), 0);
    const widthError = Math.abs((result.element?.props.width as number) - mmToPx(50));
    const heightError = Math.abs((result.element?.props.height as number) - mmToPx(30));
    expect(widthError).toBeLessThanOrEqual(2);
    expect(heightError).toBeLessThanOrEqual(2);
  });

  it('executes executeDrawingPlan via dispatcher', () => {
    const context = createContext();
    const dispatcher = new ToolDispatcher(context);

    const result = dispatcher.execute('executeDrawingPlan', {
      steps: [
        { tool: 'drawCircle', args: { position: { x: 50, y: 50, unit: 'mm' }, r: 15, unit: 'mm' } },
        { tool: 'drawCircle', args: { position: { x: 100, y: 50, unit: 'mm' }, r: 15, unit: 'mm' } },
        { tool: 'drawCircle', args: { position: { x: 150, y: 50, unit: 'mm' }, r: 15, unit: 'mm' } },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.elements).toHaveLength(3);
    expect(result.planResult?.completedSteps).toBe(3);
  });

  it('executes yellow cat plan with non-overlapping layout (draw iter R1)', () => {
    const context = createContext();
    const dispatcher = new ToolDispatcher(context);

    const result = dispatcher.execute('executeDrawingPlan', YELLOW_CAT_PLAN_FIXTURE);

    expect(result.success).toBe(true);
    expect(result.planResult?.completedSteps).toBe(8);
    expect(result.elements?.length).toBe(8);

    const circles = result.elements?.filter((el) => el.type === 'circle') ?? [];
    const positions = circles.map((c) => ({ cx: c.props.cx, cy: c.props.cy }));
    const unique = new Set(positions.map((p) => `${p.cx},${p.cy}`));
    expect(unique.size).toBeGreaterThan(1);
  });

  it('executes olympic rings + flag plan fixture (iter 4)', () => {
    const context = createContext();
    const dispatcher = new ToolDispatcher(context);

    const result = dispatcher.execute('executeDrawingPlan', OLYMPIC_FLAG_PLAN_FIXTURE);

    expect(result.success).toBe(true);
    expect(result.planResult?.completedSteps).toBe(7);
    expect(result.elements?.length).toBeGreaterThanOrEqual(7);
  });

  it('executes kangshifu package plan fixture (phase 6)', () => {
    const context = createContext();
    const dispatcher = new ToolDispatcher(context);

    const result = dispatcher.execute('executeDrawingPlan', KANGSHIFU_PLAN_FIXTURE);

    expect(result.success).toBe(true);
    expect(result.planResult?.completedSteps).toBe(5);
    expect(result.elements?.length).toBeGreaterThanOrEqual(4);
    const image = result.elements?.find((el) => el.type === 'image');
    expect(image).toBeDefined();
  });
});
