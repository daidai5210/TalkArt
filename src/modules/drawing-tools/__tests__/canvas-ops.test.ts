/**
 * Tests for the canvas operation tool functions.
 *
 * Covers all 3 canvas operations:
 * - clearCanvas: returns success
 * - undoAction: returns undo action descriptor
 * - exportImage: returns export action descriptor with format and filename
 */

import { describe, it, expect } from 'vitest';
import {
  clearCanvas,
  undoAction,
  exportImage,
} from '../canvas-ops';
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

// ─── clearCanvas ─────────────────────────────────────────────────

describe('clearCanvas', () => {
  it('returns success result', () => {
    const ctx = createTestContext({
      elements: [
        { id: 'circle-001', type: 'circle', cx: 400, cy: 300, r: 100 },
        { id: 'rect-001', type: 'rect', x: 100, y: 100, width: 200, height: 150 },
      ],
    });

    const result = clearCanvas(ctx);

    expect(result.success).toBe(true);
  });

  it('returns success even with empty canvas', () => {
    const ctx = createTestContext();

    const result = clearCanvas(ctx);

    expect(result.success).toBe(true);
  });

  it('does not include elementId in result', () => {
    const ctx = createTestContext({
      elements: [{ id: 'circle-001', type: 'circle', cx: 400, cy: 300, r: 100 }],
    });

    const result = clearCanvas(ctx);

    expect(result.success).toBe(true);
    expect(result.elementId).toBeUndefined();
  });

  it('does not include error in result', () => {
    const ctx = createTestContext();

    const result = clearCanvas(ctx);

    expect(result.error).toBeUndefined();
  });
});

// ─── undoAction ──────────────────────────────────────────────────

describe('undoAction', () => {
  it('returns success result with undo action', () => {
    const ctx = createTestContext();

    const result = undoAction(ctx);

    expect(result.success).toBe(true);
    expect(result.action).toBe('undo');
  });

  it('does not include elementId in result', () => {
    const ctx = createTestContext();

    const result = undoAction(ctx);

    expect(result.elementId).toBeUndefined();
  });

  it('does not include error in result', () => {
    const ctx = createTestContext();

    const result = undoAction(ctx);

    expect(result.error).toBeUndefined();
  });

  it('returns undo action regardless of canvas state', () => {
    const ctx = createTestContext({
      elements: [{ id: 'circle-001', type: 'circle', cx: 400, cy: 300, r: 100 }],
      selectedId: 'circle-001',
    });

    const result = undoAction(ctx);

    expect(result.success).toBe(true);
    expect(result.action).toBe('undo');
  });
});

// ─── exportImage ─────────────────────────────────────────────────

describe('exportImage', () => {
  it('returns success result with export action and default format', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx);

    expect(result.success).toBe(true);
    expect(result.action).toBe('export');
    expect(result.format).toBe('svg');
    expect(result.filename).toBe('talkart-export');
  });

  it('returns export with SVG format', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx, { format: 'svg' });

    expect(result.success).toBe(true);
    expect(result.action).toBe('export');
    expect(result.format).toBe('svg');
  });

  it('returns export with PNG format', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx, { format: 'png' });

    expect(result.success).toBe(true);
    expect(result.action).toBe('export');
    expect(result.format).toBe('png');
  });

  it('returns export with custom filename', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx, { filename: 'my-drawing' });

    expect(result.success).toBe(true);
    expect(result.filename).toBe('my-drawing');
  });

  it('returns export with both format and filename', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx, { format: 'png', filename: 'talkart-export-2024' });

    expect(result.success).toBe(true);
    expect(result.action).toBe('export');
    expect(result.format).toBe('png');
    expect(result.filename).toBe('talkart-export-2024');
  });

  it('defaults format to svg when not specified', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx, { filename: 'test' });

    expect(result.format).toBe('svg');
  });

  it('defaults filename to talkart-export when not specified', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx, { format: 'png' });

    expect(result.filename).toBe('talkart-export');
  });

  it('does not include elementId in result', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx);

    expect(result.elementId).toBeUndefined();
  });

  it('does not include error in result', () => {
    const ctx = createTestContext();

    const result = exportImage(ctx, { format: 'png' });

    expect(result.error).toBeUndefined();
  });
});