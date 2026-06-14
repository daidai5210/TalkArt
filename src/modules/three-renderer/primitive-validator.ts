/**
 * Validates and normalizes LLM-produced primitive arrays.
 */

import {
  GEOMETRY_KINDS,
  getGeometryDef,
  type GeometryKind,
} from './geometry-catalog';
import type { ThreePrimitive, ThreeStepSpec } from './primitive-types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: ThreePrimitive[];
}

function num(v: unknown, fallback?: number): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return fallback;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function validatePrimitive(raw: unknown, index: number): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: `primitives[${index}]: 必须是对象` };
  }

  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (typeof kind !== 'string' || !GEOMETRY_KINDS.includes(kind as GeometryKind)) {
    return {
      valid: false,
      error: `primitives[${index}].kind 必须是 ${GEOMETRY_KINDS.join('|')} 之一`,
    };
  }

  const def = getGeometryDef(kind as GeometryKind)!;
  const x = num(o.x);
  const y = num(o.y);
  if (x == null || y == null) {
    return { valid: false, error: `primitives[${index}]: x,y 必填且为数字` };
  }

  for (const param of def.requiredParams) {
    if (param === 'x' || param === 'y') continue;
    if (num(o[param]) == null && str(o[param]) == null) {
      // circle/ring allow radius OR width+height
      if (kind === 'circle' && (param === 'width' || param === 'height')) {
        if (num(o.radius) != null) continue;
        if (num(o.width) != null && num(o.height) != null) continue;
      }
      if (kind === 'ring' && (param === 'innerRadius' || param === 'outerRadius')) {
        if (num(o.radius) != null) continue;
        if (num(o.innerRadius) != null && num(o.outerRadius) != null) continue;
      }
      return {
        valid: false,
        error: `primitives[${index}] (${kind}): 缺少必填参数 ${param}`,
      };
    }
  }

  // circle: need width+height OR radius
  if (kind === 'circle') {
    const hasSize = num(o.width) != null && num(o.height) != null;
    const hasRadius = num(o.radius) != null;
    if (!hasSize && !hasRadius) {
      return {
        valid: false,
        error: `primitives[${index}] (circle): 需要 width+height 或 radius`,
      };
    }
  }

  if (kind === 'ring') {
    const hasRadii = num(o.innerRadius) != null && num(o.outerRadius) != null;
    const hasRadius = num(o.radius) != null;
    if (!hasRadii && !hasRadius) {
      return {
        valid: false,
        error: `primitives[${index}] (ring): 需要 innerRadius+outerRadius 或 radius`,
      };
    }
  }

  const primitive: ThreePrimitive = {
    kind: kind as GeometryKind,
    x,
    y,
  };

  const copyNum = (key: keyof ThreePrimitive) => {
    const v = num(o[key as string]);
    if (v != null) (primitive[key] as number) = v;
  };

  for (const key of [
    'z', 'width', 'height', 'depth', 'radius', 'radiusTop', 'radiusBottom',
    'tube', 'innerRadius', 'outerRadius', 'toX', 'toY', 'rotation',
    'opacity', 'roughness', 'metalness', 'strokeWidth',
  ] as const) {
    copyNum(key);
  }

  const color = str(o.color);
  if (color) primitive.color = color;

  // circle: default width/height from radius
  if (kind === 'circle' && primitive.width == null && primitive.radius != null) {
    primitive.width = primitive.radius * 2;
    primitive.height = primitive.radius * 2;
  }
  if (kind === 'circle' && primitive.width != null && primitive.height == null) {
    primitive.height = primitive.width;
  }

  // ring: default radii from radius
  if (kind === 'ring' && primitive.innerRadius == null && primitive.radius != null) {
    primitive.innerRadius = primitive.radius * 0.5;
    primitive.outerRadius = primitive.radius;
  }

  return { valid: true, normalized: [primitive] };
}

export function validatePrimitives(input: unknown): ValidationResult {
  if (!input) {
    return { valid: false, error: 'primitives 不能为空' };
  }

  let payload = input;
  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input);
    } catch {
      return { valid: false, error: 'primitives 不是合法 JSON' };
    }
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    return { valid: false, error: 'primitives 必须是非空数组' };
  }

  const normalized: ThreePrimitive[] = [];
  for (let i = 0; i < payload.length; i++) {
    const result = validatePrimitive(payload[i], i);
    if (!result.valid) return result;
    normalized.push(result.normalized![0]);
  }

  return { valid: true, normalized };
}

export { parseDrawingPlan } from '../leafer-renderer/leafer-json-validator';

export function parseRenderThreeStep(args: Record<string, unknown>): ThreeStepSpec | null {
  const stepIndex = typeof args.stepIndex === 'number' ? args.stepIndex : 0;
  const label = typeof args.label === 'string' ? args.label : `步骤 ${stepIndex + 1}`;

  // New API: primitives array
  if (args.primitives != null) {
    const result = validatePrimitives(args.primitives);
    if (!result.valid || !result.normalized) return null;
    return { stepIndex, label, primitives: result.normalized };
  }

  // Legacy fallback: threeJson → convert via tag mapping
  if (args.threeJson != null) {
    const converted = legacyThreeJsonToPrimitives(args.threeJson);
    if (!converted) return null;
    return { stepIndex, label, primitives: converted };
  }

  return null;
}

/** Convert legacy tag-based JSON to primitives for backward compatibility. */
function legacyThreeJsonToPrimitives(input: unknown): ThreePrimitive[] | null {
  if (!input || typeof input !== 'object') return null;
  const root = input as Record<string, unknown>;
  const nodes: Record<string, unknown>[] = [];
  if (root.tag === 'Group' && Array.isArray(root.children)) {
    nodes.push(...(root.children as Record<string, unknown>[]));
  } else {
    nodes.push(root);
  }

  const kindMap: Record<string, GeometryKind> = {
    Plane: 'plane',
    Rect: 'plane',
    Ellipse: 'circle',
    Circle: 'circle',
    Box: 'box',
    Sphere: 'sphere',
    Cylinder: 'cylinder',
    Cone: 'cone',
    Torus: 'torus',
    Ring: 'ring',
    Line: 'line',
  };

  const out: ThreePrimitive[] = [];
  for (const node of nodes) {
    const tag = String(node.tag ?? '');
    const kind = kindMap[tag];
    if (!kind) continue;
    const p: ThreePrimitive = {
      kind,
      x: typeof node.x === 'number' ? node.x : 0,
      y: typeof node.y === 'number' ? node.y : 0,
    };
    if (typeof node.z === 'number') p.z = node.z;
    if (typeof node.width === 'number') p.width = node.width;
    if (typeof node.height === 'number') p.height = node.height;
    if (typeof node.depth === 'number') p.depth = node.depth;
    if (typeof node.radius === 'number') p.radius = node.radius;
    if (typeof node.tube === 'number') p.tube = node.tube;
    if (typeof node.toX === 'number') p.toX = node.toX;
    if (typeof node.toY === 'number') p.toY = node.toY;
    if (typeof node.rotation === 'number') p.rotation = node.rotation;
    const color = node.color ?? node.fill;
    if (typeof color === 'string') p.color = color;
    if (typeof node.opacity === 'number') p.opacity = node.opacity;
    out.push(p);
  }
  return out.length ? out : null;
}
