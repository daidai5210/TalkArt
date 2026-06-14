import type { Bounds } from '../leafer-renderer/scene-bounds';
import type { SketchMark, SketchPoint } from './sketch-types';

function mergeBounds(a: Bounds, b: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function pointBounds(points: SketchPoint[], pad = 0): Bounds | null {
  if (points.length === 0) return null;
  let minX = points[0][0];
  let minY = points[0][1];
  let maxX = points[0][0];
  let maxY = points[0][1];
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

function extractOneBounds(mark: SketchMark): Bounds | null {
  const pad = 'width' in mark ? (mark.width ?? 3) / 2 : 0;
  switch (mark.kind) {
    case 'line':
      return pointBounds([mark.from, mark.to], pad);
    case 'polyline':
    case 'curve':
    case 'polygon':
      return pointBounds(mark.points, pad);
    case 'ellipse':
      return {
        minX: mark.center[0] - mark.rx - pad,
        minY: mark.center[1] - mark.ry - pad,
        maxX: mark.center[0] + mark.rx + pad,
        maxY: mark.center[1] + mark.ry + pad,
      };
    case 'dot':
      return {
        minX: mark.center[0] - mark.r,
        minY: mark.center[1] - mark.r,
        maxX: mark.center[0] + mark.r,
        maxY: mark.center[1] + mark.r,
      };
    default:
      return null;
  }
}

export function extractSketchBounds(marks: SketchMark[]): Bounds | null {
  let merged: Bounds | null = null;
  for (const mark of marks) {
    const bounds = extractOneBounds(mark);
    if (bounds) merged = merged ? mergeBounds(merged, bounds) : bounds;
  }
  return merged;
}

export function summarizeSketchMark(mark: SketchMark): string {
  switch (mark.kind) {
    case 'line':
      return `线 (${Math.round(mark.from[0])},${Math.round(mark.from[1])})→(${Math.round(mark.to[0])},${Math.round(mark.to[1])})`;
    case 'polyline':
      return `折线 ${mark.points.length}点`;
    case 'curve':
      return `曲线 ${mark.points.length}点`;
    case 'ellipse':
      return `椭圆 中心(${Math.round(mark.center[0])},${Math.round(mark.center[1])}) ${Math.round(mark.rx * 2)}×${Math.round(mark.ry * 2)}`;
    case 'polygon':
      return `多边形 ${mark.points.length}点`;
    case 'dot':
      return `点 (${Math.round(mark.center[0])},${Math.round(mark.center[1])}) r=${Math.round(mark.r)}`;
    default:
      return '笔画';
  }
}

export function summarizeSketchMarks(marks: SketchMark[]): string {
  return marks.slice(0, 5).map(summarizeSketchMark).join('; ');
}
