/**
 * Two-phase pipeline: LLM designs component in local coords → code assembles on canvas plane.
 */

import type { LayoutTarget } from '../leafer-renderer/step-layout-aligner';
import { alignPrimitivesToLayout } from './primitive-aligner';
import { extractPrimitiveBounds } from './primitive-bounds';
import type { ThreePrimitive } from './primitive-types';
import { layerToZ, type SceneLayer } from './scene-composition';

function translatePrimitive(p: ThreePrimitive, dx: number, dy: number): ThreePrimitive {
  const out: ThreePrimitive = { ...p, x: p.x + dx, y: p.y + dy };
  if (p.toX != null) out.toX = p.toX + dx;
  if (p.toY != null) out.toY = p.toY + dy;
  return out;
}

/** Shift primitives so bounding-box center is at (0,0) — local component space. */
export function normalizeToLocalCenter(primitives: ThreePrimitive[]): ThreePrimitive[] {
  const bounds = extractPrimitiveBounds(primitives);
  if (!bounds) return primitives;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  if (Math.abs(cx) < 2 && Math.abs(cy) < 2) return primitives;
  return primitives.map((p) => translatePrimitive(p, -cx, -cy));
}

/** Apply scene layer z to all primitives (overrides LLM z for consistent depth). */
export function applyLayerZ(primitives: ThreePrimitive[], layer: SceneLayer): ThreePrimitive[] {
  const z = layerToZ(layer);
  return primitives.map((p) => ({ ...p, z }));
}

export interface AssembleOptions {
  layoutTarget: LayoutTarget | null;
  layer: SceneLayer;
  /** If primitives look like absolute canvas coords (far from origin), skip local normalize */
  coordinateMode?: 'local' | 'absolute' | 'auto';
}

function looksLikeAbsoluteCanvasCoords(primitives: ThreePrimitive[]): boolean {
  const bounds = extractPrimitiveBounds(primitives);
  if (!bounds) return false;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  return Math.abs(cx) > 120 || Math.abs(cy) > 120;
}

/**
 * Assemble component onto canvas: local normalize → layout align → layer z.
 */
export function assembleComponentOnCanvas(
  primitives: ThreePrimitive[],
  options: AssembleOptions,
): ThreePrimitive[] {
  let result = [...primitives];

  const useLocal =
    options.coordinateMode === 'local' ||
    (options.coordinateMode !== 'absolute' && !looksLikeAbsoluteCanvasCoords(result));

  if (useLocal) {
    result = normalizeToLocalCenter(result);
  }

  if (options.layoutTarget) {
    result = alignPrimitivesToLayout(result, options.layoutTarget);
  }

  result = applyLayerZ(result, options.layer);
  return result;
}
