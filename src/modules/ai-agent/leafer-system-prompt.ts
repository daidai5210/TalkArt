/**
 * System prompts for LeaferJS progressive drawing.
 */

import type { CompletedStepContext, PlanStepContext } from './canvas-context';
import {
  formatCanvasSpec,
  formatPlanOverview,
  formatSceneStateBlock,
} from '../leafer-renderer/scene-bounds';
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

export function buildLeaferPlanningPrompt(ctx: {
  width: number;
  height: number;
  stepCount: number;
}): string {
  const { width, height, stepCount } = ctx;
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const canvasSpec = formatCanvasSpec(width, height);

  return `你是 TalkArt 绘图助手「小智」。当前任务：**仅规划绘制步骤**，不要输出图形 JSON。

${canvasSpec}
已有步骤数：${stepCount}

## 规则
1. 必须调用 planDrawingSteps 工具
2. 简单图形（圆、矩形、单物体）：1~3 步
3. 复杂场景（动物、人物、多物体、场景）：5~15 步
4. 步骤顺序：背景/大轮廓 → 主体 → 细节装饰
5. **所有 layout 坐标必须落在上述画布有效区域内**，禁止超出 ${width}×${height}
6. **每步必须填写 layout 对象**（系统会按边对齐拼合）：
   - 动物/人物：身体/头用 **Ellipse**，不用 Rect
   - 身体（步骤0）：{ centerX:${cx}, centerY:${cy + 70}, width:200, height:120 }
   - 头部：{ attachTo:0, attachEdge:"top", offsetY:-8, width:110, height:95 }
   - 耳朵：{ attachTo:1, attachEdge:"top", offsetX:±35, offsetY:-5, width:36, height:40 }
   - 腿：{ attachTo:0, attachEdge:"bottom", offsetX:±45, offsetY:6, width:28, height:50 }
   - 尾巴：{ attachTo:0, attachEdge:"right", offsetX:8, offsetY:-15, width:45, height:28 }
   - 五官/斑点：依附对应步骤 attachEdge:"center"，多个小图形
7. description 写形状与颜色；layout 写拼合关系
8. 禁止画背景全屏步骤
9. 禁止反问、禁止纯文字回复`;
}

export function buildLeaferRenderPrompt(ctx: {
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
${attachRef ? `${attachRef}\n` : ''}## 本步落点（系统对齐用，请按此坐标绘制）
${layoutInstruction}

## 完整绘制计划（含 layout）
${planOverview}

## 坐标规则（LeaferJS）
1. Ellipse / Star / Polygon：x,y 为**中心点**
2. Rect / Box：x,y 为**左上角**
3. 坐标必须在 0~${width} × 0~${height} 内
4. 只画本步内容；必须与「当前画布状态」中已有步骤拼合，禁止漂浮

## 输出规则
1. 必须调用 renderLeaferStep 工具
2. leaferJson 根节点 tag:"Group"，name:"step-${stepIndex}"
3. 动物身体/头部用 Ellipse；斑点/五官用多个小 Ellipse（8~24px）
4. 禁止纯文字回复

## JSON 示例（本步主图形应接近锚点）
{
  "tag": "Group",
  "name": "step-${stepIndex}",
  "children": [
    { "tag": "Ellipse", "x": ${cx}, "y": ${cy}, "width": 200, "height": 120, "fill": "#FFFFFF" }
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
  return `你是 TalkArt 绘图助手「小智」，使用 LeaferJS 分步渐显绘图。

${spec}

## 流程
1. 用户描述需求 → planDrawingSteps（layout 坐标必须在画布内）
2. 逐步 renderLeaferStep，每步参考「已有步骤真实坐标」拼合

## 当前状态
- 已有步骤：${elementsSummary}（${elementCount} 步）${spatialBlock}

## 禁止
- 不要反问；不要一次输出所有步骤 JSON；坐标不得超出画布`;
}
