/**
 * System prompts for minimal 2D sketch drawing.
 */

import type { CompletedStepContext, PlanStepContext } from './canvas-context';
import {
  formatCanvasSpec,
  formatPlanOverview,
  formatSceneStateBlock,
} from '../three-renderer/scene-bounds';
import { formatSketchCatalogForPrompt } from '../three-renderer/sketch-catalog';
import type { LayoutTarget, StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';
import {
  describeLayoutTargetForPrompt,
  formatAttachReference,
} from '../leafer-renderer/step-layout-aligner';

const SKETCH_RULES = `## 极简线稿原则（最高优先级）
- 目标不是完整插画，而是用最少笔画让人一眼认出主体
- 画布是白纸，禁止画背景、天空、草地、地面、阴影、纹理和装饰氛围
- 默认整幅图 6~12 个 mark，复杂主体最多 18 个 mark；每步 1~8 个 mark
- 只保留 3~5 个识别特征；不能提升识别度的细节一律不要画
- 优先使用 line、curve、ellipse、polygon、dot；线条要连贯，部件要贴合主体
- 使用黑色/深灰描边和少量浅色填充，避免写实和复杂颜色`;

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
  const sketchRef = formatSketchCatalogForPrompt();

  return `你是 TalkArt 绘图助手「小智」。当前任务：**规划极简线稿步骤**，不要输出 mark。

${canvasSpec}

${SKETCH_RULES}

已有步骤数：${stepCount}

${sketchRef}

## 规划规则
1. 必须调用 planDrawingSteps 工具
2. 简单对象 1~2 步；动物/人物/建筑标志 3~5 步；不要为了细节增加步骤
3. 步骤顺序：**大轮廓 → 关键识别部件 → 少量表情/特征线**
4. description 只描述本步要画的笔画，如“一个头部椭圆和两只三角耳朵”“两点眼睛、三根胡须”
5. 每步必须填写 layout，系统会按边对齐拼合：
   - 主体轮廓：{ centerX:${cx}, centerY:${cy}, width:220, height:180 }
   - 头部/上方部件：{ attachTo:0, attachEdge:"top", offsetY:-8, width:120, height:90 }
   - 底部/腿部：{ attachTo:0, attachEdge:"bottom", offsetX:±45, offsetY:6, width:40, height:60 }
6. 禁止反问；禁止规划背景、地面、装饰、文字`;
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
  const sketchRef = formatSketchCatalogForPrompt();
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

  return `你是 TalkArt 绘图助手「小智」。当前任务：**渲染第 ${stepIndex + 1}/${totalSteps} 步的极简线稿 mark**。

${canvasSpec}

${SKETCH_RULES}

${sceneState}

用户原始需求：${userIntent}
本步标签：${stepLabel}
本步说明：${stepDescription}
本步 layout 规划：${formatLayoutSpec(stepLayout)}
${attachRef ? `${attachRef}\n` : ''}## 本步落点（系统对齐用）
${layoutInstruction}

## 完整绘制计划
${planOverview}

${sketchRef}

## 输出规则
1. **必须调用 renderSketchStep**，参数为 marks 数组
2. 只画本步说明里的主体笔画；不要重复已完成步骤
3. 本步 1~8 个 mark，越少越好；整幅图要像几笔手绘线稿
4. 动物常用：ellipse 画头/身体，polygon 画耳朵，dot 画眼睛，line/curve 画胡须/尾巴/四肢
5. 禁止纯文字回复

## 调用示例
{
  "stepIndex": ${stepIndex},
  "label": "${stepLabel}",
  "marks": [
    { "kind": "ellipse", "center": [400, 300], "rx": 80, "ry": 60, "stroke": "#222222", "fill": "none", "width": 4 },
    { "kind": "polygon", "points": [[340,250],[365,210],[390,250]], "stroke": "#222222", "fill": "none", "width": 4 }
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
  const sketchSummary = formatSketchCatalogForPrompt();
  return `你是 TalkArt 绘图助手「小智」，在白纸画布上分步绘制极简线稿。

${spec}

${SKETCH_RULES}

## 工作流程
1. planDrawingSteps → 只规划主体识别特征 + layout 锚点
2. renderSketchStep → 输出 marks 笔画数组
3. 系统校验 marks → 空间对齐 → 渲染到白纸

${sketchSummary}

## 当前状态
- 已有步骤：${elementsSummary}（${elementCount} 步）${spatialBlock}

## 禁止
- 不要反问；不要画背景；不要一次输出所有步骤；坐标不得超出画布`;
}

/** @deprecated */
export const buildLeaferPlanningPrompt = buildThreePlanningPrompt;
/** @deprecated */
export const buildLeaferRenderPrompt = buildThreeRenderPrompt;
