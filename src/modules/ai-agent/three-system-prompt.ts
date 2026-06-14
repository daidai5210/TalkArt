/**
 * System prompts for Three.js progressive drawing (structured primitives API).
 * Subject-only: white paper canvas, no background steps.
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

const SUBJECT_ONLY_RULES = `## 主体绘图原则（最高优先级）
- 画布是**白纸**，背景色由系统渲染，**你永远不需要、也不允许画背景**
- 禁止步骤：天空、草地、地面铺色、全屏矩形底色、渐变背景、环境底图
- 禁止用 plane 铺满画布当背景
- 只画用户要的**主体**：动物身体/头/四肢、人物、物体、标志图形等
- 步骤从主体大轮廓开始，再到部件与细节`;

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

${SUBJECT_ONLY_RULES}

已有步骤数：${stepCount}

${geoRef}

## 规划规则
1. 必须调用 planDrawingSteps 工具
2. 简单图形 1~3 步，复杂主体 5~15 步
3. 步骤顺序：**主体大轮廓 → 主体部件 → 细节**（第一步就是主体，不是背景）
4. **每步 description 只描述主体部件**（如 circle 身体、sphere 头、line 胡须）
5. **每步必须填写 layout**（系统会按边对齐拼合）：
   - 身体（步骤0）：{ centerX:${cx}, centerY:${cy + 70}, width:200, height:120 }
   - 头部：{ attachTo:0, attachEdge:"top", offsetY:-8, width:110, height:95 }
   - 腿：{ attachTo:0, attachEdge:"bottom", offsetX:±45, offsetY:6, width:28, height:50 }
6. 禁止反问；禁止任何背景/环境铺底步骤`;
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

  return `你是 TalkArt 绘图助手「小智」。当前任务：**仅渲染第 ${stepIndex + 1}/${totalSteps} 步的主体部件**。

${canvasSpec}

${SUBJECT_ONLY_RULES}

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
1. **必须调用 renderThreeStep**，参数为 primitives 数组
2. **只画本步主体部件**；禁止画背景/天空/草地/全屏底色
3. 颜色不要用 #FFFFFF 画大面积主体（会与白纸背景融合）
4. 动物：身体/头用 circle 或 sphere；立体元素用 box/cylinder
5. 禁止纯文字回复

## 调用示例（主体部件，非背景）
{
  "stepIndex": ${stepIndex},
  "label": "${stepLabel}",
  "primitives": [
    { "kind": "circle", "x": ${cx}, "y": ${cy}, "width": 200, "height": 120, "color": "#F4A460", "z": 0 },
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
  return `你是 TalkArt 绘图助手「小智」，在**白纸画布**上分步绘制**主体**（Three.js 图元 API）。

${spec}

${SUBJECT_ONLY_RULES}

## 工作流程
1. planDrawingSteps → 只规划主体步骤 + layout 锚点（不含背景）
2. renderThreeStep → 输出 primitives 图元数组（kind + 参数）
3. 系统校验图元 → 空间对齐 → Three.js 渲染到白纸

${geoSummary}

## 当前状态
- 已有步骤：${elementsSummary}（${elementCount} 步）${spatialBlock}

## 禁止
- 不要反问；不要画背景；不要一次输出所有步骤；坐标不得超出画布`;
}

/** @deprecated */
export const buildLeaferPlanningPrompt = buildThreePlanningPrompt;
/** @deprecated */
export const buildLeaferRenderPrompt = buildThreeRenderPrompt;
