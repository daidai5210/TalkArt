/**
 * Static bounds extraction from Three.js step JSON (same pixel coord rules as Leafer).
 */

import type { ThreeStepJSON } from './types';

export type { Bounds, StepLayoutRecord } from '../leafer-renderer/scene-bounds';
export {
  mergeBounds,
  formatBounds,
  formatCompletedSteps,
  formatPlanOverview,
  formatCanvasSpec,
  formatSceneStateBlock,
} from '../leafer-renderer/scene-bounds';

import type { Bounds } from '../leafer-renderer/scene-bounds';

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function boundsFromSize(
  tag: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Bounds {
  const centerBased =
    tag === 'Ellipse' ||
    tag === 'Circle' ||
    tag === 'Sphere' ||
    tag === 'Torus' ||
    tag === 'Ring';
  if (centerBased) {
    return {
      minX: x - width / 2,
      minY: y - height / 2,
      maxX: x + width / 2,
      maxY: y + height / 2,
    };
  }
  return {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height,
  };
}

function extractNodeBounds(node: ThreeStepJSON, offsetX = 0, offsetY = 0): Bounds | null {
  const tag = String(node.tag ?? '');
  const x = num(node.x) + offsetX;
  const y = num(node.y) + offsetY;
  const width = num(node.width);
  const height = num(node.height);
  const radius = num(node.radius);

  if (tag === 'Line') {
    const toX = num(node.toX ?? (node.to as { x?: number } | undefined)?.x, x);
    const toY = num(node.toY ?? (node.to as { y?: number } | undefined)?.y, y);
    return {
      minX: Math.min(x, toX),
      minY: Math.min(y, toY),
      maxX: Math.max(x, toX),
      maxY: Math.max(y, toY),
    };
  }

  if (tag === 'Group') {
    let merged: Bounds | null = null;
    const children = node.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        const childBounds = extractNodeBounds(child as ThreeStepJSON, x, y);
        if (childBounds) {
          merged = merged
            ? {
                minX: Math.min(merged.minX, childBounds.minX),
                minY: Math.min(merged.minY, childBounds.minY),
                maxX: Math.max(merged.maxX, childBounds.maxX),
                maxY: Math.max(merged.maxY, childBounds.maxY),
              }
            : childBounds;
        }
      }
    }
    if (width > 0 && height > 0) {
      const self = boundsFromSize('Rect', x, y, width, height);
      merged = merged
        ? {
            minX: Math.min(merged.minX, self.minX),
            minY: Math.min(merged.minY, self.minY),
            maxX: Math.max(merged.maxX, self.maxX),
            maxY: Math.max(merged.maxY, self.maxY),
          }
        : self;
    }
    return merged;
  }

  if (tag === 'Sphere' || tag === 'Circle' || tag === 'Torus' || tag === 'Ring') {
    const r = radius || Math.max(width, height) / 2 || 40;
    return boundsFromSize(tag, x, y, r * 2, r * 2);
  }

  if (width > 0 && height > 0) {
    return boundsFromSize(tag, x, y, width, height);
  }

  if (radius > 0) {
    return boundsFromSize(tag, x, y, radius * 2, radius * 2);
  }

  return null;
}

export function extractThreeJsonBounds(json: ThreeStepJSON): Bounds | null {
  return extractNodeBounds(json);
}

export function summarizeThreeJson(json: ThreeStepJSON): string {
  const tag = String(json.tag ?? 'Node');
  const x = num(json.x);
  const y = num(json.y);
  const w = num(json.width);
  const h = num(json.height);
  if (w && h) {
    const anchor =
      tag === 'Ellipse' || tag === 'Circle' || tag === 'Sphere' ? '中心' : '左上';
    return `${tag} ${anchor}(${Math.round(x)},${Math.round(y)}) ${Math.round(w)}×${Math.round(h)}`;
  }
  if (Array.isArray(json.children) && json.children.length) {
    return json.children
      .slice(0, 4)
      .map((c) => summarizeThreeJson(c as ThreeStepJSON))
      .join('; ');
  }
  return tag;
}

/** @deprecated use extractThreeJsonBounds */
export const extractLeaferJsonBounds = extractThreeJsonBounds;

/** @deprecated use summarizeThreeJson */
export const summarizeLeaferJson = summarizeThreeJson;
