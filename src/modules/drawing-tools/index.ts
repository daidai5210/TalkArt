/**
 * Drawing tools module barrel export.
 *
 * Exports all 6 basic shape drawing functions, 6 element operation functions,
 * 3 canvas operation functions, type definitions, coordinate utility functions,
 * and tool definitions for LLM function calling.
 */

// Type definitions
export type {
  SemanticPosition,
  SemanticSize,
  ShapeStyle,
  ToolResult,
  CanvasContext,
  LineEndpoint,
} from './types';

// Coordinate utility functions
export {
  resolvePosition,
  resolveSize,
  resolveCircleRadius,
  parseColor,
  generateId,
  mmToPx,
  pxToMm,
  toPx,
  DPI,
} from './coordinate-utils';

// Basic shape drawing functions
export {
  drawCircle,
  drawRect,
  drawEllipse,
  drawLine,
  drawText,
  drawTriangle,
} from './basic-shapes';

// Element operation functions
export {
  selectElement,
  updateElement,
  deleteElement,
  moveElement,
  scaleElement,
  duplicateElement,
} from './element-ops';

// Canvas operation functions
export {
  clearCanvas,
  undoAction,
  exportImage,
  setCanvasSize,
  setCanvasUnit,
} from './canvas-ops';

// Tool definitions for LLM function calling
export { TOOL_DEFINITIONS } from './tool-definitions';
export type { ToolName, ToolDefinition } from './tool-definitions';
