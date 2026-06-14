import { describe, it, expect } from 'vitest';
import {
  validateLeaferJson,
  parseDrawingPlan,
  parseRenderLeaferStep,
} from '../leafer-json-validator';

describe('validateLeaferJson', () => {
  it('accepts valid Group with children', () => {
    const result = validateLeaferJson({
      tag: 'Group',
      children: [{ tag: 'Rect', x: 10, y: 10, width: 50, height: 50, fill: '#f00' }],
    });
    expect(result.valid).toBe(true);
    expect(result.normalized?.tag).toBe('Group');
  });

  it('wraps single shape in Group', () => {
    const result = validateLeaferJson({ tag: 'Ellipse', x: 0, y: 0, width: 40, height: 40 });
    expect(result.valid).toBe(true);
    expect(result.normalized?.tag).toBe('Group');
    expect(result.normalized?.children).toHaveLength(1);
  });

  it('rejects invalid tag', () => {
    const result = validateLeaferJson({ tag: 'InvalidShape' });
    expect(result.valid).toBe(false);
  });
});

describe('parseDrawingPlan', () => {
  it('parses valid plan', () => {
    const plan = parseDrawingPlan({
      planId: 'p1',
      totalSteps: 2,
      steps: [
        { index: 0, label: '背景', description: '画天空' },
        { index: 1, label: '主体', description: '画猫身体' },
      ],
    });
    expect(plan?.totalSteps).toBe(2);
    expect(plan?.steps).toHaveLength(2);
  });
});

describe('parseRenderLeaferStep', () => {
  it('parses render step args', () => {
    const parsed = parseRenderLeaferStep({
      stepIndex: 0,
      label: '背景',
      leaferJson: {
        tag: 'Group',
        children: [{ tag: 'Rect', x: 0, y: 0, width: 800, height: 600, fill: '#87CEEB' }],
      },
    });
    expect(parsed?.stepIndex).toBe(0);
    expect(parsed?.leaferJson.tag).toBe('Group');
  });
});
