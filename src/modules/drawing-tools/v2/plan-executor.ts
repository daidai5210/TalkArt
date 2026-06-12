/**
 * @module drawing-tools/v2/plan-executor
 * Phase 2: batch execution of DrawingPlan steps.
 */

import type { CanvasContext, ToolResult } from '../types';
import type {
  ExecuteDrawingPlanInput,
  ExecuteDrawingPlanResult,
  PlanStepError,
} from './execute-drawing-plan.types';

export type PlanDispatchFn = (
  tool: string,
  args: Record<string, unknown>,
) => ToolResult;

function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Execute a drawing plan by dispatching each step sequentially.
 */
export function executeDrawingPlan(
  context: CanvasContext,
  input: ExecuteDrawingPlanInput,
  dispatch: PlanDispatchFn,
): ExecuteDrawingPlanResult {
  const planId = input.planId ?? generatePlanId();
  const steps = input.steps ?? [];
  const results: ToolResult[] = [];
  const errors: PlanStepError[] = [];
  const collectedElements: NonNullable<ToolResult['elements']> = [];

  let completedSteps = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const result = dispatch(step.tool, step.args);
    results.push(result);

    if (!result.success) {
      errors.push({
        stepIndex: i,
        tool: step.tool,
        error: result.error ?? '未知错误',
      });

      if (input.atomic) {
        return {
          success: false,
          planId,
          completedSteps,
          totalSteps: steps.length,
          results,
          errors,
        };
      }
      continue;
    }

    completedSteps++;

    if (result.element) {
      collectedElements.push(result.element);
    }
    if (result.elements) {
      collectedElements.push(...result.elements);
    }
  }

  const success = errors.length === 0;

  return {
    success,
    planId,
    completedSteps,
    totalSteps: steps.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
    // Attach aggregated elements for caller convenience
    ...(collectedElements.length > 0 ? { elements: collectedElements } : {}),
  } as ExecuteDrawingPlanResult & { elements?: typeof collectedElements };
}

/**
 * Wrap plan execution as a ToolResult for ToolDispatcher.
 */
export function executeDrawingPlanAsTool(
  context: CanvasContext,
  input: ExecuteDrawingPlanInput,
  dispatch: PlanDispatchFn,
): ToolResult {
  const planResult = executeDrawingPlan(context, input, dispatch);
  const elements = (planResult as { elements?: ToolResult['elements'] }).elements;

  return {
    success: planResult.success || planResult.completedSteps > 0,
    elements,
    planResult: {
      planId: planResult.planId,
      completedSteps: planResult.completedSteps,
      totalSteps: planResult.totalSteps,
      errors: planResult.errors,
    },
    error:
      planResult.errors && planResult.errors.length > 0
        ? planResult.errors.map((e) => `步骤${e.stepIndex}: ${e.error}`).join('; ')
        : undefined,
  };
}
