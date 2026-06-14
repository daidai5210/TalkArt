/**
 * Bounds extraction and summary for Three.js primitives.
 */

import { getGeometryDef } from './geometry-catalog';
import type { Bounds } from '../leafer-renderer/scene-bounds';
import type { ThreePrimitive } from './primitive-types';

function boundsFromSize(
  anchor: 'center' | 'topLeft' | 'top',
  x: number,
  y: number,
  width: number,
  height: number,
): Bounds {
  if (anchor === 'center') {
    return {
      minX: x - width / 2,
      minY: y - height / 2,
      maxX: x + width / 2,
      maxY: y + height / 2,
    };
  }
  if (anchor === 'top') {
    return { minX: x - width / 2, minY: y, maxX: x + width / 2, maxY: y + height };
  }
  return { minX: x, minY: y, maxX: x + width, maxY: y + height };
}

function mergeBounds(a: Bounds, b: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function extractOneBounds(p: ThreePrimitive): Bounds | null {
  const def = getGeometryDef(p.kind);
  if (!def) return null;

  if (p.kind === 'line') {
    const toX = p.toX ?? p.x;
    const toY = p.toY ?? p.y;
    return {
      minX: Math.min(p.x, toX),
      minY: Math.min(p.y, toY),
      maxX: Math.max(p.x, toX),
      maxY: Math.max(p.y, toY),
    };
  }

  const w = p.width ?? (p.radius != null ? p.radius * 2 : 0);
  const h = p.height ?? (p.radius != null ? p.radius * 2 : w);

  if (p.kind === 'sphere' || p.kind === 'torus') {
    const r = p.radius ?? 40;
    return boundsFromSize('center', p.x, p.y, r * 2, r * 2);
  }

  if (p.kind === 'ring') {
    const outer = p.outerRadius ?? p.radius ?? 40;
    return boundsFromSize('center', p.x, p.y, outer * 2, outer * 2);
  }

  if (p.kind === 'cylinder' || p.kind === 'cone') {
    const r = p.radius ?? 30;
    const ht = p.height ?? 60;
    return boundsFromSize('top', p.x, p.y, r * 2, ht);
  }

  if (p.kind === 'box') {
    return boundsFromSize('topLeft', p.x, p.y, w || 80, h || 80);
  }

  if (w > 0 && h > 0) {
    return boundsFromSize(def.anchor, p.x, p.y, w, h);
  }

  if (p.radius != null && p.radius > 0) {
    return boundsFromSize(def.anchor, p.x, p.y, p.radius * 2, p.radius * 2);
  }

  return null;
}

export function extractPrimitiveBounds(primitives: ThreePrimitive[]): Bounds | null {
  let merged: Bounds | null = null;
  for (const p of primitives) {
    const b = extractOneBounds(p);
    if (b) merged = merged ? mergeBounds(merged, b) : b;
  }
  return merged;
}

export function summarizePrimitive(p: ThreePrimitive): string {
  const def = getGeometryDef(p.kind);
  const label = def?.label ?? p.kind;
  if (p.kind === 'line') {
    return `${label} (${Math.round(p.x)},${Math.round(p.y)})→(${Math.round(p.toX ?? p.x)},${Math.round(p.toY ?? p.y)})`;
  }
  if (p.radius != null && p.width == null) {
    return `${label} 中心(${Math.round(p.x)},${Math.round(p.y)}) r=${Math.round(p.radius)}`;
  }
  if (p.width != null && p.height != null) {
    const anchor = def?.anchor === 'center' ? '中心' : '左上';
    return `${label} ${anchor}(${Math.round(p.x)},${Math.round(p.y)}) ${Math.round(p.width)}×${Math.round(p.height)}`;
  }
  return `${label} (${Math.round(p.x)},${Math.round(p.y)})`;
}

export function summarizePrimitives(primitives: ThreePrimitive[]): string {
  return primitives
    .slice(0, 5)
    .map(summarizePrimitive)
    .join('; ');
}
