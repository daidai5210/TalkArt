/**
 * System prompts — two-phase: plan scene composition → render local components → assemble.
 */

import type { CompletedStepContext, PlanStepContext } from './canvas-context';
import {
  formatCanvasSpec,
  formatPlanOverview,
  formatSceneStateBlock,
} from '../three-renderer/scene-bounds';
import { formatGeometryCatalogForPrompt } from '../three-renderer/geometry-catalog';
import {
  formatSceneMetaForPrompt,
  formatLayerGuideForPlanning,
  formatStepCompositionForRender,
  type SceneMeta,
} from '../three-renderer/scene-composition';
import type { LayoutTarget, StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';
import {
  describeLayoutTargetForPrompt,
  formatAttachReference,
} from '../leafer-renderer/step-layout-aligner';
import type { SceneLayer } from '../three-renderer/scene-composition';

function formatLayoutSpec(layout: StepLayoutSpec | undefined): string {
  if (!layout) return '（未指定，由系统按 layer 推断）';
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
  const canvasSpec = formatCanvasSpec(width, height);
  const layerGuide = formatLayerGuideForPlanning(width, height);

  return `你是 TalkArt 绘图助手「小智」。当前任务：**规划场景组件与平面组装关系**（不输出图元）。

${canvasSpec}
已有步骤数：${stepCount}

${layerGuide}

## 规划流程（两阶段之 Phase 1）
1. 理解图中有哪些组件（天空、地面、道路、牌坊、建筑…）
2. 为每个组件指定 layer + layout 在平面上的位置关系
3. 建筑/道路必须 grounded:true，并用 attachTo 从地面向上链式组装
4. 必须调用 planDrawingSteps，含 scene.groundLineY

## 禁止
- 禁止让牌坊/建筑 layout.centerY 落在 skyBottomY 以上（会漂浮）
- 禁止反问`;
}

export function buildThreeRenderPrompt(ctx: {
  width: number;
  height: number;
  userIntent: string;
  stepIndex: number;
  totalSteps: number;
  stepLabel: string;
  stepDescription: string;
  stepLayer?: SceneLayer;
  stepGrounded?: boolean;
  stepLayout?: StepLayoutSpec;
  sceneMeta?: SceneMeta;
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
    stepLayer = 'structure',
    stepGrounded,
    stepLayout,
    sceneMeta,
    resolvedLayoutTarget,
    completedSteps,
    planSteps,
  } = ctx;

  const canvasSpec = formatCanvasSpec(width, height);
  const geoRef = formatGeometryCatalogForPrompt();
  const sceneBlock = sceneMeta
    ? formatSceneMetaForPrompt(sceneMeta, width, height)
    : '';
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
    : '（系统将根据 layer/grounded 自动组装）';

  const planOverview =
    planSteps.length > 0
      ? formatPlanOverview(planSteps, stepIndex)
      : `本步说明：${stepDescription}`;

  const compositionLine = formatStepCompositionForRender({
    index: stepIndex,
    label: stepLabel,
    description: stepDescription,
    layer: stepLayer,
    grounded: stepGrounded,
    layout: stepLayout,
  });

  return `你是 TalkArt 绘图助手「小智」。当前任务：**设计第 ${stepIndex + 1}/${totalSteps} 步组件形状**（Phase 2：只画形状，不决定画布位置）。

${canvasSpec}
${sceneBlock}

${sceneState}

用户原始需求：${userIntent}
本步组件：${stepLabel}
本步说明：${stepDescription}
本步组装：${compositionLine}
layout 规划：${formatLayoutSpec(stepLayout)}
${attachRef ? `${attachRef}\n` : ''}## 系统将如何把本组件放到画布上
${layoutInstruction}

## 完整计划
${planOverview}

${geoRef}

## 输出规则（局部坐标设计）
1. **必须调用 renderThreeStep**，coordinateMode:"local"
2. **primitives 使用局部坐标**：以组件中心为 (0,0)，x∈[-200,200]，y∈[-150,150]（y 向下为正）
3. 只描述形状与颜色，**不要写画布绝对坐标**，**不要设置 z**（系统按 layer 设置层次）
4. 只画本组件，不要画其他步骤的内容

## 示例（牌坊局部设计）
{
  "stepIndex": ${stepIndex},
  "label": "${stepLabel}",
  "coordinateMode": "local",
  "primitives": [
    { "kind": "box", "x": -120, "y": -80, "width": 24, "height": 160, "depth": 16, "color": "#8B0000" },
    { "kind": "box", "x": 96, "y": -80, "width": 24, "height": 160, "depth": 16, "color": "#8B0000" },
    { "kind": "plane", "x": -130, "y": -100, "width": 260, "height": 28, "color": "#A0522D" }
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
  return `你是 TalkArt 绘图助手「小智」，使用两阶段 Three.js 绘图：

${spec}

## 工作流程
1. **Phase 1 planDrawingSteps**：组件清单 + scene.groundLineY + layer + attachTo 组装关系
2. **Phase 2 renderThreeStep**：每个组件用局部坐标设计图元（kind+参数）
3. **系统组装**：局部 → 对齐 layout → 设置 z 层次 → 渲染

## 当前状态
- 已有步骤：${elementsSummary}（${elementCount} 步）${spatialBlock}

## 禁止
- 不要让建筑漂浮；必须用 attachTo 链或 grounded`;
}

/** @deprecated */
export const buildLeaferPlanningPrompt = buildThreePlanningPrompt;
/** @deprecated */
export const buildLeaferRenderPrompt = buildThreeRenderPrompt;
