/**
 * @module ai-agent/ToolDispatcher
 * Executes drawing tool calls from LLM responses.
 *
 * The ToolDispatcher maps LLM function_call responses to actual drawing
 * tool functions (from the drawing-tools module). It:
 * - Maintains a registry of function name → implementation mappings
 * - Executes tools with the parsed arguments from the LLM
 * - Returns structured ToolResult objects for the caller to handle
 * - Handles unknown function names gracefully
 * - Supports an optional onExecute callback for store integration
 *
 * Supported tool categories:
 * - 6 basic shape drawing tools (drawCircle, drawRect, etc.)
 * - 6 element operation tools (selectElement, updateElement, etc.)
 * - 3 canvas operation tools (clearCanvas, undoAction, exportImage)
 *
 * Usage:
 * ```ts
 * // With onExecute callback for automatic store updates
 * const dispatcher = new ToolDispatcher(canvasContext, (result) => {
 *   if (result.success && result.element) {
 *     store.addElement(result.element);
 *   }
 * });
 *
 * const result = dispatcher.dispatch('drawCircle', {
 *   position: { semantic: 'center' },
 *   size: { semantic: 'medium' },
 *   style: { fill: '红色' },
 * });
 * // result is returned AND onExecute is called
 *
 * // Without callback — just get results
 * const dispatcher2 = new ToolDispatcher(canvasContext);
 * const result2 = dispatcher2.dispatch('drawCircle', { ... });
 * ```
 */

import type { CanvasContext, ToolResult } from '../drawing-tools/types';
import {
  drawCircle,
  drawRect,
  drawEllipse,
  drawLine,
  drawText,
  drawTriangle,
} from '../drawing-tools/basic-shapes';
import {
  selectElement,
  updateElement,
  deleteElement,
  moveElement,
  scaleElement,
  duplicateElement,
} from '../drawing-tools/element-ops';
import {
  clearCanvas,
  undoAction,
  redoAction,
  exportImage,
  setCanvasSize,
  setCanvasUnit,
} from '../drawing-tools/canvas-ops';
import { TOOL_DEFINITIONS } from '../drawing-tools/tool-definitions';
import { EXECUTE_DRAWING_PLAN_DEFINITION } from '../drawing-tools/v2/tool-schema-skeleton';
import { executeDrawingPlanAsTool } from '../drawing-tools/v2/plan-executor';
import type { ExecuteDrawingPlanInput } from '../drawing-tools/v2/execute-drawing-plan.types';
import { drawPath, drawPolyline, drawPolygon } from '../drawing-tools/v2/path-tools';
import { insertImage } from '../drawing-tools/v2/asset-tools';
import { setFillGradient } from '../drawing-tools/v2/style-tools';
import { PHASE5_TOOL_DEFINITIONS } from '../drawing-tools/v2/phase5-tool-definitions';
import {
  createLayer,
  deleteLayer,
  renameLayer,
  setLayerVisibility,
  setLayerOrder,
  moveElementToLayer,
} from '../drawing-tools/v2/layer-tools';

/**
 * Extended ToolResult that includes canvas-level action descriptors
 * (e.g., 'undo', 'export') returned by canvas operation tools.
 */
export interface ExtendedToolResult extends ToolResult {
  /** Action descriptor for canvas operations (undo, export, clear). */
  action?: 'undo' | 'redo' | 'export' | 'clear' | 'setCanvasSize' | 'setCanvasUnit';
  canvasSize?: { width: number; height: number; widthMm?: number; heightMm?: number };
  defaultUnit?: 'mm' | 'px';
  elements?: Array<{ id: string; type: string; props: Record<string, unknown> }>;
  planResult?: {
    planId: string;
    completedSteps: number;
    totalSteps: number;
    errors?: Array<{ stepIndex: number; tool: string; error: string }>;
  };
  /** Export format (when action is 'export'). */
  format?: 'svg' | 'png';
  /** Export filename (when action is 'export'). */
  filename?: string;
}

/**
 * Callback type for tool execution notifications.
 * Called after each successful or failed tool execution.
 */
export type OnExecuteCallback = (result: ExtendedToolResult) => void;

/**
 * Type for a drawing tool function.
 * Each tool takes a CanvasContext and a params object, returning a ToolResult.
 * Params may be omitted for some canvas operations (clearCanvas, undoAction).
 *
 * We use `any` for the params type because each tool has its own specific
 * params interface, but the dispatcher calls them generically with args
 * parsed from the LLM's JSON response.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolFunction = (context: CanvasContext, params?: any) => ToolResult;

/**
 * Registry mapping LLM function names to their implementations.
 * The keys match the `function.name` field in TOOL_DEFINITIONS.
 *
 * Uses camelCase naming (drawCircle, selectElement, etc.) matching
 * the OpenAI function calling convention.
 *
 * We cast each function to ToolFunction because they have specific
 * params types, but the dispatcher calls them generically.
 */
