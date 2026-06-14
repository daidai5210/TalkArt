/**
 * Validates LLM-produced Leafer JSON before rendering.
 */

import { ALLOWED_LEAFER_TAGS, type LeaferStepJSON } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: LeaferStepJSON;
}

function validateNode(node: unknown, path: string): ValidationResult {
  if (!node || typeof node !== 'object') {
    return { valid: false, error: `${path}: 必须是对象` };
  }

  const obj = node as Record<string, unknown>;
  const tag = obj.tag;
  if (typeof tag !== 'string' || !ALLOWED_LEAFER_TAGS.has(tag)) {
    return {
      valid: false,
      error: `${path}: tag 必须是 ${[...ALLOWED_LEAFER_TAGS].join('|')} 之一`,
    };
  }

  if (obj.children !== undefined) {
    if (!Array.isArray(obj.children)) {
      return { valid: false, error: `${path}.children: 必须是数组` };
    }
    for (let i = 0; i < obj.children.length; i++) {
      const childResult = validateNode(obj.children[i], `${path}.children[${i}]`);
      if (!childResult.valid) return childResult;
    }
  }

  return { valid: true, normalized: obj as LeaferStepJSON };
}

export function validateLeaferJson(input: unknown): ValidationResult {
  if (!input) {
    return { valid: false, error: 'leaferJson 不能为空' };
  }

  let payload = input;
  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input);
    } catch {
      return { valid: false, error: 'leaferJson 不是合法 JSON 字符串' };
    }
  }

  const result = validateNode(payload, 'leaferJson');
  if (!result.valid) return result;

  const normalized = result.normalized!;
  if (normalized.tag !== 'Group' && !normalized.children?.length) {
    return {
      valid: true,
      normalized: { tag: 'Group', children: [normalized] },
    };
  }

  return { valid: true, normalized };
}

export function parseDrawingPlan(args: Record<string, unknown>): {
  planId: string;
  totalSteps: number;
  steps: Array<{ index: number; label: string; description: string }>;
} | null {
  const planId = typeof args.planId === 'string' ? args.planId : `plan-${Date.now()}`;
  const steps = args.steps;
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const parsed = steps
    .map((s, i) => {
      if (!s || typeof s !== 'object') return null;
      const step = s as Record<string, unknown>;
      return {
        index: typeof step.index === 'number' ? step.index : i,
        label: String(step.label ?? `步骤 ${i + 1}`),
        description: String(step.description ?? step.label ?? ''),
      };
    })
    .filter(Boolean) as Array<{ index: number; label: string; description: string }>;

  if (parsed.length === 0) return null;

  return {
    planId,
    totalSteps: typeof args.totalSteps === 'number' ? args.totalSteps : parsed.length,
    steps: parsed,
  };
}

export function parseRenderLeaferStep(args: Record<string, unknown>): {
  stepIndex: number;
  label: string;
  leaferJson: LeaferStepJSON;
} | null {
  const stepIndex = typeof args.stepIndex === 'number' ? args.stepIndex : 0;
  const label = typeof args.label === 'string' ? args.label : `步骤 ${stepIndex + 1}`;
  const jsonResult = validateLeaferJson(args.leaferJson);
  if (!jsonResult.valid || !jsonResult.normalized) return null;
  return { stepIndex, label, leaferJson: jsonResult.normalized };
}
