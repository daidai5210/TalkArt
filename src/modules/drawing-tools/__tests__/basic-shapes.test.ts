/**
 * Tests for the drawing-tools module.
 *
 * Covers:
 * - All 6 draw functions with default parameters
 * - Semantic position resolution ("center", "top-left", etc.)
 * - Semantic size resolution ("small", "medium", "large")
 * - Color parsing (Chinese names → hex)
 * - Error cases
 */

import { describe, it, expect } from 'vitest';
import {
  drawCircle,
  drawRect,
  drawEllipse,
  drawLine,
  drawText,
  drawTriangle,
  resolvePosition,
  resolveSize,
  resolveCircleRadius,
  parseColor,
  generateId,
} from '../index';
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

// ─── Coordinate utilities ────────────────────────────────────────

describe('resolvePosition', () => {
  const canvasWidth = 800;
  const canvasHeight = 600;
  const elementWidth = 200;
  const elementHeight = 150;

  it('resolves "center" position', () => {
    const result = resolvePosition(
      { semantic: 'center' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(300); // 800/2 - 200/2
    expect(result.y).toBe(225); // 600/2 - 150/2
  });

  it('resolves "top-left" position', () => {
    const result = resolvePosition(
      { semantic: 'top-left' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(40);
    expect(result.y).toBe(40);
  });

  it('resolves "top-right" position', () => {
    const result = resolvePosition(
      { semantic: 'top-right' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(560); // 800 - 200 - 40
    expect(result.y).toBe(40);
  });

  it('resolves "bottom-left" position', () => {
    const result = resolvePosition(
      { semantic: 'bottom-left' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(40);
    expect(result.y).toBe(410); // 600 - 150 - 40
  });

  it('resolves "bottom-right" position', () => {
    const result = resolvePosition(
      { semantic: 'bottom-right' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(560); // 800 - 200 - 40
    expect(result.y).toBe(410); // 600 - 150 - 40
  });

  it('resolves "top" position (centered horizontally, top edge)', () => {
    const result = resolvePosition(
      { semantic: 'top' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(300); // 800/2 - 200/2
    expect(result.y).toBe(40);
  });

  it('resolves "bottom" position (centered horizontally, bottom edge)', () => {
    const result = resolvePosition(
      { semantic: 'bottom' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(300); // 800/2 - 200/2
    expect(result.y).toBe(410); // 600 - 150 - 40
  });

  it('resolves "left" position (left edge, centered vertically)', () => {
    const result = resolvePosition(
      { semantic: 'left' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(40);
    expect(result.y).toBe(225); // 600/2 - 150/2
  });

  it('resolves "right" position (right edge, centered vertically)', () => {
    const result = resolvePosition(
      { semantic: 'right' },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(560); // 800 - 200 - 40
    expect(result.y).toBe(225); // 600/2 - 150/2
  });

  it('uses exact coordinates when provided', () => {
    const result = resolvePosition(
      { x: 123, y: 456 },
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(123);
    expect(result.y).toBe(456);
  });

  it('defaults to "center" when no semantic or exact position given', () => {
    const result = resolvePosition(
      {},
      canvasWidth,
      canvasHeight,
      elementWidth,
      elementHeight,
    );
    expect(result.x).toBe(300);
    expect(result.y).toBe(225);
  });
});

describe('resolveSize', () => {
  it('resolves "small" semantic size', () => {
    const result = resolveSize({ semantic: 'small' }, 800, 600);
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
  });

  it('resolves "medium" semantic size', () => {
    const result = resolveSize({ semantic: 'medium' }, 800, 600);
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
  });

  it('resolves "large" semantic size', () => {
    const result = resolveSize({ semantic: 'large' }, 800, 600);
    expect(result.width).toBe(300);
    expect(result.height).toBe(300);
  });

  it('uses exact dimensions when provided', () => {
    const result = resolveSize({ width: 150, height: 250 }, 800, 600);
    expect(result.width).toBe(150);
    expect(result.height).toBe(250);
  });

  it('defaults to "medium" when no size information given', () => {
    const result = resolveSize({}, 800, 600);
    expect(result.width).toBe(200);
    expect(result.height).toBe(200);
  });
});

describe('resolveCircleRadius', () => {
  it('returns 50 for "small"', () => {
    expect(resolveCircleRadius('small')).toBe(50);
  });

  it('returns 100 for "medium"', () => {
    expect(resolveCircleRadius('medium')).toBe(100);
  });

  it('returns 150 for "large"', () => {
    expect(resolveCircleRadius('large')).toBe(150);
  });

  it('defaults to 100 (medium) when no size given', () => {
    expect(resolveCircleRadius()).toBe(100);
  });
});

describe('parseColor', () => {
  it('maps Chinese color names to hex codes', () => {
    expect(parseColor('红色')).toBe('#FF0000');
    expect(parseColor('蓝色')).toBe('#0000FF');
    expect(parseColor('绿色')).toBe('#00FF00');
    expect(parseColor('黄色')).toBe('#FFFF00');
    expect(parseColor('黑色')).toBe('#000000');
    expect(parseColor('白色')).toBe('#FFFFFF');
    expect(parseColor('橙色')).toBe('#FF8800');
    expect(parseColor('紫色')).toBe('#7c5cfc');
    expect(parseColor('粉色')).toBe('#FF69B4');
    expect(parseColor('灰色')).toBe('#808080');
    expect(parseColor('青色')).toBe('#00FFFF');
  });

  it('passes through hex color codes', () => {
    expect(parseColor('#FF5500')).toBe('#FF5500');
    expect(parseColor('#abc')).toBe('#abc');
  });

  it('passes through CSS color names', () => {
    expect(parseColor('red')).toBe('red');
    expect(parseColor('blue')).toBe('blue');
    expect(parseColor('cornflowerblue')).toBe('cornflowerblue');
  });

  it('returns default purple for empty string', () => {
    expect(parseColor('')).toBe('#7c5cfc');
  });
});

describe('generateId', () => {
  it('generates an ID with the correct type prefix', () => {
    const id = generateId('circle');
    expect(id.startsWith('circle-')).toBe(true);
  });

  it('generates unique IDs', () => {
    const id1 = generateId('rect');
    const id2 = generateId('rect');
    expect(id1).not.toBe(id2);
  });
});

// ─── Draw functions with default params ──────────────────────────

describe('drawCircle', () => {
  it('draws a circle with default parameters', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, { position: { semantic: 'center' } });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeTruthy();
    expect(result.element).toBeDefined();
    expect(result.element!.type).toBe('circle');
    expect(result.element!.props.r).toBe(100); // default radius
    expect(result.element!.props.fill).toBe('#7c5cfc'); // default fill
    expect(result.element!.props.stroke).toBe('none');
    expect(result.element!.props.strokeWidth).toBe(0);
  });

  it('draws a circle with explicit radius', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, { position: { semantic: 'center' }, r: 50 });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(50);
  });

  it('draws a circle with semantic size "small"', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, { position: { semantic: 'center' }, size: { semantic: 'small' } });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(50);
  });

  it('draws a circle with semantic size "large"', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, { position: { semantic: 'center' }, size: { semantic: 'large' } });

    expect(result.success).toBe(true);
    expect(result.element!.props.r).toBe(150);
  });

  it('computes center from resolved position', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, { position: { semantic: 'center' }, r: 100 });

    // center of 800x600 canvas, circle r=100, bbox=200x200
    // position: x=300, y=200 → cx=400, cy=300
    expect(result.element!.props.cx).toBe(400);
    expect(result.element!.props.cy).toBe(300);
  });

  it('draws a circle with custom style', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, {
      position: { semantic: 'top-left' },
      style: { fill: '#FF0000', stroke: '#000000', strokeWidth: 2 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.fill).toBe('#FF0000');
    expect(result.element!.props.stroke).toBe('#000000');
    expect(result.element!.props.strokeWidth).toBe(2);
  });

  it('draws a circle with Chinese color name', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, {
      position: { semantic: 'center' },
      style: { fill: '红色' },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.fill).toBe('#FF0000');
  });

  it('uses exact position coordinates', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, { position: { x: 100, y: 100 }, r: 50 });

    expect(result.success).toBe(true);
    expect(result.element!.props.cx).toBe(150); // 100 + 50
    expect(result.element!.props.cy).toBe(150); // 100 + 50
  });
});

describe('drawRect', () => {
  it('draws a rect with default parameters', () => {
    const ctx = createTestContext();
    const result = drawRect(ctx, { position: { semantic: 'center' }, size: { semantic: 'medium' } });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeTruthy();
    expect(result.element).toBeDefined();
    expect(result.element!.type).toBe('rect');
    expect(result.element!.props.width).toBe(200);
    expect(result.element!.props.height).toBe(200);
    expect(result.element!.props.fill).toBe('#7c5cfc');
  });

  it('draws a rect with exact size', () => {
    const ctx = createTestContext();
    const result = drawRect(ctx, {
      position: { semantic: 'center' },
      size: { width: 300, height: 200 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.width).toBe(300);
    expect(result.element!.props.height).toBe(200);
  });

  it('draws a rect with corner radius', () => {
    const ctx = createTestContext();
    const result = drawRect(ctx, {
      position: { semantic: 'center' },
      size: { semantic: 'medium' },
      style: { cornerRadius: 10 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.rx).toBe(10);
    expect(result.element!.props.ry).toBe(10);
  });

  it('positions rect at "top-left"', () => {
    const ctx = createTestContext();
    const result = drawRect(ctx, {
      position: { semantic: 'top-left' },
      size: { width: 200, height: 150 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.x).toBe(40);
    expect(result.element!.props.y).toBe(40);
  });

  it('positions rect at "bottom-right"', () => {
    const ctx = createTestContext();
    const result = drawRect(ctx, {
      position: { semantic: 'bottom-right' },
      size: { width: 200, height: 150 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.x).toBe(560); // 800 - 200 - 40
    expect(result.element!.props.y).toBe(410); // 600 - 150 - 40
  });
});

describe('drawEllipse', () => {
  it('draws an ellipse with default parameters', () => {
    const ctx = createTestContext();
    const result = drawEllipse(ctx, { position: { semantic: 'center' } });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeTruthy();
    expect(result.element).toBeDefined();
    expect(result.element!.type).toBe('ellipse');
    expect(result.element!.props.rx).toBe(120); // default
    expect(result.element!.props.ry).toBe(80);  // default
    expect(result.element!.props.fill).toBe('#7c5cfc');
  });

  it('draws an ellipse with explicit rx/ry', () => {
    const ctx = createTestContext();
    const result = drawEllipse(ctx, {
      position: { semantic: 'center' },
      rx: 60,
      ry: 40,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.rx).toBe(60);
    expect(result.element!.props.ry).toBe(40);
  });

  it('draws an ellipse with semantic size', () => {
    const ctx = createTestContext();
    const result = drawEllipse(ctx, {
      position: { semantic: 'center' },
      size: { semantic: 'small' },
    });

    expect(result.success).toBe(true);
    // small = 100x100, so rx=50, ry=50
    expect(result.element!.props.rx).toBe(50);
    expect(result.element!.props.ry).toBe(50);
  });

  it('computes center from resolved position', () => {
    const ctx = createTestContext();
    const result = drawEllipse(ctx, {
      position: { semantic: 'center' },
      rx: 120,
      ry: 80,
    });

    // bbox = 240x160, position center of 800x600 → x=280, y=220
    // cx = 280 + 120 = 400, cy = 220 + 80 = 300
    expect(result.element!.props.cx).toBe(400);
    expect(result.element!.props.cy).toBe(300);
  });
});

describe('drawLine', () => {
  it('draws a line with default parameters (left to right)', () => {
    const ctx = createTestContext();
    const result = drawLine(ctx, { start: {}, end: {} });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeTruthy();
    expect(result.element).toBeDefined();
    expect(result.element!.type).toBe('line');
    expect(result.element!.props.stroke).toBe('#ffffff');
    expect(result.element!.props.strokeWidth).toBe(2);
  });

  it('draws a line with exact coordinates', () => {
    const ctx = createTestContext();
    const result = drawLine(ctx, {
      start: { x: 10, y: 20 },
      end: { x: 300, y: 400 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.x1).toBe(10);
    expect(result.element!.props.y1).toBe(20);
    expect(result.element!.props.x2).toBe(300);
    expect(result.element!.props.y2).toBe(400);
  });

  it('draws a line with semantic endpoints', () => {
    const ctx = createTestContext();
    const result = drawLine(ctx, {
      start: { semantic: 'top-left' },
      end: { semantic: 'bottom-right' },
    });

    expect(result.success).toBe(true);
    // top-left with 1x1 element → x=40, y=40
    expect(result.element!.props.x1).toBe(40);
    expect(result.element!.props.y1).toBe(40);
    // bottom-right with 1x1 element → x=800-1-40=759, y=600-1-40=559
    expect(result.element!.props.x2).toBe(759);
    expect(result.element!.props.y2).toBe(559);
  });

  it('draws a line with custom stroke', () => {
    const ctx = createTestContext();
    const result = drawLine(ctx, {
      start: { semantic: 'left' },
      end: { semantic: 'right' },
      stroke: '红色',
      strokeWidth: 3,
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.stroke).toBe('#FF0000');
    expect(result.element!.props.strokeWidth).toBe(3);
  });

  it('defaults start to "left" and end to "right"', () => {
    const ctx = createTestContext();
    const result = drawLine(ctx, { start: {}, end: {} });

    expect(result.success).toBe(true);
    // left with 1x1 element → x=40, y=600/2 - 1/2 = 299.5
    expect(result.element!.props.x1).toBe(40);
    expect(result.element!.props.y1).toBe(299.5);
    // right with 1x1 element → x=800-1-40=759, y=299.5
    expect(result.element!.props.x2).toBe(759);
    expect(result.element!.props.y2).toBe(299.5);
  });
});

describe('drawText', () => {
  it('draws text with default parameters', () => {
    const ctx = createTestContext();
    const result = drawText(ctx, {
      position: { semantic: 'center' },
      text: 'Hello',
    });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeTruthy();
    expect(result.element).toBeDefined();
    expect(result.element!.type).toBe('text');
    expect(result.element!.props.text).toBe('Hello');
    expect(result.element!.props.fontSize).toBe(24);
    expect(result.element!.props.fontFamily).toBe('sans-serif');
    expect(result.element!.props.fill).toBe('#ffffff');
  });

  it('draws text with custom styling', () => {
    const ctx = createTestContext();
    const result = drawText(ctx, {
      position: { semantic: 'top-left' },
      text: 'TalkArt',
      fontSize: 36,
      fontFamily: 'serif',
      fill: '蓝色',
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.text).toBe('TalkArt');
    expect(result.element!.props.fontSize).toBe(36);
    expect(result.element!.props.fontFamily).toBe('serif');
    expect(result.element!.props.fill).toBe('#0000FF');
  });

  it('offsets y by fontSize for SVG baseline', () => {
    const ctx = createTestContext();
    const result = drawText(ctx, {
      position: { x: 100, y: 200 },
      text: 'Test',
      fontSize: 30,
    });

    expect(result.success).toBe(true);
    // y should be position.y + fontSize (baseline offset)
    expect(result.element!.props.y).toBe(230);
  });

  it('returns error when text is empty', () => {
    const ctx = createTestContext();
    const result = drawText(ctx, {
      position: { semantic: 'center' },
      text: '',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('drawTriangle', () => {
  it('draws a triangle with default parameters', () => {
    const ctx = createTestContext();
    const result = drawTriangle(ctx, { position: { semantic: 'center' } });

    expect(result.success).toBe(true);
    expect(result.elementId).toBeTruthy();
    expect(result.element).toBeDefined();
    expect(result.element!.type).toBe('triangle');
    expect(result.element!.props.fill).toBe('#7c5cfc');
  });

  it('draws a triangle with semantic size', () => {
    const ctx = createTestContext();
    const result = drawTriangle(ctx, {
      position: { semantic: 'center' },
      size: { semantic: 'small' },
    });

    expect(result.success).toBe(true);
    // small = 100x100, centered on 800x600 → x=350, y=250
    // top-center: (400, 250), bottom-left: (350, 350), bottom-right: (450, 350)
    expect(result.element!.props.x1).toBe(400);
    expect(result.element!.props.y1).toBe(250);
    expect(result.element!.props.x2).toBe(350);
    expect(result.element!.props.y2).toBe(350);
    expect(result.element!.props.x3).toBe(450);
    expect(result.element!.props.y3).toBe(350);
  });

  it('draws a triangle with exact size', () => {
    const ctx = createTestContext();
    const result = drawTriangle(ctx, {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.x1).toBe(50);  // top-center
    expect(result.element!.props.y1).toBe(0);
    expect(result.element!.props.x2).toBe(0);   // bottom-left
    expect(result.element!.props.y2).toBe(100);
    expect(result.element!.props.x3).toBe(100); // bottom-right
    expect(result.element!.props.y3).toBe(100);
  });

  it('draws a triangle with custom style', () => {
    const ctx = createTestContext();
    const result = drawTriangle(ctx, {
      position: { semantic: 'center' },
      style: { fill: '绿色', stroke: '#000000', strokeWidth: 2 },
    });

    expect(result.success).toBe(true);
    expect(result.element!.props.fill).toBe('#00FF00');
    expect(result.element!.props.stroke).toBe('#000000');
    expect(result.element!.props.strokeWidth).toBe(2);
  });

  it('defaults to compact 15mm size (not oversized medium)', () => {
    const ctx = createTestContext();
    const result = drawTriangle(ctx, { position: { semantic: 'center' } });

    expect(result.success).toBe(true);
    const w = result.element!.props.x3 - result.element!.props.x2;
    const h = result.element!.props.y2 - result.element!.props.y1;
    expect(w).toBeGreaterThan(40);
    expect(w).toBeLessThan(80);
    expect(h).toBeGreaterThan(40);
    expect(h).toBeLessThan(80);
  });
});

// ─── Error cases ─────────────────────────────────────────────────

describe('error handling', () => {
  it('drawCircle returns ToolResult with success boolean', () => {
    const ctx = createTestContext();
    const result = drawCircle(ctx, { position: { semantic: 'center' } });
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('elementId');
  });

  it('drawText returns error for empty text', () => {
    const ctx = createTestContext();
    const result = drawText(ctx, { position: { semantic: 'center' }, text: '' });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('drawRect returns valid result with minimal params', () => {
    const ctx = createTestContext();
    const result = drawRect(ctx, { position: {}, size: {} });
    expect(result.success).toBe(true);
  });

  it('drawLine handles missing start/end with defaults', () => {
    const ctx = createTestContext();
    const result = drawLine(ctx, { start: {}, end: {} });
    expect(result.success).toBe(true);
    // Should default to left→right
    expect(result.element!.props.x1 as number).toBeLessThan(result.element!.props.x2 as number);
  });
});
