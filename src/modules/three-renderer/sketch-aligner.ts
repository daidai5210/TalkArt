import type { LayoutTarget } from '../leafer-renderer/step-layout-aligner';
import type { Bounds } from '../leafer-renderer/scene-bounds';
import type { SketchMark, SketchPoint } from './sketch-types';
import { extractSketchBounds } from './sketch-bounds';

function snapDelta(bounds: Bounds, target: LayoutTarget): { dx: number; dy: number } {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;

  switch (target.snapEdge) {
    case 'top':
      return { dx: target.anchorX - cx, dy: target.anchorY - bounds.minY };
    case 'bottom':
      return { dx: target.anchorX - cx, dy: target.anchorY - bounds.maxY };
    case 'left':
      return { dx: target.anchorX - bounds.minX, dy: target.anchorY - cy };
    case 'right':
      return { dx: target.anchorX - bounds.maxX, dy: target.anchorY - cy };
    default:
      return { dx: target.anchorX - cx, dy: target.anchorY - cy };
  }
}

function translatePoint([x, y]: SketchPoint, dx: number, dy: number): SketchPoint {
  return [x + dx, y + dy];
}

function scalePoint([x, y]: SketchPoint, ox: number, oy: number, sx: number, sy: number): SketchPoint {
  return [ox + (x - ox) * sx, oy + (y - oy) * sy];
}

function translateMark(mark: SketchMark, dx: number, dy: number): SketchMark {
  switch (mark.kind) {
    case 'line':
      return { ...mark, from: translatePoint(mark.from, dx, dy), to: translatePoint(mark.to, dx, dy) };
    case 'polyline':
    case 'curve':
    case 'polygon':
      return { ...mark, points: mark.points.map((p) => translatePoint(p, dx, dy)) };
    case 'ellipse':
      return { ...mark, center: translatePoint(mark.center, dx, dy) };
    case 'dot':
      return { ...mark, center: translatePoint(mark.center, dx, dy) };
    default:
      return mark;
  }
}

function scaleMark(mark: SketchMark, ox: number, oy: number, sx: number, sy: number): SketchMark {
  const s = Math.max(Math.abs(sx), Math.abs(sy));
  switch (mark.kind) {
    case 'line':
      return { ...mark, from: scalePoint(mark.from, ox, oy, sx, sy), to: scalePoint(mark.to, ox, oy, sx, sy), width: mark.width != null ? mark.width * s : undefined };
    case 'polyline':
    case 'curve':
    case 'polygon':
      return { ...mark, points: mark.points.map((p) => scalePoint(p, ox, oy, sx, sy)), width: mark.width != null ? mark.width * s : undefined };
    case 'ellipse':
      return { ...mark, center: scalePoint(mark.center, ox, oy, sx, sy), rx: mark.rx * Math.abs(sx), ry: mark.ry * Math.abs(sy), width: mark.width != null ? mark.width * s : undefined };
    case 'dot':
      return { ...mark, center: scalePoint(mark.center, ox, oy, sx, sy), r: mark.r * s };
    default:
      return mark;
  }
}

export function alignSketchMarksToLayout(marks: SketchMark[], target: LayoutTarget): SketchMark[] {
  const initialBounds = extractSketchBounds(marks);
  if (!initialBounds) return marks;

  const icx = (initialBounds.minX + initialBounds.maxX) / 2;
  const icy = (initialBounds.minY + initialBounds.maxY) / 2;
  const bw = initialBounds.maxX - initialBounds.minX;
  const bh = initialBounds.maxY - initialBounds.minY;

  let aligned = marks;
  if (target.width && target.height && bw > 1 && bh > 1) {
    const sx = target.width / bw;
    const sy = target.height / bh;
    const shouldScale =
      (target.width >= 32 && target.height >= 32) ||
      bw > target.width * 1.8 ||
      bh > target.height * 1.8;
    if (shouldScale) aligned = aligned.map((m) => scaleMark(m, icx, icy, sx, sy));
  }

  const bounds = extractSketchBounds(aligned);
  if (!bounds) return aligned;

  const { dx, dy } = snapDelta(bounds, target);
  return aligned.map((m) => translateMark(m, dx, dy));
}
