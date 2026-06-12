/**
 * @module drawing-tools/v2/path-tools
 * Phase 3: path drawing tools (drawPath, drawPolyline, drawPolygon).
 */

import { generateId, parseColor, resolveUnit, toPx } from '../coordinate-utils';
import type { CanvasContext, CoordinateUnit, ToolResult } from '../types';

export interface PathPoint {
  x: number;
  y: number;
  unit?: CoordinateUnit;
}

function resolvePoints(
  points: PathPoint[],
  defaultUnit: CoordinateUnit,
): Array<{ x: number; y: number }> {
  return points.map((p) => {
    const unit = resolveUnit(p.unit, defaultUnit);
    return { x: toPx(p.x, unit), y: toPx(p.y, unit) };
  });
}

function pointsToPolylineString(points: Array<{ x: number; y: number }>): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

/**
 * Draw an SVG path from a d attribute string.
 */
export function drawPath(
  context: CanvasContext,
  params: {
    d: string;
    layerId?: string;
    style?: { fill?: string; stroke?: string; strokeWidth?: number };
  },
): ToolResult {
  try {
    if (!params.d) {
      return { success: false, error: 'path d 属性不能为空' };
    }

    const id = generateId('path');
    const style = params.style ?? {};

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'path',
        props: {
          d: params.d,
          fill: style.fill ? parseColor(style.fill) : 'none',
          stroke: style.stroke ? parseColor(style.stroke) : '#333333',
          strokeWidth: style.strokeWidth ?? 2,
          layerId: params.layerId ?? 'layer-default',
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `绘制路径失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Draw a polyline from a list of points.
 */
export function drawPolyline(
  context: CanvasContext,
  params: {
    points: PathPoint[];
    layerId?: string;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
  },
): ToolResult {
  try {
    if (!params.points || params.points.length < 2) {
      return { success: false, error: '折线至少需要 2 个点' };
    }

    const defaultUnit = context.defaultUnit ?? 'px';
    const resolved = resolvePoints(params.points, defaultUnit);
    const id = generateId('polyline');

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'polyline',
        props: {
          points: pointsToPolylineString(resolved),
          fill: params.fill ? parseColor(params.fill) : 'none',
          stroke: parseColor(params.stroke ?? '#333333'),
          strokeWidth: params.strokeWidth ?? 2,
          layerId: params.layerId ?? 'layer-default',
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `绘制折线失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Draw a closed polygon from a list of points.
 */
export function drawPolygon(
  context: CanvasContext,
  params: {
    points: PathPoint[];
    layerId?: string;
    style?: { fill?: string; stroke?: string; strokeWidth?: number };
  },
): ToolResult {
  try {
    if (!params.points || params.points.length < 3) {
      return { success: false, error: '多边形至少需要 3 个点' };
    }

    const defaultUnit = context.defaultUnit ?? 'px';
    const resolved = resolvePoints(params.points, defaultUnit);
    const id = generateId('polygon');
    const style = params.style ?? {};

    return {
      success: true,
      elementId: id,
      element: {
        id,
        type: 'polygon',
        props: {
          points: pointsToPolylineString(resolved),
          fill: parseColor(style.fill ?? '#7c5cfc'),
          stroke: style.stroke ? parseColor(style.stroke) : 'none',
          strokeWidth: style.strokeWidth ?? 0,
          layerId: params.layerId ?? 'layer-default',
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `绘制多边形失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
