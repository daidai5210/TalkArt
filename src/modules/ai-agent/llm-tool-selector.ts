/**
 * Select a minimal tool subset for LLM requests to reduce latency.
 * Complex multi-step scenes only need executeDrawingPlan + asset/style helpers.
 */

import { EXECUTE_DRAWING_PLAN_DEFINITION } from '../drawing-tools/v2/tool-schema-skeleton';

/** Any drawing intent → executeDrawingPlan only (fastest + forces step plan). */
const DRAWING_INTENT_PATTERN =
  /画|绘|绘制|帮我画|帮我做|做一|生成|圆|方|三角|猫|狗|鸟|花|树|人|车|五环|奥运|国旗|包装/i;

/**
 * Complex scenes use executeDrawingPlan only — smallest schema, fastest tool-call generation.
 * Olympic rings / flags are expressed as circles, rects, lines inside the plan.
 */
export const COMPACT_DRAWING_TOOLS = [EXECUTE_DRAWING_PLAN_DEFINITION];

export function isComplexDrawingRequest(text: string): boolean {
  return DRAWING_INTENT_PATTERN.test(text);
}

export function selectToolsForRequest(allTools: unknown[], userText: string): unknown[] {
  if (DRAWING_INTENT_PATTERN.test(userText)) {
    return COMPACT_DRAWING_TOOLS;
  }
  return allTools;
}
