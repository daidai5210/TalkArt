/**
 * @module ai-agent/__tests__/ToolDispatcher.test
 * Tests for the ToolDispatcher class.
 *
 * Covers:
 * - Dispatching function calls to correct tools with correct arguments
 * - Handling unknown function names gracefully (error result)
 * - onExecute callback invocation
 * - Canvas context updating
 * - Tool definition retrieval
 * - Tool name querying (hasTool, getToolNames)
 * - Error handling within tool functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolDispatcher } from '../ToolDispatcher';
import type { OnExecuteCallback } from '../ToolDispatcher';
import type { CanvasContext } from '../../drawing-tools/types';

/** Helper: create a default canvas context for testing. */
function createCanvasContext(overrides?: Partial<CanvasContext>): CanvasContext {
  return {
    width: 800,
    height: 600,
    elements: [],
    selectedId: null,
    ...overrides,
  };
}

/** Helper: create a canvas context with a circle element. */
function createCanvasContextWithCircle(): CanvasContext {
  return createCanvasContext({
    elements: [
      {
        id: 'circle-test-1',
        type: 'circle',
        cx: 400,
        cy: 300,
        r: 100,
        fill: '#FF0000',
        stroke: 'none',
        strokeWidth: 0,
      },
    ],
    selectedId: 'circle-test-1',
  });
}

