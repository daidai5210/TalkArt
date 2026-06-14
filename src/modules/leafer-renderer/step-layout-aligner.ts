/**
 * Align LLM-produced Leafer JSON to planned step layout (code-side coordinate enforcement).
 */

import type { LeaferStepJSON } from './types';
import type { StepLayoutRecord } from './scene-bounds';
import { extractLeaferJsonBounds } from './scene-bounds';

export interface StepLayoutSpec {
  centerX?: number;
  centerY?: number;
  width?: number;
  height?: number;
  /** Attach to a previous step index (0-based). */
  attachTo?: number;
  attachEdge?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offsetX?: number;
  offsetY?: number;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function translateNode(node: LeaferStepJSON, dx: number, dy: number): LeaferStepJSON {
  const out: LeaferStepJSON = { ...node };
  if ('x' in out && typeof out.x === 'number') out.x = out.x + dx;
  if ('y' in out && typeof out.y === 'number') out.y = out.y + dy;

  if (typeof out.toX === 'number') out.toX = out.toX + dx;
  if (typeof out.toY === 'number') out.toY = out.toY + dy;

  const to = out.to as { x?: number; y?: number } | undefined;
  if (to && typeof to === 'object') {
    out.to = {
      ...to,
      ...(typeof to.x === 'number' ? { x: to.x + dx } : {}),
      ...(typeof to.y === 'number' ? { y: to.y + dy } : {}),
    };
  }

  if (Array.isArray(out.children)) {
    out.children = out.children.map((c) => translateNode(c as LeaferStepJSON, dx, dy));
  }
  return out;
}

function scaleNodeAround(
  node: LeaferStepJSON,
  originX: number,
  originY: number,
  scaleX: number,
  scaleY: number,
): LeaferStepJSON {
  const scaleCoord = (v: number, origin: number, scale: number) =>
    origin + (v - origin) * scale;

  const out: LeaferStepJSON = { ...node };
  if (typeof out.x === 'number') out.x = scaleCoord(out.x, originX, scaleX);
  if (typeof out.y === 'number') out.y = scaleCoord(out.y, originY, scaleY);
  if (typeof out.width === 'number') out.width = out.width * scaleX;
  if (typeof out.height === 'number') out.height = out.height * scaleY;

  if (typeof out.toX === 'number') out.toX = scaleCoord(out.toX, originX, scaleX);
  if (typeof out.toY === 'number') out.toY = scaleCoord(out.toY, originY, scaleY);

  const to = out.to as { x?: number; y?: number } | undefined;
  if (to && typeof to === 'object') {
    out.to = {
      ...to,
      ...(typeof to.x === 'number' ? { x: scaleCoord(to.x, originX, scaleX) } : {}),
      ...(typeof to.y === 'number' ? { y: scaleCoord(to.y, originY, scaleY) } : {}),
    };
  }

  if (Array.isArray(out.children)) {
    out.children = out.children.map((c) =>
      scaleNodeAround(c as LeaferStepJSON, originX, originY, scaleX, scaleY),
    );
  }
  return out;
}

export function resolveStepLayoutTarget(
  spec: StepLayoutSpec | undefined,
  completed: StepLayoutRecord[],
): { centerX: number; centerY: number; width?: number; height?: number } | null {
  if (!spec) return null;

  const ox = num(spec.offsetX);
  const oy = num(spec.offsetY);

  if (spec.centerX != null && spec.centerY != null) {
    return {
      centerX: spec.centerX + ox,
      centerY: spec.centerY + oy,
      width: spec.width,
      height: spec.height,
    };
  }

  if (spec.attachTo == null) return null;
  const ref = completed.find((s) => s.stepIndex === spec.attachTo);
  if (!ref) return null;

  const b = ref.bounds;
  const rcx = (b.minX + b.maxX) / 2;
  const rcy = (b.minY + b.maxY) / 2;
  const edge = spec.attachEdge ?? 'center';

  let centerX = rcx;
  let centerY = rcy;
  switch (edge) {
    case 'top':
      centerX = rcx;
      centerY = b.minY;
      break;
    case 'bottom':
      centerX = rcx;
      centerY = b.maxY;
      break;
    case 'left':
      centerX = b.minX;
      centerY = rcy;
      break;
    case 'right':
      centerX = b.maxX;
      centerY = rcy;
      break;
    default:
      break;
  }

  return {
    centerX: centerX + ox,
    centerY: centerY + oy,
    width: spec.width,
    height: spec.height,
  };
}

export function alignStepJsonToLayout(
  json: LeaferStepJSON,
  target: { centerX: number; centerY: number; width?: number; height?: number },
): LeaferStepJSON {
  const bounds = extractLeaferJsonBounds(json);
  if (!bounds) return json;

  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const dx = target.centerX - cx;
  const dy = target.centerY - cy;

  let aligned = translateNode(json, dx, dy);

  const bw = bounds.maxX - bounds.minX;
  const bh = bounds.maxY - bounds.minY;
  if (target.width && target.height && bw > 4 && bh > 4) {
    const scaleX = target.width / bw;
    const scaleY = target.height / bh;
    const needsScale =
      Math.abs(scaleX - 1) > 0.25 ||
      Math.abs(scaleY - 1) > 0.25 ||
      Math.max(bw, bh) > Math.max(target.width, target.height) * 2;
    if (needsScale) {
      const uniform = Math.min(scaleX, scaleY);
      aligned = scaleNodeAround(aligned, target.centerX, target.centerY, uniform, uniform);
    }
  }

  return aligned;
}

export function parseStepLayoutSpec(raw: unknown): StepLayoutSpec | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const spec: StepLayoutSpec = {};
  if (typeof o.centerX === 'number') spec.centerX = o.centerX;
  if (typeof o.centerY === 'number') spec.centerY = o.centerY;
  if (typeof o.width === 'number') spec.width = o.width;
  if (typeof o.height === 'number') spec.height = o.height;
  if (typeof o.attachTo === 'number') spec.attachTo = o.attachTo;
  if (typeof o.attachEdge === 'string') spec.attachEdge = o.attachEdge as StepLayoutSpec['attachEdge'];
  if (typeof o.offsetX === 'number') spec.offsetX = o.offsetX;
  if (typeof o.offsetY === 'number') spec.offsetY = o.offsetY;
  return Object.keys(spec).length ? spec : undefined;
}
