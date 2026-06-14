/**
 * Code-side spatial alignment for primitive arrays (same snap logic as Leafer aligner).
 */

import type { LayoutTarget } from '../leafer-renderer/step-layout-aligner';
import type { Bounds } from '../leafer-renderer/scene-bounds';
import { extractPrimitiveBounds } from './primitive-bounds';
import type { ThreePrimitive } from './primitive-types';

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

function translatePrimitive(p: ThreePrimitive, dx: number, dy: number): ThreePrimitive {
  const out: ThreePrimitive = { ...p, x: p.x + dx, y: p.y + dy };
  if (p.toX != null) out.toX = p.toX + dx;
  if (p.toY != null) out.toY = p.toY + dy;
  return out;
}

function scalePrimitiveAround(
  p: ThreePrimitive,
  originX: number,
  originY: number,
  scaleX: number,
  scaleY: number,
): ThreePrimitive {
  const sc = (v: number, o: number, s: number) => o + (v - o) * s;
  const out: ThreePrimitive = {
    ...p,
    x: sc(p.x, originX, scaleX),
    y: sc(p.y, originY, scaleY),
  };
  if (p.toX != null) out.toX = sc(p.toX, originX, scaleX);
  if (p.toY != null) out.toY = sc(p.toY, originY, scaleY);
  if (p.width != null) out.width = p.width * scaleX;
  if (p.height != null) out.height = p.height * scaleY;
  if (p.depth != null) out.depth = p.depth * Math.max(scaleX, scaleY);
  if (p.radius != null) out.radius = p.radius * Math.max(scaleX, scaleY);
  if (p.tube != null) out.tube = p.tube * Math.max(scaleX, scaleY);
  if (p.innerRadius != null) out.innerRadius = p.innerRadius * Math.max(scaleX, scaleY);
  if (p.outerRadius != null) out.outerRadius = p.outerRadius * Math.max(scaleX, scaleY);
  if (p.radiusTop != null) out.radiusTop = p.radiusTop * Math.max(scaleX, scaleY);
  if (p.radiusBottom != null) out.radiusBottom = p.radiusBottom * Math.max(scaleX, scaleY);
  return out;
}

export function alignPrimitivesToLayout(
  primitives: ThreePrimitive[],
  target: LayoutTarget,
): ThreePrimitive[] {
  const initialBounds = extractPrimitiveBounds(primitives);
  if (!initialBounds) return primitives;

  const icx = (initialBounds.minX + initialBounds.maxX) / 2;
  const icy = (initialBounds.minY + initialBounds.maxY) / 2;
  const bw = initialBounds.maxX - initialBounds.minX;
  const bh = initialBounds.maxY - initialBounds.minY;

  let aligned = primitives;

  if (target.width && target.height && bw > 1 && bh > 1) {
    const scaleX = target.width / bw;
    const scaleY = target.height / bh;
    const shouldScale =
      (target.width >= 48 && target.height >= 48) ||
      bw > target.width * 1.8 ||
      bh > target.height * 1.8;
    if (shouldScale) {
      aligned = aligned.map((p) => scalePrimitiveAround(p, icx, icy, scaleX, scaleY));
    }
  }

  const bounds = extractPrimitiveBounds(aligned);
  if (!bounds) return aligned;

  const { dx, dy } = snapDelta(bounds, target);
  return aligned.map((p) => translatePrimitive(p, dx, dy));
}
