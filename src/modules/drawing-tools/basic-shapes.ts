/**
 * Basic shape drawing tool functions for the TalkArt AI Agent.
 *
 * Each function:
 * - Receives semantic parameters from the LLM's Function Calling
 * - Resolves them to exact SVG coordinates using coordinate-utils
 * - Returns a ToolResult with the computed SVG element data
 *
 * These are pure functions: they compute and return results without
 * modifying the Zustand store. The caller is responsible for
 * updating the store with the returned element data.
 */

import {
  CanvasContext,
  LineEndpoint,
  SemanticPosition,
  SemanticSize,
  ShapeStyle,
  ToolResult,
} from './types';
import {
  generateId,
  parseColor,
  resolveCircleRadius,
  resolvePosition,
  resolveSize,
  resolveUnit,
  toPx,
} from './coordinate-utils';

/** Default fill color for shapes */
const DEFAULT_FILL = '#7c5cfc';

/**
 * Draw a circle on the canvas.
 *
 * The circle's position is determined by its bounding box (2r x 2r),
 * then the center point (cx, cy) is computed from the resolved top-left corner.
 *
 * @param context - Current canvas context
 * @param params - Circle parameters
 * @param params.position - Semantic or exact position (top-left of bounding box)
 * @param params.r - Optional exact radius (overrides semantic size)
 * @param params.size - Optional semantic size
 * @param params.style - Optional style properties
 * @returns ToolResult with circle element data on success
 */
