/**
 * System prompts for Three.js progressive drawing (structured primitives API).
 */

import type { CompletedStepContext, PlanStepContext } from './canvas-context';
import {
  formatCanvasSpec,
  formatPlanOverview,
  formatSceneStateBlock,
} from '../three-renderer/scene-bounds';
import { formatGeometryCatalogForPrompt } from '../three-renderer/geometry-catalog';
import type { LayoutTarget, StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';
import {
  describeLayoutTargetForPrompt,
  formatAttachReference,
} from '../leafer-renderer/step-layout-aligner';

function formatLayoutSpec(layout: StepLayoutSpec | undefined): string {
  if (!layout) return '（未指定，请按 description 坐标绘制）';
  if (layout.centerX != null && layout.centerY != null) {
    const size =
      layout.width && layout.height
        ? ` 目标尺寸 ${layout.width}×${layout.height}px`
        : '';
    return `中心 (${layout.centerX}, ${layout.centerY})${size}`;
  }
  if (layout.attachTo != null) {
    return `依附步骤 ${layout.attachTo + 1} 的 ${layout.attachEdge ?? 'center'} 边，偏移 (${layout.offsetX ?? 0}, ${layout.offsetY ?? 0})${layout.width ? ` 尺寸 ${layout.width}×${layout.height}px` : ''}`;
  }
  return '（未指定）';
}

export function buildThreePlanningPrompt(ctx: {
  width: number;
  height: number;
  stepCount: number;
}): string {
  const { width, height, stepCount } = ctx;
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const canvasSpec = formatCanvasSpec(width, height);
  const geoRef = formatGeometryCatalogForPrompt();

  return `你是 TalkArt 绘图助手「小智」。当前任务：**仅规划绘制步骤**，不要输出图元。

${canvasSpec}
已有步骤数：${stepCount}

${geoRef}

## 规划规则
1. 必须调用 planDrawingSteps 工具
2. 简单图形 1~3 步，复杂场景 5~15 步
3. 步骤顺序：大轮廓 → 主体 → 细节
4. **每步 description 应说明用哪些 kind 图元**（如 circle 身体 + sphere 头）
5. **每步必须填写 layout**（系统会按边对齐拼合）：
   - 身体：{ centerX:${cx}, centerY:${cy + 70}, width:200, height:120 }
   - 头部：{ attachTo:0, attachEdge:"top", offsetY:-8, width:110, height:95 }
   - 腿：{ attachTo:0, attachEdge:"bottom", offsetX:±45, offsetY:6, width:28, height:50 }
6. 禁止全屏背景步骤；禁止反问`;
}

export function buildThreeRenderPrompt(ctx: {
  width: number;
  height: number;
  userIntent: string;
  stepIndex: number;
  totalSteps: number;
  stepLabel: string;
  stepDescription: string;
  stepLayout?: StepLayoutSpec;
  resolvedLayoutTarget?: LayoutTarget | null;
  completedSteps: CompletedStepContext[];
  planSteps: PlanStepContext[];
}): string {
  const {
    width,
    height,
    userIntent,
    stepIndex,
    totalSteps,
    stepLabel,
    stepDescription,
    stepLayout,
    resolvedLayoutTarget,
    completedSteps,
    planSteps,
  } = ctx;

  const canvasSpec = formatCanvasSpec(width, height);
  const geoRef = formatGeometryCatalogForPrompt();
  const sceneState = formatSceneStateBlock(
    width,
    height,
    completedSteps.map((s) => ({
      stepIndex: s.stepIndex,
      label: s.label,
      bounds: s.bounds,
      summary: s.summary,
    })),
  );
  const attachRef = formatAttachReference(
    stepLayout,
    completedSteps.map((s) => ({
      stepIndex: s.stepIndex,
      label: s.label,
      bounds: s.bounds,
      summary: s.summary,
    })),
  );
  const layoutInstruction = resolvedLayoutTarget
    ? describeLayoutTargetForPrompt(resolvedLayoutTarget)
    : '（无 layout 锚点，请参考已完成步骤坐标绘制）';

  const planOverview =
    planSteps.length > 0
      ? formatPlanOverview(planSteps, stepIndex)
      : `本步说明：${stepDescription}`;

  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  return `你是 TalkArt 绘图助手「小智」。当前任务：**仅渲染第 ${stepIndex + 1}/${totalSteps} 步**。

${canvasSpec}

${sceneState}

用户原始需求：${userIntent}
本步标签：${stepLabel}
本步说明：${stepDescription}
本步 layout 规划：${formatLayoutSpec(stepLayout)}
${attachRef ? `${attachRef}\n` : ''}## 本步落点（系统对齐用）
${layoutInstruction}

## 完整绘制计划
${planOverview}

${geoRef}

## 输出规则
1. **必须调用 renderThreeStep**，参数为 primitives 数组（不是自由 JSON 树）
2. 只画本步内容；坐标必须在画布内；与已有步骤拼合
3. 动物：身体/头用 circle 或 sphere；立体元素用 box/cylinder
4. 禁止纯文字回复

## 调用示例
{
  "stepIndex": ${stepIndex},
  "label": "${stepLabel}",
  "primitives": [
    { "kind": "circle", "x": ${cx}, "y": ${cy}, "width": 200, "height": 120, "color": "#FFFFFF", "z": 0 },
    { "kind": "sphere", "x": ${cx}, "y": ${cy - 80}, "radius": 48, "color": "#FFE0BD", "z": 5 }
  ]
}`;
}

export function buildDrawingSystemPrompt(ctx: {
  width: number;
  height: number;
  elementCount: number;
  elementsSummary: string;
  completedStepsSummary?: string;
  canvasSpec?: string;
}): string {
  const { width, height, elementCount, elementsSummary, completedStepsSummary, canvasSpec } = ctx;
  const spec = canvasSpec ?? formatCanvasSpec(width, height);
  const spatialBlock = completedStepsSummary
    ? `\n## 已有步骤真实坐标\n${completedStepsSummary}`
    : '';
  const geoSummary = formatGeometryCatalogForPrompt();
  return `你是 TalkArt 绘图助手「小智」，使用 Three.js 内置几何体 API 分步渐显绘图。

${spec}

## 工作流程
1. planDrawingSteps → 规划步骤 + layout 锚点
2. renderThreeStep → 输出 primitives 图元数组（kind + 参数）
3. 系统校验图元 → 空间对齐 → Three.js 渲染

${geoSummary}

## 当前状态
- 已有步骤：${elementsSummary}（${elementCount} 步）${spatialBlock}

## 禁止
- 不要反问；不要一次输出所有步骤；不要用 tag/children 旧格式；坐标不得超出画布`;
}

/** @deprecated */
export const buildLeaferPlanningPrompt = buildThreePlanningPrompt;
/** @deprecated */
export const buildLeaferRenderPrompt = buildThreeRenderPrompt;
