/**
 * Validates LLM-produced Three.js step JSON before rendering.
 */

import { ALLOWED_THREE_TAGS, type ThreeStepJSON } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: ThreeStepJSON;
}

function validateNode(node: unknown, path: string): ValidationResult {
  if (!node || typeof node !== 'object') {
    return { valid: false, error: `${path}: 必须是对象` };
  }

  const obj = node as Record<string, unknown>;
  const tag = obj.tag;
  if (typeof tag !== 'string' || !ALLOWED_THREE_TAGS.has(tag)) {
    return {
      valid: false,
      error: `${path}: tag 必须是 ${[...ALLOWED_THREE_TAGS].join('|')} 之一`,
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

  return { valid: true, normalized: obj as ThreeStepJSON };
}

export function validateThreeJson(input: unknown): ValidationResult {
  if (!input) {
    return { valid: false, error: 'threeJson 不能为空' };
  }

  let payload = input;
  if (typeof input === 'string') {
    try {
      payload = JSON.parse(input);
    } catch {
      return { valid: false, error: 'threeJson 不是合法 JSON 字符串' };
    }
  }

  const result = validateNode(payload, 'threeJson');
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

export { parseDrawingPlan } from '../leafer-renderer/leafer-json-validator';

export function parseRenderThreeStep(args: Record<string, unknown>): {
  stepIndex: number;
  label: string;
  threeJson: ThreeStepJSON;
} | null {
  const stepIndex = typeof args.stepIndex === 'number' ? args.stepIndex : 0;
  const label = typeof args.label === 'string' ? args.label : `步骤 ${stepIndex + 1}`;
  const jsonResult = validateThreeJson(args.threeJson);
  if (!jsonResult.valid || !jsonResult.normalized) return null;
  return { stepIndex, label, threeJson: jsonResult.normalized };
}