describe('ToolDispatcher', () => {
  let dispatcher: ToolDispatcher;
  let defaultContext: CanvasContext;

  beforeEach(() => {
    defaultContext = createCanvasContext();
    dispatcher = new ToolDispatcher(defaultContext);
  });

  // =========================================================================
  // Basic shape drawing tools
  // =========================================================================

  describe('drawCircle', () => {
    it('should dispatch drawCircle with semantic position and size', () => {
      const result = dispatcher.dispatch('drawCircle', {
        position: { semantic: 'center' },
        size: { semantic: 'medium' },
        style: { fill: '红色' },
      });

      expect(result.success).toBe(true);
      expect(result.element).toBeDefined();
      expect(result.element?.type).toBe('circle');
      expect(result.element?.props.cx).toBe(400); // center of 800
      expect(result.element?.props.cy).toBe(300); // center of 600
      expect(result.element?.props.r).toBe(100);  // medium
      expect(result.element?.props.fill).toBe('#FF0000'); // 红色 → #FF0000
    });

    it('should dispatch drawCircle with exact position and radius', () => {
      const result = dispatcher.dispatch('drawCircle', {
        position: { x: 100, y: 200 },
        r: 50,
      });

      expect(result.success).toBe(true);
      expect(result.element?.type).toBe('circle');
      expect(result.element?.props.cx).toBe(150); // x + r
      expect(result.element?.props.cy).toBe(250); // y + r
      expect(result.element?.props.r).toBe(50);
    });

    it('should dispatch drawCircle with default values', () => {
      const result = dispatcher.dispatch('drawCircle', {
        position: { semantic: 'center' },
      });

      expect(result.success).toBe(true);
      expect(result.element?.type).toBe('circle');
      expect(result.element?.props.r).toBe(100); // default radius
    });
  });

  describe('drawRect', () => {
    it('should dispatch drawRect with semantic position and size', () => {
      const result = dispatcher.dispatch('drawRect', {
        position: { semantic: 'center' },
        size: { semantic: 'large' },
      });

      expect(result.success).toBe(true);
      expect(result.element).toBeDefined();
      expect(result.element?.type).toBe('rect');
      expect(result.element?.props.width).toBe(300); // large
      expect(result.element?.props.height).toBe(300); // large
    });

    it('should dispatch drawRect with exact dimensions', () => {
      const result = dispatcher.dispatch('drawRect', {
        position: { x: 10, y: 20 },
        size: { width: 100, height: 50 },
      });

      expect(result.success).toBe(true);
      expect(result.element?.props.x).toBe(10);
      expect(result.element?.props.y).toBe(20);
      expect(result.element?.props.width).toBe(100);
      expect(result.element?.props.height).toBe(50);
    });
  });

  describe('drawEllipse', () => {
    it('should dispatch drawEllipse with explicit rx and ry', () => {
      const result = dispatcher.dispatch('drawEllipse', {
        position: { semantic: 'center' },
        rx: 60,
        ry: 40,
      });

      expect(result.success).toBe(true);
      expect(result.element?.type).toBe('ellipse');
      expect(result.element?.props.rx).toBe(60);
      expect(result.element?.props.ry).toBe(40);
    });
  });

  describe('drawLine', () => {
    it('should dispatch drawLine with semantic endpoints', () => {
      const result = dispatcher.dispatch('drawLine', {
        start: { semantic: 'left' },
        end: { semantic: 'right' },
      });

      expect(result.success).toBe(true);
      expect(result.element?.type).toBe('line');
      expect(result.element?.props.x1).toBeDefined();
      expect(result.element?.props.y1).toBeDefined();
      expect(result.element?.props.x2).toBeDefined();
      expect(result.element?.props.y2).toBeDefined();
    });
  });

  describe('drawText', () => {
    it('should dispatch drawText with text content', () => {
      const result = dispatcher.dispatch('drawText', {
        position: { semantic: 'center' },
        text: '你好世界',
      });

      expect(result.success).toBe(true);
      expect(result.element?.type).toBe('text');
      expect(result.element?.props.text).toBe('你好世界');
      expect(result.element?.props.fontSize).toBe(24); // default
    });

    it('should fail when text content is missing', () => {
      const result = dispatcher.dispatch('drawText', {
        position: { semantic: 'center' },
        text: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('drawTriangle', () => {
    it('should dispatch drawTriangle with semantic position', () => {
      const result = dispatcher.dispatch('drawTriangle', {
        position: { semantic: 'center' },
        size: { semantic: 'medium' },
      });

      expect(result.success).toBe(true);
      expect(result.element?.type).toBe('triangle');
      expect(result.element?.props.x1).toBeDefined();
      expect(result.element?.props.y1).toBeDefined();
      expect(result.element?.props.x2).toBeDefined();
      expect(result.element?.props.y2).toBeDefined();
      expect(result.element?.props.x3).toBeDefined();
      expect(result.element?.props.y3).toBeDefined();
    });
  });

  // =========================================================================
  // Element operation tools
  // =========================================================================

  describe('selectElement', () => {
    it('should dispatch selectElement and return elementId', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('selectElement', {
        id: 'circle-test-1',
      });

      expect(result.success).toBe(true);
      expect(result.elementId).toBe('circle-test-1');
    });

    it('should fail when no elements exist', () => {
      const result = dispatcher.dispatch('selectElement', { id: 'nonexistent' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('updateElement', () => {
    it('should dispatch updateElement with new properties', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('updateElement', {
        id: 'circle-test-1',
        properties: { fill: '蓝色' },
      });

      expect(result.success).toBe(true);
      expect(result.elementId).toBe('circle-test-1');
      expect(result.element).toBeDefined();
      expect(result.element?.props.fill).toBe('#0000FF'); // 蓝色 → #0000FF
    });

    it('should fail when no properties provided', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('updateElement', {
        id: 'circle-test-1',
        properties: {},
      });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteElement', () => {
    it('should dispatch deleteElement and return the elementId', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('deleteElement', {
        id: 'circle-test-1',
      });

      expect(result.success).toBe(true);
      expect(result.elementId).toBe('circle-test-1');
    });

    it('should fail when no elements exist', () => {
      const result = dispatcher.dispatch('deleteElement', { id: 'nonexistent' });

      expect(result.success).toBe(false);
    });
  });

  describe('moveElement', () => {
    it('should dispatch moveElement with dx/dy offsets', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('moveElement', {
        id: 'circle-test-1',
        dx: 50,
        dy: -30,
      });

      expect(result.success).toBe(true);
      expect(result.element?.props.cx).toBe(450); // 400 + 50
      expect(result.element?.props.cy).toBe(270); // 300 - 30
    });

    it('should dispatch moveElement with semantic direction', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('moveElement', {
        id: 'circle-test-1',
        direction: '右边',
      });

      expect(result.success).toBe(true);
      expect(result.element?.props.cx).toBe(450); // 400 + 50
    });
  });

  describe('scaleElement', () => {
    it('should dispatch scaleElement with numeric scale factor', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('scaleElement', {
        id: 'circle-test-1',
        scale: 1.5,
      });

      expect(result.success).toBe(true);
      expect(result.element?.props.r).toBe(150); // 100 * 1.5
    });

    it('should dispatch scaleElement with semantic scale', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('scaleElement', {
        id: 'circle-test-1',
        semantic: '两倍',
      });

      expect(result.success).toBe(true);
      expect(result.element?.props.r).toBe(200); // 100 * 2
    });
  });

  describe('duplicateElement', () => {
    it('should dispatch duplicateElement and create a new element', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('duplicateElement', {
        id: 'circle-test-1',
      });

      expect(result.success).toBe(true);
      expect(result.elementId).not.toBe('circle-test-1'); // new ID
      expect(result.element?.type).toBe('circle');
      expect(result.element?.props.cx).toBe(430); // 400 + 30 (default offset)
      expect(result.element?.props.cy).toBe(330); // 300 + 30
    });

    it('should dispatch duplicateElement with custom offset', () => {
      const ctx = createCanvasContextWithCircle();
      dispatcher.updateContext(ctx);

      const result = dispatcher.dispatch('duplicateElement', {
        id: 'circle-test-1',
        dx: 100,
        dy: 0,
      });

      expect(result.success).toBe(true);
      expect(result.element?.props.cx).toBe(500); // 400 + 100
    });
  });

  // =========================================================================
  // Canvas operation tools
  // =========================================================================

  describe('clearCanvas', () => {
    it('should dispatch clearCanvas and return success', () => {
      const result = dispatcher.dispatch('clearCanvas', {});

      expect(result.success).toBe(true);
    });
  });

  describe('undoAction', () => {
    it('should dispatch undoAction and return success with action=undo', () => {
      const result = dispatcher.dispatch('undoAction', {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('undo');
    });
  });

  describe('exportImage', () => {
    it('should dispatch exportImage with default format', () => {
      const result = dispatcher.dispatch('exportImage', {});

      expect(result.success).toBe(true);
      expect(result.action).toBe('export');
      expect(result.format).toBe('svg'); // default
      expect(result.filename).toBe('talkart-export'); // default
    });

    it('should dispatch exportImage with custom format and filename', () => {
      const result = dispatcher.dispatch('exportImage', {
        format: 'png',
        filename: 'my-drawing',
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('export');
      expect(result.format).toBe('png');
      expect(result.filename).toBe('my-drawing');
    });
  });

  // =========================================================================
  // Unknown function name handling
  // =========================================================================

  describe('unknown function names', () => {
    it('should return error result for unknown function name', () => {
      const result = dispatcher.dispatch('unknownFunction', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('unknownFunction');
    });

    it('should list available tools in error message', () => {
      const result = dispatcher.dispatch('nonexistentTool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('drawCircle');
      expect(result.error).toContain('drawRect');
      expect(result.error).toContain('clearCanvas');
    });
  });

  // =========================================================================
  // onExecute callback
  // =========================================================================

  describe('onExecute callback', () => {
    it('should invoke onExecute callback with the result', () => {
      const onExecute: OnExecuteCallback = vi.fn();
      const dispatcherWithCallback = new ToolDispatcher(defaultContext, onExecute);

      const result = dispatcherWithCallback.dispatch('drawCircle', {
        position: { semantic: 'center' },
      });

      expect(onExecute).toHaveBeenCalledTimes(1);
      expect(onExecute).toHaveBeenCalledWith(result);
    });

    it('should invoke onExecute even for failed dispatches', () => {
      const onExecute: OnExecuteCallback = vi.fn();
      const dispatcherWithCallback = new ToolDispatcher(defaultContext, onExecute);

      const result = dispatcherWithCallback.dispatch('unknownTool', {});

      expect(onExecute).toHaveBeenCalledTimes(1);
      expect(onExecute).toHaveBeenCalledWith(result);
      expect(result.success).toBe(false);
    });

    it('should work without onExecute callback', () => {
      // No callback provided — should not throw
      const result = dispatcher.dispatch('drawCircle', {
        position: { semantic: 'center' },
      });

      expect(result.success).toBe(true);
    });
  });

  // =========================================================================
  // Canvas context updating
  // =========================================================================

  describe('updateContext', () => {
    it('should use updated canvas context for subsequent dispatches', () => {
      // Start with empty canvas
      let result = dispatcher.dispatch('selectElement', { id: 'circle-1' });
      expect(result.success).toBe(false); // no elements

      // Update context with an element
      const ctxWithElement = createCanvasContextWithCircle();
      dispatcher.updateContext(ctxWithElement);

      // Now selectElement should work
      result = dispatcher.dispatch('selectElement', { id: 'circle-test-1' });
      expect(result.success).toBe(true);
    });
  });

  // =========================================================================
  // Tool querying
  // =========================================================================

  describe('hasTool', () => {
    it('should return true for known tool names', () => {
      expect(dispatcher.hasTool('drawCircle')).toBe(true);
      expect(dispatcher.hasTool('drawRect')).toBe(true);
      expect(dispatcher.hasTool('selectElement')).toBe(true);
      expect(dispatcher.hasTool('clearCanvas')).toBe(true);
    });

    it('should return false for unknown tool names', () => {
      expect(dispatcher.hasTool('unknownTool')).toBe(false);
      expect(dispatcher.hasTool('')).toBe(false);
    });
  });

  describe('getToolNames', () => {
    it('should return all registered tool names', () => {
      const names = dispatcher.getToolNames();

      expect(names).toHaveLength(28);
      expect(names).toContain('executeDrawingPlan');
      expect(names).toContain('drawPolyline');
      expect(names).toContain('createLayer');
      expect(names).toContain('drawCircle');
      expect(names).toContain('drawRect');
      expect(names).toContain('drawEllipse');
      expect(names).toContain('drawLine');
      expect(names).toContain('drawText');
      expect(names).toContain('drawTriangle');
      expect(names).toContain('selectElement');
      expect(names).toContain('updateElement');
      expect(names).toContain('deleteElement');
      expect(names).toContain('moveElement');
      expect(names).toContain('scaleElement');
      expect(names).toContain('duplicateElement');
      expect(names).toContain('clearCanvas');
      expect(names).toContain('undoAction');
      expect(names).toContain('redoAction');
      expect(names).toContain('exportImage');
    });
  });

  describe('getToolDefinitions', () => {
    it('should return all 15 tool definitions', () => {
      const definitions = dispatcher.getToolDefinitions();

      expect(definitions).toHaveLength(16);
      definitions.forEach((def) => {
        expect(def.type).toBe('function');
        expect(def.function.name).toBeTruthy();
        expect(def.function.description).toBeTruthy();
        expect(def.function.parameters).toBeDefined();
      });
    });

    it('should return a copy (modifying result does not affect dispatcher)', () => {
      const defs1 = dispatcher.getToolDefinitions();
      defs1.push({ type: 'function', function: { name: 'fake', description: '', parameters: { type: 'object', properties: {} } } });

      const defs2 = dispatcher.getToolDefinitions();
      expect(defs2).toHaveLength(16); // original unaffected
    });
  });

  // =========================================================================
  // execute() backward compatibility
  // =========================================================================

  describe('execute (backward compat alias)', () => {
    it('should produce the same result as dispatch()', () => {
      const dispatchResult = dispatcher.dispatch('drawCircle', {
        position: { semantic: 'center' },
      });

      // Create a new dispatcher with the same context to get a fresh result
      const dispatcher2 = new ToolDispatcher(defaultContext);
      const executeResult = dispatcher2.execute('drawCircle', {
        position: { semantic: 'center' },
      });

      expect(executeResult.success).toBe(dispatchResult.success);
      expect(executeResult.element?.type).toBe(dispatchResult.element?.type);
    });

    it('should invoke onExecute callback when using execute()', () => {
      const onExecute: OnExecuteCallback = vi.fn();
      const dispatcherWithCallback = new ToolDispatcher(defaultContext, onExecute);

      dispatcherWithCallback.execute('drawCircle', {
        position: { semantic: 'center' },
      });

      expect(onExecute).toHaveBeenCalledTimes(1);
    });
  });
});
