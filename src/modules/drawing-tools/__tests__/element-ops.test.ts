/**
 * Tests for the element operation tool functions.
 *
 * Covers all 6 element operations:
 * - selectElement: by id, by description, by selectedId, error cases
 * - updateElement: by id, by selected element, color parsing, error cases
 * - deleteElement: by id, by selected element, error cases
 * - moveElement: by dx/dy, by semantic direction, by element type, error cases
 * - scaleElement: by factor, by semantic, by element type, error cases
 * - duplicateElement: with default offset, with custom offset, by element type
 */

import { describe, it, expect } from 'vitest';
import {
  selectElement,
  updateElement,
  deleteElement,
  moveElement,
  scaleElement,
  duplicateElement,
} from '../element-ops';
import { CanvasContext } from '../types';

// ─── Test helpers ────────────────────────────────────────────────

/** Standard canvas context for tests (800x600) */
function createTestContext(overrides?: Partial<CanvasContext>): CanvasContext {
  return {
    width: 800,
    height: 600,
    elements: [],
    selectedId: null,
    ...overrides,
  };
}

/** A sample circle element */
const sampleCircle = {
  id: 'circle-001',
  type: 'circle',
  cx: 400,
  cy: 300,
  r: 100,
};

/** A sample rect element */
const sampleRect = {
  id: 'rect-001',
  type: 'rect',
  x: 100,
  y: 100,
  width: 200,
  height: 150,
};

/** A sample text element */
const sampleText = {
  id: 'text-001',
  type: 'text',
  x: 50,
  y: 50,
};

/** A sample line element */
const sampleLine = {
  id: 'line-001',
  type: 'line',
  x1: 40,
  y1: 300,
  x2: 760,
  y2: 300,
};

/** A sample triangle element */
const sampleTriangle = {
  id: 'triangle-001',
  type: 'triangle',
  x1: 400,
  y1: 200,
  x2: 300,
  y2: 400,
  x3: 500,
  y3: 400,
};

/** A sample ellipse element */
const sampleEllipse = {
  id: 'ellipse-001',
  type: 'ellipse',
  cx: 400,
  cy: 300,
  rx: 120,
  ry: 80,
};

// ─── selectElement ───────────────────────────────────────────────

describe('selectElement', () => {
  it('selects an element by id', () => {
    const ctx = createTestContext({
      elements: [sampleCircle, sampleRect],
    });

    const result = selectElement(ctx, { id: 'rect-001' });

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('rect-001');
  });

  it('selects an element by description matching type keyword', () => {
    const ctx = createTestContext({
      elements: [sampleRect, sampleCircle],
    });

    const result = selectElement(ctx, { description: '那个圆' });

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('circle-001');
  });

  it('selects an element by description matching "圆形"', () => {
    const ctx = createTestContext({
      elements: [sampleRect, sampleCircle],
    });

    const result = selectElement(ctx, { description: '圆形' });

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('circle-001');
  });

  it('selects an element by description matching "矩形"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle, sampleRect],
    });

    const result = selectElement(ctx, { description: '矩形' });

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('rect-001');
  });

  it('selects the selected element when no id or description given', () => {
    const ctx = createTestContext({
      elements: [sampleCircle, sampleRect],
      selectedId: 'circle-001',
    });

    const result = selectElement(ctx, {});

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('circle-001');
  });

  it('returns error when element id not found', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = selectElement(ctx, { id: 'nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到');
  });

  it('returns error when no elements on canvas', () => {
    const ctx = createTestContext();

    const result = selectElement(ctx, { description: '那个圆' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('没有元素');
  });

  it('returns error when no id, no description, and nothing selected', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = selectElement(ctx, {});

    expect(result.success).toBe(false);
    expect(result.error).toContain('指定要操作的元素');
  });

  it('falls back to last element when description does not match any keyword', () => {
    const ctx = createTestContext({
      elements: [sampleCircle, sampleRect],
    });

    const result = selectElement(ctx, { description: '某个东西' });

    // Falls back to the last (most recent) element
    expect(result.success).toBe(true);
    expect(result.elementId).toBe('rect-001');
  });
});

// ─── updateElement ───────────────────────────────────────────────

