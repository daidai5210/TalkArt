/**
 * Select a minimal tool subset for LLM requests to reduce latency.
 * Complex multi-step scenes only need executeDrawingPlan + asset/style helpers.
 */

import { EXECUTE_DRAWING_PLAN_DEFINITION } from '../drawing-tools/v2/tool-schema-skeleton';

const COMPLEX_DRAWING_PATTERN =
  /五环|奥运|国旗|多个|几个|复杂|包装|组合|后面是|一起画|直接画|现在就画|马上就画|国徽|会徽/i;

/**
 * Complex scenes use executeDrawingPlan only — smallest schema, fastest tool-call generation.
 * Olympic rings / flags are expressed as circles, rects, lines inside the plan.
 */
export const COMPACT_DRAWING_TOOLS = [EXECUTE_DRAWING_PLAN_DEFINITION];

export function isComplexDrawingRequest(text: string): boolean {
  return COMPLEX_DRAWING_PATTERN.test(text);
}

export function selectToolsForRequest(allTools: unknown[], userText: string): unknown[] {
  if (!isComplexDrawingRequest(userText)) {
    return allTools;
  }
  return COMPACT_DRAWING_TOOLS;
}
