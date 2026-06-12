/**
 * Type definitions for the drawing tools module.
 * These types define the semantic parameters that the AI Agent uses
 * to describe shapes, which are then resolved to exact SVG coordinates.
 */

/**
 * Semantic position specification.
 * The AI can specify position either semantically (e.g., "center", "top-left")
 * or with exact coordinates.
 */
export type CoordinateUnit = 'mm' | 'px';

export interface SemanticPosition {
  semantic?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
  x?: number;
  y?: number;
  /** Coordinate unit for x/y. Defaults to canvas defaultUnit or px. */
  unit?: CoordinateUnit;
}

/**
 * Semantic size specification.
 * The AI can specify size either semantically (e.g., "small", "medium", "large")
 * or with exact dimensions.
 */
export interface SemanticSize {
  semantic?: 'small' | 'medium' | 'large';
  width?: number;
  height?: number;
  /** Coordinate unit for width/height. Defaults to canvas defaultUnit or px. */
  unit?: CoordinateUnit;
}

/**
 * Style properties for shapes.
 * These map directly to SVG presentation attributes.
 */
export interface ShapeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number; // for rect (rx/ry)
  unit?: CoordinateUnit;
}

/**
 * Result returned by all drawing tool functions.
 * On success, includes the generated element ID.
 * On failure, includes an error message.
 *
 * Canvas operation tools may also include action descriptors
 * (e.g., 'undo', 'export') and associated metadata.
 */
export interface ToolResult {
  success: boolean;
  elementId?: string;
  error?: string;
  element?: {
    id: string;
    type: string;
    props: Record<string, unknown>;
  };
  /** Multiple elements produced by executeDrawingPlan. */
  elements?: Array<{
    id: string;
    type: string;
    props: Record<string, unknown>;
  }>;
  /** Layer operation fields */
  layer?: LayerInfo;
  layerId?: string;
  layerName?: string;
  layerVisible?: boolean;
  layerZIndex?: number;
  /** Action descriptor for canvas operations (e.g., 'undo', 'export', 'clear') */
  action?:
    | 'undo'
    | 'export'
    | 'clear'
    | 'setCanvasSize'
    | 'setCanvasUnit'
    | 'createLayer'
    | 'deleteLayer'
    | 'renameLayer'
    | 'setLayerVisibility'
    | 'setLayerOrder'
    | 'moveElementToLayer';
  /** Export format (only when action is 'export') */
  format?: 'svg' | 'png';
  /** Export filename (only when action is 'export') */
  filename?: string;
  /** Canvas size update (when action is 'setCanvasSize') */
  canvasSize?: { width: number; height: number; widthMm?: number; heightMm?: number };
  /** Default unit update (when action is 'setCanvasUnit') */
  defaultUnit?: CoordinateUnit;
  /** Plan execution summary (when tool is executeDrawingPlan) */
  planResult?: {
    planId: string;
    completedSteps: number;
    totalSteps: number;
    errors?: Array<{ stepIndex: number; tool: string; error: string }>;
  };
}

/**
 * Canvas context passed to all drawing tool functions.
 * Provides canvas dimensions and current element state.
 */
export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  zIndex: number;
}

export interface CanvasContext {
  width: number;
  height: number;
  /** Canvas width in mm (design unit). */
  widthMm?: number;
  /** Canvas height in mm (design unit). */
  heightMm?: number;
  /** Default coordinate unit for bare numeric values. */
  defaultUnit?: CoordinateUnit;
  /** Layer stack for v0.2. */
  layers?: LayerInfo[];
  elements: Array<{
    id: string;
    type: string;
    x?: number;
    y?: number;
    cx?: number;
    cy?: number;
    width?: number;
    height?: number;
    r?: number;
    rx?: number;
    ry?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fontSize?: number;
    text?: string;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    x3?: number;
    y3?: number;
  }>;
  selectedId: string | null;
}

/**
 * Position for line endpoints.
 * Supports both semantic and exact coordinates.
 */
export interface LineEndpoint {
  x?: number;
  y?: number;
  unit?: CoordinateUnit;
  semantic?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right';
}