describe('updateElement', () => {
  it('updates properties of an element by id', () => {
    const ctx = createTestContext({
      elements: [{ ...sampleCircle, fill: '#7c5cfc' }],
    });

    const result = updateElement(ctx, {
      id: 'circle-001',
      properties: { fill: '红色' },
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('circle-001');
    expect(result.element).toBeDefined();
    expect(result.element!.props.fill).toBe('#FF0000');
  });

  it('updates properties of the selected element', () => {
    const ctx = createTestContext({
      elements: [{ ...sampleCircle, fill: '#7c5cfc' }],
      selectedId: 'circle-001',
    });

    const result = updateElement(ctx, {
      properties: { fill: '蓝色', r: 150 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.fill).toBe('#0000FF');
    expect(result.element!.props.r).toBe(150);
  });

  it('updates stroke properties', () => {
    const ctx = createTestContext({
      elements: [sampleRect],
    });

    const result = updateElement(ctx, {
      id: 'rect-001',
      properties: { stroke: '#000000', strokeWidth: 3 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.stroke).toBe('#000000');
    expect(result.element!.props.strokeWidth).toBe(3);
  });

  it('returns error when no properties provided', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = updateElement(ctx, {
      id: 'circle-001',
      properties: {},
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('要更新的属性');
  });

  it('returns error when element not found', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = updateElement(ctx, {
      id: 'nonexistent',
      properties: { fill: '红色' },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到');
  });

  it('returns error when no id and nothing selected', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = updateElement(ctx, {
      properties: { fill: '红色' },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('指定要操作的元素');
  });
});

// ─── deleteElement ───────────────────────────────────────────────

describe('deleteElement', () => {
  it('deletes an element by id', () => {
    const ctx = createTestContext({
      elements: [sampleCircle, sampleRect],
    });

    const result = deleteElement(ctx, { id: 'circle-001' });

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('circle-001');
  });

  it('deletes the selected element when no id given', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
      selectedId: 'circle-001',
    });

    const result = deleteElement(ctx, {});

    expect(result.success).toBe(true);
    expect(result.elementId).toBe('circle-001');
  });

  it('returns error when no elements on canvas', () => {
    const ctx = createTestContext();

    const result = deleteElement(ctx, { id: 'circle-001' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('没有元素');
  });

  it('returns error when element id not found', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = deleteElement(ctx, { id: 'nonexistent' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到');
  });
});

// ─── moveElement ─────────────────────────────────────────────────

describe('moveElement', () => {
  it('moves a circle by dx/dy', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = moveElement(ctx, {
      id: 'circle-001',
      dx: 50,
      dy: -30,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.cx).toBe(450); // 400 + 50
    expect(result.element!.props.cy).toBe(270); // 300 - 30
  });

  it('moves a rect by dx/dy', () => {
    const ctx = createTestContext({
      elements: [sampleRect],
    });

    const result = moveElement(ctx, {
      id: 'rect-001',
      dx: 100,
      dy: 50,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.x).toBe(200); // 100 + 100
    expect(result.element!.props.y).toBe(150); // 100 + 50
  });

  it('moves an element by semantic direction "左边"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = moveElement(ctx, {
      id: 'circle-001',
      direction: '左边',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.cx).toBe(350); // 400 - 50
    expect(result.element!.props.cy).toBe(300); // unchanged
  });

  it('moves an element by semantic direction "右边"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = moveElement(ctx, {
      id: 'circle-001',
      direction: '右边',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.cx).toBe(450); // 400 + 50
    expect(result.element!.props.cy).toBe(300); // unchanged
  });

  it('moves an element by semantic direction "上面"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = moveElement(ctx, {
      id: 'circle-001',
      direction: '上面',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.cx).toBe(400); // unchanged
    expect(result.element!.props.cy).toBe(250); // 300 - 50
  });

  it('moves an element by semantic direction "下面"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = moveElement(ctx, {
      id: 'circle-001',
      direction: '下面',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.cx).toBe(400); // unchanged
    expect(result.element!.props.cy).toBe(350); // 300 + 50
  });

  it('moves a line by dx/dy (both endpoints)', () => {
    const ctx = createTestContext({
      elements: [sampleLine],
    });

    const result = moveElement(ctx, {
      id: 'line-001',
      dx: 10,
      dy: 20,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.x1).toBe(50);  // 40 + 10
    expect(result.element!.props.y1).toBe(320); // 300 + 20
    expect(result.element!.props.x2).toBe(770); // 760 + 10
    expect(result.element!.props.y2).toBe(320); // 300 + 20
  });

  it('moves a triangle by dx/dy (all vertices)', () => {
    const ctx = createTestContext({
      elements: [sampleTriangle],
    });

    const result = moveElement(ctx, {
      id: 'triangle-001',
      dx: 100,
      dy: 50,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.x1).toBe(500); // 400 + 100
    expect(result.element!.props.y1).toBe(250); // 200 + 50
    expect(result.element!.props.x2).toBe(400); // 300 + 100
    expect(result.element!.props.y2).toBe(450); // 400 + 50
    expect(result.element!.props.x3).toBe(600); // 500 + 100
    expect(result.element!.props.y3).toBe(450); // 400 + 50
  });

  it('returns error for unknown direction', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = moveElement(ctx, {
      id: 'circle-001',
      direction: '东北',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('未知的方向');
  });

  it('returns error when no movement specified', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = moveElement(ctx, {
      id: 'circle-001',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('指定移动方向');
  });
});

// ─── scaleElement ────────────────────────────────────────────────

describe('scaleElement', () => {
  it('scales a circle by factor', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      scale: 1.5,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(150); // 100 * 1.5
  });

  it('scales a circle by semantic "大一点"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      semantic: '大一点',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(120); // 100 * 1.2
  });

  it('scales a circle by semantic "小一点"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      semantic: '小一点',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(80); // 100 * 0.8
  });

  it('scales a circle by semantic "两倍"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      semantic: '两倍',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(200); // 100 * 2.0
  });

  it('scales a circle by semantic "一半"', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      semantic: '一半',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(50); // 100 * 0.5
  });

  it('scales a rect by factor, keeping center', () => {
    const ctx = createTestContext({
      elements: [sampleRect],
    });

    const result = scaleElement(ctx, {
      id: 'rect-001',
      scale: 2.0,
    });

    expect(result.success).toBe(true);
    // Original: x=100, y=100, w=200, h=150
    // Center: (200, 175)
    // New: w=400, h=300
    // New x = 200 - 400/2 = 0, New y = 175 - 300/2 = 25
    expect(result.element!.props.width).toBe(400);
    expect(result.element!.props.height).toBe(300);
    expect(result.element!.props.x).toBe(0);
    expect(result.element!.props.y).toBe(25);
  });

  it('scales an ellipse by factor', () => {
    const ctx = createTestContext({
      elements: [sampleEllipse],
    });

    const result = scaleElement(ctx, {
      id: 'ellipse-001',
      scale: 0.5,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.rx).toBe(60);  // 120 * 0.5
    expect(result.element!.props.ry).toBe(40);  // 80 * 0.5
  });

  it('scales text by modifying fontSize', () => {
    const ctx = createTestContext({
      elements: [{ ...sampleText, fontSize: 24 }],
    });

    const result = scaleElement(ctx, {
      id: 'text-001',
      scale: 2.0,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.fontSize).toBe(48); // 24 * 2.0
  });

  it('scales a line around its midpoint', () => {
    const ctx = createTestContext({
      elements: [sampleLine],
    });

    const result = scaleElement(ctx, {
      id: 'line-001',
      scale: 2.0,
    });

    expect(result.success).toBe(true);
    // Original: x1=40, y1=300, x2=760, y2=300
    // Midpoint: (400, 300)
    // New: x1 = 400 + (40-400)*2 = 400-720 = -320
    //       y1 = 300 + (300-300)*2 = 300
    //       x2 = 400 + (760-400)*2 = 400+720 = 1120
    //       y2 = 300
    expect(result.element!.props.x1).toBe(-320);
    expect(result.element!.props.y1).toBe(300);
    expect(result.element!.props.x2).toBe(1120);
    expect(result.element!.props.y2).toBe(300);
  });

  it('scales a triangle around its centroid', () => {
    const ctx = createTestContext({
      elements: [sampleTriangle],
    });

    const result = scaleElement(ctx, {
      id: 'triangle-001',
      scale: 2.0,
    });

    expect(result.success).toBe(true);
    // Centroid: (400, 333.33...)
    // x1 = cx + (x1-cx)*2 = 400 + (400-400)*2 = 400
    // y1 = cy + (y1-cy)*2 = 333.33 + (200-333.33)*2 = 333.33 - 266.67 = 66.67
    expect(result.element!.props.x1).toBeCloseTo(400, 1);
    expect(result.element!.props.y1).toBeCloseTo(66.67, 1);
  });

  it('returns error for unknown semantic', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      semantic: '超级大',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('未知的缩放语义');
  });

  it('returns error when no scale or semantic provided', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('指定缩放比例');
  });

  it('returns error for zero or negative scale', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      scale: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('大于0');
  });

  it('returns error for negative scale', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = scaleElement(ctx, {
      id: 'circle-001',
      scale: -1,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('大于0');
  });
});

// ─── duplicateElement ────────────────────────────────────────────

describe('duplicateElement', () => {
  it('duplicates a circle with default offset', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = duplicateElement(ctx, {
      id: 'circle-001',
    });

    expect(result.success).toBe(true);
    expect(result.elementId).not.toBe('circle-001'); // new ID
    expect(result.element).toBeDefined();
    expect(result.element!.type).toBe('circle');
    expect(result.element!.props.cx).toBe(430); // 400 + 30
    expect(result.element!.props.cy).toBe(330); // 300 + 30
    expect(result.element!.props.r).toBe(100); // same radius
  });

  it('duplicates a rect with default offset', () => {
    const ctx = createTestContext({
      elements: [sampleRect],
    });

    const result = duplicateElement(ctx, {
      id: 'rect-001',
    });

    expect(result.success).toBe(true);
    expect(result.element!.type).toBe('rect');
    expect(result.element!.props.x).toBe(130); // 100 + 30
    expect(result.element!.props.y).toBe(130); // 100 + 30
    expect(result.element!.props.width).toBe(200); // same
    expect(result.element!.props.height).toBe(150); // same
  });

  it('duplicates an element with custom offset', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = duplicateElement(ctx, {
      id: 'circle-001',
      dx: 100,
      dy: 0,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.cx).toBe(500); // 400 + 100
    expect(result.element!.props.cy).toBe(300); // 300 + 0
  });

  it('duplicates a line element', () => {
    const ctx = createTestContext({
      elements: [sampleLine],
    });

    const result = duplicateElement(ctx, {
      id: 'line-001',
    });

    expect(result.success).toBe(true);
    expect(result.element!.type).toBe('line');
    expect(result.element!.props.x1).toBe(70);  // 40 + 30
    expect(result.element!.props.y1).toBe(330); // 300 + 30
    expect(result.element!.props.x2).toBe(790); // 760 + 30
    expect(result.element!.props.y2).toBe(330); // 300 + 30
  });

  it('duplicates a triangle element', () => {
    const ctx = createTestContext({
      elements: [sampleTriangle],
    });

    const result = duplicateElement(ctx, {
      id: 'triangle-001',
    });

    expect(result.success).toBe(true);
    expect(result.element!.type).toBe('triangle');
    expect(result.element!.props.x1).toBe(430); // 400 + 30
    expect(result.element!.props.y1).toBe(230); // 200 + 30
    expect(result.element!.props.x2).toBe(330); // 300 + 30
    expect(result.element!.props.y2).toBe(430); // 400 + 30
    expect(result.element!.props.x3).toBe(530); // 500 + 30
    expect(result.element!.props.y3).toBe(430); // 400 + 30
  });

  it('duplicates the selected element when no id given', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
      selectedId: 'circle-001',
    });

    const result = duplicateElement(ctx, {});

    expect(result.success).toBe(true);
    expect(result.elementId).not.toBe('circle-001');
    expect(result.element!.props.cx).toBe(430);
    expect(result.element!.props.cy).toBe(330);
  });

  it('returns error when element not found', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result = duplicateElement(ctx, {
      id: 'nonexistent',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('未找到');
  });

  it('generates a new unique ID for the duplicate', () => {
    const ctx = createTestContext({
      elements: [sampleCircle],
    });

    const result1 = duplicateElement(ctx, { id: 'circle-001' });
    const result2 = duplicateElement(ctx, { id: 'circle-001' });

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.elementId).not.toBe(result2.elementId);
  });
});
