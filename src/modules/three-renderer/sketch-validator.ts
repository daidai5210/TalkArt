import { parseDrawingPlan } from '../leafer-renderer/leafer-json-validator';
import { SKETCH_MARK_KINDS, type SketchMarkKind } from './sketch-catalog';
import type { SketchMark, SketchPoint, SketchStepSpec } from './sketch-types';

export interface SketchValidationResult {
  valid: boolean;
  error?: string;
  normalized?: SketchMark[];
}

function num(v: unknown, fallback?: number): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return fallback;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function point(v: unknown): SketchPoint | null {
  if (!Array.isArray(v) || v.length < 2) return null;
  const x = num(v[0]);
  const y = num(v[1]);
  return x == null || y == null ? null : [x, y];
}

function points(v: unknown, min: number): SketchPoint[] | null {
  if (!Array.isArray(v) || v.length < min) return null;
  const out: SketchPoint[] = [];
  for (const item of v) {
    const p = point(item);
    if (!p) return null;
    out.push(p);
  }
  return out;
}

function normalizeCommon(raw: Record<string, unknown>): Pick<SketchMark, 'opacity'> & {
  stroke?: string;
  fill?: string;
  width?: number;
} {
  const width = num(raw.width);
  const opacity = num(raw.opacity);
  return {
    ...(str(raw.stroke) ? { stroke: str(raw.stroke) } : {}),
    ...(str(raw.fill) ? { fill: str(raw.fill) } : {}),
    ...(width != null ? { width } : {}),
    ...(opacity != null ? { opacity } : {}),
  };
}

function validateMark(raw: unknown, index: number): SketchValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: `marks[${index}]: 必须是对象` };
  }

  const o = raw as Record<string, unknown>;
  const kind = o.kind;
  if (typeof kind !== 'string' || !SKETCH_MARK_KINDS.includes(kind as SketchMarkKind)) {
    return { valid: false, error: `marks[${index}].kind 必须是 ${SKETCH_MARK_KINDS.join('|')} 之一` };
  }

  const common = normalizeCommon(o);
  let mark: SketchMark;

  switch (kind) {
    case 'line': {
      const from = point(o.from);
      const to = point(o.to);
      if (!from || !to) return { valid: false, error: `marks[${index}] line 需要 from/to 点` };
      mark = { kind, from, to, stroke: common.stroke, width: common.width, opacity: common.opacity };
      break;
    }
    case 'polyline':
    case 'curve': {
      const ps = points(o.points, 2);
      if (!ps) return { valid: false, error: `marks[${index}] ${kind} 需要至少 2 个 points` };
      mark = { kind, points: ps, stroke: common.stroke, width: common.width, opacity: common.opacity };
      break;
    }
    case 'ellipse': {
      const center = point(o.center);
      const rx = num(o.rx);
      const ry = num(o.ry, rx);
      if (!center || rx == null || ry == null || rx <= 0 || ry <= 0) {
        return { valid: false, error: `marks[${index}] ellipse 需要 center/rx/ry` };
      }
      mark = { kind, center, rx, ry, stroke: common.stroke, fill: common.fill, width: common.width, opacity: common.opacity };
      break;
    }
    case 'polygon': {
      const ps = points(o.points, 3);
      if (!ps) return { valid: false, error: `marks[${index}] polygon 需要至少 3 个 points` };
      mark = { kind, points: ps, stroke: common.stroke, fill: common.fill, width: common.width, opacity: common.opacity };
      break;
    }
    case 'dot': {
      const center = point(o.center);
      const r = num(o.r);
      if (!center || r == null || r <= 0) return { valid: false, error: `marks[${index}] dot 需要 center/r` };
      mark = { kind, center, r, fill: common.fill ?? common.stroke, opacity: common.opacity };
      break;
    }
    default:
      return { valid: false, error: `marks[${index}].kind 不支持` };
  }

  return { valid: true, normalized: [mark] };
}

export function validateSketchMarks(input: unknown): SketchValidationResult {
  let payload = input;
  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input);
    } catch {
      return { valid: false, error: 'marks 不是合法 JSON' };
    }
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    return { valid: false, error: 'marks 必须是非空数组' };
  }
  if (payload.length > 20) {
    return { valid: false, error: 'marks 太多，简笔画每步最多 20 个 mark' };
  }

  const normalized: SketchMark[] = [];
  for (let i = 0; i < payload.length; i++) {
    const result = validateMark(payload[i], i);
    if (!result.valid) return result;
    normalized.push(result.normalized![0]);
  }
  return { valid: true, normalized };
}

export function parseRenderSketchStep(args: Record<string, unknown>): SketchStepSpec | null {
  const stepIndex = typeof args.stepIndex === 'number' ? args.stepIndex : 0;
  const label = typeof args.label === 'string' ? args.label : `步骤 ${stepIndex + 1}`;
  const rawMarks = args.marks ?? args.primitives;
  const result = validateSketchMarks(rawMarks);
  if (!result.valid || !result.normalized) return null;
  return { stepIndex, label, marks: result.normalized };
}

export { parseDrawingPlan };