export function drawCircle(
  context: CanvasContext,
  params: {
    position: SemanticPosition;
    r?: number;
    size?: SemanticSize;
    style?: ShapeStyle;
  },
): ToolResult {
  try {
    const { position, style } = params;

    const defaultUnit = context.defaultUnit ?? 'px';

    // Determine radius: explicit r > computed from semantic size > default
    let r: number;
    if (params.r !== undefined) {
      const rUnit = resolveUnit(
        (params as { unit?: typeof defaultUnit }).unit,
        defaultUnit,
      );
      r = toPx(params.r, rUnit);
    } else if (params.size) {
      const semantic = params.size.semantic || 'medium';
      r = resolveCircleRadius(semantic);
    } else {
      r = 100; // default radius
    }

    const diameter = r * 2;

    // Resolve position based on the circle's bounding box
    const pos = resolvePosition(
      position,
      context.width,
      context.height,
      diameter,
      diameter,
      defaultUnit,
    );

    // Compute center from top-left of bounding box
    const cx = pos.x + r;
    const cy = pos.y + r;

    const id = generateId('circle');

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'circle',
        props: {
          cx,
          cy,
          r,
          fill: parseColor(style?.fill || DEFAULT_FILL),
          stroke: style?.stroke || 'none',
          strokeWidth: style?.strokeWidth || 0,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to draw circle: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Draw a rectangle on the canvas.
 *
 * @param context - Current canvas context
 * @param params - Rectangle parameters
 * @param params.position - Semantic or exact position (top-left corner)
 * @param params.size - Semantic or exact size
 * @param params.style - Optional style properties
 * @returns ToolResult with rect element data on success
 */
export function drawRect(
  context: CanvasContext,
  params: {
    position: SemanticPosition;
    size: SemanticSize;
    style?: ShapeStyle;
  },
): ToolResult {
  try {
    const { position, size, style } = params;
    const defaultUnit = context.defaultUnit ?? 'px';

    // Resolve size
    const resolvedSize = resolveSize(size, context.width, context.height, defaultUnit);

    // Resolve position
    const pos = resolvePosition(
      position,
      context.width,
      context.height,
      resolvedSize.width,
      resolvedSize.height,
      defaultUnit,
    );

    const id = generateId('rect');

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'rect',
        props: {
          x: pos.x,
          y: pos.y,
          width: resolvedSize.width,
          height: resolvedSize.height,
          fill: parseColor(style?.fill || DEFAULT_FILL),
          stroke: style?.stroke || 'none',
          strokeWidth: style?.strokeWidth || 0,
          rx: style?.cornerRadius
            ? toPx(style.cornerRadius, resolveUnit(style.unit, defaultUnit))
            : 0,
          ry: style?.cornerRadius
            ? toPx(style.cornerRadius, resolveUnit(style.unit, defaultUnit))
            : 0,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to draw rect: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Draw an ellipse on the canvas.
 *
 * The ellipse's position is determined by its bounding box (2*rx x 2*ry),
 * then the center point (cx, cy) is computed from the resolved top-left corner.
 *
 * @param context - Current canvas context
 * @param params - Ellipse parameters
 * @param params.position - Semantic or exact position (top-left of bounding box)
 * @param params.rx - Optional horizontal radius
 * @param params.ry - Optional vertical radius
 * @param params.size - Optional semantic size (used when rx/ry not specified)
 * @param params.style - Optional style properties
 * @returns ToolResult with ellipse element data on success
 */
export function drawEllipse(
  context: CanvasContext,
  params: {
    position: SemanticPosition;
    rx?: number;
    ry?: number;
    size?: SemanticSize;
    style?: ShapeStyle;
  },
): ToolResult {
  try {
    const { position, style } = params;
    const defaultUnit = context.defaultUnit ?? 'px';

    // Determine radii: explicit rx/ry > computed from semantic size > defaults
    let rx: number;
    let ry: number;

    if (params.rx !== undefined && params.ry !== undefined) {
      const unit = resolveUnit(
        (params as { unit?: typeof defaultUnit }).unit,
        defaultUnit,
      );
      rx = toPx(params.rx, unit);
      ry = toPx(params.ry, unit);
    } else if (params.size) {
      const resolvedSize = resolveSize(params.size, context.width, context.height, defaultUnit);
      rx = resolvedSize.width / 2;
      ry = resolvedSize.height / 2;
    } else {
      rx = 120; // default
      ry = 80;
    }

    const boundingWidth = rx * 2;
    const boundingHeight = ry * 2;

    // Resolve position based on the ellipse's bounding box
    const pos = resolvePosition(
      position,
      context.width,
      context.height,
      boundingWidth,
      boundingHeight,
      defaultUnit,
    );

    // Compute center from top-left of bounding box
    const cx = pos.x + rx;
    const cy = pos.y + ry;

    const id = generateId('ellipse');

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'ellipse',
        props: {
          cx,
          cy,
          rx,
          ry,
          fill: parseColor(style?.fill || DEFAULT_FILL),
          stroke: style?.stroke || 'none',
          strokeWidth: style?.strokeWidth || 0,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to draw ellipse: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Draw a line on the canvas.
 *
 * Supports semantic endpoints (e.g., "left" → "right" for a horizontal line
 * across the center) as well as exact coordinates.
 *
 * @param context - Current canvas context
 * @param params - Line parameters
 * @param params.start - Start endpoint (semantic or exact)
 * @param params.end - End endpoint (semantic or exact)
 * @param params.stroke - Stroke color
 * @param params.strokeWidth - Stroke width in pixels
 * @returns ToolResult with line element data on success
 */
export function drawLine(
  context: CanvasContext,
  params: {
    start: LineEndpoint;
    end: LineEndpoint;
    stroke?: string;
    strokeWidth?: number;
  },
): ToolResult {
  try {
    const { start, end } = params;
    const defaultUnit = context.defaultUnit ?? 'px';

    // Default start/end if not provided
    const startSemantic = start.semantic || 'left';
    const endSemantic = end.semantic || 'right';

    // Resolve start point
    let x1: number;
    let y1: number;

    if (start.x !== undefined && start.y !== undefined) {
      const unit = resolveUnit(start.unit, defaultUnit);
      x1 = toPx(start.x, unit);
      y1 = toPx(start.y, unit);
    } else {
      // Lines are point-based, so use a 1x1 bounding box for position resolution
      const startPos = resolvePosition(
        { semantic: startSemantic as SemanticPosition['semantic'] },
        context.width,
        context.height,
        1,
        1,
      );
      x1 = startPos.x;
      y1 = startPos.y;
    }

    // Resolve end point
    let x2: number;
    let y2: number;

    if (end.x !== undefined && end.y !== undefined) {
      const unit = resolveUnit(end.unit, defaultUnit);
      x2 = toPx(end.x, unit);
      y2 = toPx(end.y, unit);
    } else {
      const endPos = resolvePosition(
        { semantic: endSemantic as SemanticPosition['semantic'] },
        context.width,
        context.height,
        1,
        1,
      );
      x2 = endPos.x;
      y2 = endPos.y;
    }

    const id = generateId('line');

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'line',
        props: {
          x1,
          y1,
          x2,
          y2,
          stroke: parseColor(params.stroke || '#ffffff'),
          strokeWidth: params.strokeWidth || 2,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to draw line: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Draw text on the canvas.
 *
 * @param context - Current canvas context
 * @param params - Text parameters
 * @param params.position - Semantic or exact position
 * @param params.text - The text content to display
 * @param params.fontSize - Font size in pixels
 * @param params.fontFamily - Font family string
 * @param params.fill - Text fill color
 * @returns ToolResult with text element data on success
 */
export function drawText(
  context: CanvasContext,
  params: {
    position: SemanticPosition;
    text: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
  },
): ToolResult {
  try {
    const { position, text } = params;
    const defaultUnit = context.defaultUnit ?? 'px';

    if (!text) {
      return {
        success: false,
        error: 'Text content is required',
      };
    }

    const fontSize = params.fontSize || 24;
    const fontFamily = params.fontFamily || 'sans-serif';
    const fill = parseColor(params.fill || '#ffffff');

    // Estimate text bounding box for position resolution
    // Rough estimate: width ≈ text.length * fontSize * 0.6, height ≈ fontSize * 1.2
    const estimatedWidth = text.length * fontSize * 0.6;
    const estimatedHeight = fontSize * 1.2;

    const pos = resolvePosition(
      position,
      context.width,
      context.height,
      estimatedWidth,
      estimatedHeight,
      defaultUnit,
    );

    const id = generateId('text');

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'text',
        props: {
          x: pos.x,
          y: pos.y + fontSize, // SVG text y is baseline, offset from top
          text,
          fontSize,
          fontFamily,
          fill,
          textAnchor: 'start',
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to draw text: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Draw an equilateral triangle on the canvas.
 *
 * The triangle is defined by its bounding box (from position and size),
 * with vertices at the top-center, bottom-left, and bottom-right of the box.
 *
 * @param context - Current canvas context
 * @param params - Triangle parameters
 * @param params.position - Semantic or exact position (top-left of bounding box)
 * @param params.size - Optional semantic or exact size
 * @param params.style - Optional style properties
 * @returns ToolResult with triangle element data on success
 */
export function drawTriangle(
  context: CanvasContext,
  params: {
    position: SemanticPosition;
    size?: SemanticSize;
    style?: ShapeStyle;
  },
): ToolResult {
  try {
    const { position, style } = params;
    const defaultUnit = context.defaultUnit ?? 'px';

    // Resolve size (default to medium)
    const size = params.size || { semantic: 'medium' };
    const resolvedSize = resolveSize(size, context.width, context.height, defaultUnit);

    // Resolve position
    const pos = resolvePosition(
      position,
      context.width,
      context.height,
      resolvedSize.width,
      resolvedSize.height,
      defaultUnit,
    );

    // Compute equilateral triangle vertices from bounding box
    const x1 = pos.x + resolvedSize.width / 2; // top-center
    const y1 = pos.y;
    const x2 = pos.x;                          // bottom-left
    const y2 = pos.y + resolvedSize.height;
    const x3 = pos.x + resolvedSize.width;     // bottom-right
    const y3 = pos.y + resolvedSize.height;

    const id = generateId('triangle');

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'triangle',
        props: {
          x1,
          y1,
          x2,
          y2,
          x3,
          y3,
          fill: parseColor(style?.fill || DEFAULT_FILL),
          stroke: style?.stroke || 'none',
          strokeWidth: style?.strokeWidth || 0,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to draw triangle: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
