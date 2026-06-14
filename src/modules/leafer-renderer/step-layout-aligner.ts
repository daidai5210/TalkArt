/**
 * Align LLM-produced Leafer JSON to planned step layout (code-side coordinate enforcement).
 * Uses edge snapping so parts connect (head on body, legs under body, tail on side).
 */

import type { LeaferStepJSON } from './types';
import type { Bounds, StepLayoutRecord } from './scene-bounds';
import { extractLeaferJsonBounds } from './scene-bounds';

export interface StepLayoutSpec {
  centerX?: number;
  centerY?: number;
  width?: number;
  height?: number;
  attachTo?: number;
  attachEdge?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offsetX?: number;
  offsetY?: number;
}

/** Where a step's bbox should snap on the canvas. */
export interface LayoutTarget {
  anchorX: number;
  anchorY: number;
  /** Which edge of THIS step's bbox aligns to the anchor point. */
  snapEdge: 'top' | 'bottom' | 'left' | 'right' | 'center';
  width?: number;
  height?: number;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

const PARENT_TO_CHILD_SNAP: Record<
  NonNullable<StepLayoutSpec['attachEdge']>,
  LayoutTarget['snapEdge']
> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
  center: 'center',
};

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

export function resolveStepLayoutTarget(
  spec: StepLayoutSpec | undefined,
  completed: StepLayoutRecord[],
): LayoutTarget | null {
  if (!spec) return null;

  const ox = num(spec.offsetX);
  const oy = num(spec.offsetY);

  if (spec.centerX != null && spec.centerY != null) {
    return {
      anchorX: spec.centerX + ox,
      anchorY: spec.centerY + oy,
      snapEdge: 'center',
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

  let anchorX = rcx;
  let anchorY = rcy;
  switch (edge) {
    case 'top':
      anchorX = rcx;
      anchorY = b.minY;
      break;
    case 'bottom':
      anchorX = rcx;
      anchorY = b.maxY;
      break;
    case 'left':
      anchorX = b.minX;
      anchorY = rcy;
      break;
    case 'right':
      anchorX = b.maxX;
      anchorY = rcy;
      break;
    default:
      break;
  }

  return {
    anchorX: anchorX + ox,
    anchorY: anchorY + oy,
    snapEdge: PARENT_TO_CHILD_SNAP[edge],
    width: spec.width,
    height: spec.height,
  };
}

export function alignStepJsonToLayout(json: LeaferStepJSON, target: LayoutTarget): LeaferStepJSON {
  const initialBounds = extractLeaferJsonBounds(json);
  if (!initialBounds) return json;

  let aligned = json;
  const icx = (initialBounds.minX + initialBounds.maxX) / 2;
  const icy = (initialBounds.minY + initialBounds.maxY) / 2;
  const bw = initialBounds.maxX - initialBounds.minX;
  const bh = initialBounds.maxY - initialBounds.minY;

  if (target.width && target.height && bw > 1 && bh > 1) {
    const scaleX = target.width / bw;
    const scaleY = target.height / bh;
    const shouldScale =
      (target.width >= 48 && target.height >= 48) ||
      bw > target.width * 1.8 ||
      bh > target.height * 1.8;
    if (shouldScale) {
      aligned = scaleNodeAround(aligned, icx, icy, scaleX, scaleY);
    }
  }

  const bounds = extractLeaferJsonBounds(aligned);
  if (!bounds) return aligned;

  const { dx, dy } = snapDelta(bounds, target);
  return translateNode(aligned, dx, dy);
}

/** @deprecated Use LayoutTarget — kept for tests migrating from center-only API */
export function alignStepJsonToCenter(
  json: LeaferStepJSON,
  centerX: number,
  centerY: number,
  size?: { width?: number; height?: number },
): LeaferStepJSON {
  return alignStepJsonToLayout(json, {
    anchorX: centerX,
    anchorY: centerY,
    snapEdge: 'center',
    width: size?.width,
    height: size?.height,
  });
}

export function describeLayoutTargetForPrompt(target: LayoutTarget): string {
  const snapLabel: Record<LayoutTarget['snapEdge'], string> = {
    top: '上边缘',
    bottom: '下边缘',
    left: '左边缘',
    right: '右边缘',
    center: '中心',
  };
  const ax = Math.round(target.anchorX);
  const ay = Math.round(target.anchorY);
  const size =
    target.width && target.height
      ? `，目标尺寸约 ${Math.round(target.width)}×${Math.round(target.height)}px`
      : '';
  return `系统将把本步图形${snapLabel[target.snapEdge]}对齐到锚点 (${ax}, ${ay})${size}。请在此附近绘制，不要偏离超过 30px。`;
}

export function formatAttachReference(
  layout: StepLayoutSpec | undefined,
  completed: StepLayoutRecord[],
): string {
  if (layout?.attachTo == null) return '';
  const ref = completed.find((s) => s.stepIndex === layout.attachTo);
  if (!ref) return '';
  const b = ref.bounds;
  return `本步依附步骤${ref.stepIndex + 1}「${ref.label}」的实际位置：包围盒(${Math.round(b.minX)},${Math.round(b.minY)})-(${Math.round(b.maxX)},${Math.round(b.maxY)})，attachEdge=${layout.attachEdge ?? 'center'} offset=(${layout.offsetX ?? 0},${layout.offsetY ?? 0})`;
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