const TOOL_REGISTRY: Record<string, ToolFunction> = {
  // Basic shape drawing tools
  drawCircle: drawCircle as ToolFunction,
  drawRect: drawRect as ToolFunction,
  drawEllipse: drawEllipse as ToolFunction,
  drawLine: drawLine as ToolFunction,
  drawText: drawText as ToolFunction,
  drawTriangle: drawTriangle as ToolFunction,
  // Element operation tools
  selectElement: selectElement as ToolFunction,
  updateElement: updateElement as ToolFunction,
  deleteElement: deleteElement as ToolFunction,
  moveElement: moveElement as ToolFunction,
  scaleElement: scaleElement as ToolFunction,
  duplicateElement: duplicateElement as ToolFunction,
  // Canvas operation tools
  clearCanvas: clearCanvas as ToolFunction,
  undoAction: undoAction as ToolFunction,
  redoAction: redoAction as ToolFunction,
  exportImage: exportImage as ToolFunction,
  setCanvasSize: setCanvasSize as ToolFunction,
  setCanvasUnit: setCanvasUnit as ToolFunction,
  // Phase 3 path tools
  drawPath: drawPath as ToolFunction,
  drawPolyline: drawPolyline as ToolFunction,
  drawPolygon: drawPolygon as ToolFunction,
  // Phase 3 layer tools
  createLayer: createLayer as ToolFunction,
  deleteLayer: deleteLayer as ToolFunction,
  renameLayer: renameLayer as ToolFunction,
  setLayerVisibility: setLayerVisibility as ToolFunction,
  setLayerOrder: setLayerOrder as ToolFunction,
  moveElementToLayer: moveElementToLayer as ToolFunction,
  // Phase 5 asset & style
  insertImage: insertImage as ToolFunction,
  setFillGradient: setFillGradient as ToolFunction,
};

/**
 * Dispatches LLM function calls to the appropriate drawing tool.
 *
 * The dispatcher holds a reference to the current canvas context,
 * which it passes to each tool function. The context should be
 * updated whenever the canvas changes (elements added/removed/modified).
 *
 * An optional onExecute callback can be provided to automatically
 * notify the caller (e.g., a Zustand store) of tool execution results.
 */
export class ToolDispatcher {
  /** Current canvas context, passed to all tool functions. */
  private canvasContext: CanvasContext;

  /** Optional callback invoked after each tool execution. */
  private onExecute: OnExecuteCallback | null;

  /**
   * Create a new ToolDispatcher.
   *
   * @param canvasContext - The initial canvas context
   * @param onExecute - Optional callback invoked after each tool execution.
   *   Receives the ExtendedToolResult for the caller to update the store.
   */
  constructor(canvasContext: CanvasContext, onExecute?: OnExecuteCallback) {
    this.canvasContext = canvasContext;
    this.onExecute = onExecute ?? null;
  }

  /**
   * Dispatch a function call from the LLM to the appropriate tool.
   *
   * This is the primary public API. It looks up the function by name
   * in the tool registry, calls it with the current canvas context and
   * parsed arguments, and returns the result. If an onExecute callback
   * was provided, it is also called with the result.
   *
   * @param functionName - The name of the tool to call (e.g., "drawCircle")
   * @param args - The parsed arguments from the LLM's function_call
   * @returns An ExtendedToolResult indicating success or failure
   */
  dispatch(functionName: string, args: Record<string, any>): ExtendedToolResult {
    const result = this.executeInternal(functionName, args);

    // Notify the callback if provided
    if (this.onExecute) {
      this.onExecute(result);
    }

    return result;
  }

  /**
   * Execute a function call from the LLM.
   *
   * Alias for dispatch() for backward compatibility.
   *
   * @param functionName - The name of the tool to call
   * @param args - The parsed arguments from the LLM's function_call
   * @returns An ExtendedToolResult indicating success or failure
   */
  execute(functionName: string, args: Record<string, any>): ExtendedToolResult {
    return this.dispatch(functionName, args);
  }

  /**
   * Internal execution logic shared by dispatch() and execute().
   */
  private executeInternal(functionName: string, args: Record<string, any>): ExtendedToolResult {
    if (functionName === 'executeDrawingPlan') {
      try {
        const result = executeDrawingPlanAsTool(
          this.canvasContext,
          args as ExecuteDrawingPlanInput,
          (tool, toolArgs) => this.executeInternal(tool, toolArgs),
        );
        return result as ExtendedToolResult;
      } catch (error) {
        return {
          success: false,
          error: `执行绘图计划时出错: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    }

    const toolFn = TOOL_REGISTRY[functionName];

    if (!toolFn) {
      return {
        success: false,
        error: `未知的绘图工具: "${functionName}"。可用的工具有: ${this.getToolNames().join(', ')}`,
      };
    }

    try {
      const result = toolFn(this.canvasContext, args);
      return result as ExtendedToolResult;
    } catch (error) {
      return {
        success: false,
        error: `执行工具 "${functionName}" 时出错: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Execute multiple tool calls sequentially (BFF multi tool_calls support).
   */
  dispatchMultiple(
    calls: Array<{ name: string; arguments: Record<string, any> }>,
  ): ExtendedToolResult[] {
    return calls.map((call) => this.dispatch(call.name, call.arguments));
  }

  /**
   * Update the canvas context.
   *
   * Call this whenever the canvas state changes (elements added, removed,
   * or modified) so that subsequent tool calls have accurate context.
   *
   * @param context - The new canvas context
   */
  updateContext(context: CanvasContext): void {
    this.canvasContext = context;
  }

  /**
   * Get all available tool definitions for the LLM.
   *
   * Returns the TOOL_DEFINITIONS array that should be passed to the
   * LLM API via the `tools` parameter.
   *
   * @returns Array of OpenAI-compatible tool definitions
   */
  getToolDefinitions(): any[] {
    // v0.1 tools + Phase 2 orchestration tool
    return [...TOOL_DEFINITIONS, EXECUTE_DRAWING_PLAN_DEFINITION, ...PHASE5_TOOL_DEFINITIONS];
  }

  /**
   * Check if a function name is a known tool.
   *
   * @param functionName - The function name to check
   * @returns True if the function is registered
   */
  hasTool(functionName: string): boolean {
    return functionName in TOOL_REGISTRY;
  }

  /**
   * Get the list of all registered tool function names.
   *
   * @returns Array of tool function names
   */
  getToolNames(): string[] {
    return [...Object.keys(TOOL_REGISTRY), 'executeDrawingPlan'];
  }
}
