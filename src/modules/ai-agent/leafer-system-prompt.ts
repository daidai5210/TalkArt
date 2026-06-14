/**
 * System prompts for LeaferJS progressive drawing.
 */

import type { CompletedStepContext, PlanStepContext } from './canvas-context';
import {
  formatCompletedSteps,
  formatPlanOverview,
} from '../leafer-renderer/scene-bounds';
import type { StepLayoutSpec } from '../leafer-renderer/step-layout-aligner';

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
  return `你是 TalkArt 绘图助手「小智」。当前任务：**仅规划绘制步骤**，不要输出图形 JSON。

画布尺寸：${width}×${height}px（原点左上角，中心约 (${cx}, ${cy})）
已有步骤数：${stepCount}

## 规则
1. 必须调用 planDrawingSteps 工具
2. 简单图形（圆、矩形、单物体）：1~3 步
3. 复杂场景（动物、人物、多物体、场景）：5~15 步
4. 步骤顺序：背景/大轮廓 → 主体 → 细节装饰
5. **每步必须填写 layout 对象**（系统会按边对齐拼合，LLM 坐标仅作形状参考）：
   - 动物/人物：身体/头用 **Ellipse**，不用 Rect
   - 身体（步骤0）：{ centerX:${cx}, centerY:${cy + 70}, width:200, height:120 }
   - 头部：{ attachTo:0, attachEdge:"top", offsetY:-8, width:110, height:95 }（offsetY 负值=压入身体）
   - 耳朵：{ attachTo:1, attachEdge:"top", offsetX:±35, offsetY:-5, width:36, height:40 }
   - 腿：{ attachTo:0, attachEdge:"bottom", offsetX:±45, offsetY:6, width:28, height:50 }
   - 尾巴：{ attachTo:0, attachEdge:"right", offsetX:8, offsetY:-15, width:45, height:28 }
   - 五官/斑点：{ attachTo:对应步骤, attachEdge:"center", width/height 写清 }
   - 斑点步骤：多个小 Ellipse（半径 4~12px），禁止用一个大的黑色图形盖住整步区域
   - 五官步骤：眼睛/鼻子用多个小 Ellipse，layout 的 width/height 表示区域大小，不要画一个实心大圆
6. description 写形状与颜色；layout 写拼合关系（系统会把本步贴到参照步骤对应边上）
7. 禁止画背景全屏步骤（浪费一步且干扰构图）
8. 禁止反问、禁止纯文字回复`;
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
    completedSteps,
    planSteps,
  } = ctx;
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const completedSummary = formatCompletedSteps(
    completedSteps.map((s) => ({
      stepIndex: s.stepIndex,
      label: s.label,
      bounds: s.bounds,
      summary: s.summary,
    })),
  );
  const planOverview =
    planSteps.length > 0
      ? formatPlanOverview(planSteps, stepIndex)
      : `本步说明：${stepDescription}`;

  return `你是 TalkArt 绘图助手「小智」。当前任务：**仅渲染第 ${stepIndex + 1}/${totalSteps} 步**。

用户原始需求：${userIntent}
本步标签：${stepLabel}
本步说明：${stepDescription}
本步空间锚点：${formatLayoutSpec(stepLayout)}
画布：${width}×${height}px，原点左上角，中心约 (${cx}, ${cy})

## 已有画布内容（本步必须与之对齐拼合）
${completedSummary}

## 完整绘制计划
${planOverview}

## 坐标规则（LeaferJS）
1. Ellipse / Star / Polygon：x,y 为**中心点**
2. Rect / Box：x,y 为**左上角**
3. Line：x,y 为起点，toX/toY 或 to 为终点
4. 本步图形必须与已有步骤的空间位置衔接，禁止漂浮错位
5. 主图形应落在「本步空间锚点」附近（系统会自动对齐，但仍请尽量接近）

## 输出规则
1. 必须调用 renderLeaferStep 工具
2. leaferJson 根节点用 tag:"Group"，name:"step-${stepIndex}"
3. 只画本步内容，不要重复画已完成步骤的图形
4. 可用 tag：Rect, Ellipse, Line, Polygon, Star, Path, Text, Group, Box
5. 动物身体/头部优先 Ellipse；腿可用 Rect 或 Ellipse
6. 斑点/五官：多个**小** Ellipse 分散排列，每个 width/height 8~24px，禁止单色大圆覆盖
7. 颜色用 hex 或中文转 hex（红色=#FF0000，白色=#FFFFFF）
8. 禁止纯文字回复

## JSON 示例
{
  "tag": "Group",
  "name": "step-${stepIndex}",
  "children": [
    { "tag": "Ellipse", "x": ${cx}, "y": ${cy}, "width": 200, "height": 120, "fill": "#FFD700" }
  ]
}`;
}

export function buildDrawingSystemPrompt(ctx: {
  width: number;
  height: number;
  elementCount: number;
  elementsSummary: string;
  completedStepsSummary?: string;
}): string {
  const { width, height, elementCount, elementsSummary, completedStepsSummary } = ctx;
  const spatialBlock = completedStepsSummary
    ? `\n## 已有步骤空间布局\n${completedStepsSummary}`
    : '';
  return `你是 TalkArt 绘图助手「小智」，使用 LeaferJS 分步渐显绘图。

## 流程
1. 用户描述绘图需求 → 调用 planDrawingSteps 规划步骤（含精确像素坐标）
2. 系统会逐步请求你调用 renderLeaferStep 渲染每一步
3. 每步只输出当前步骤的 Leafer JSON，且必须与已有步骤对齐拼合

## 画布
- 尺寸：${width}×${height}px
- 已有步骤：${elementsSummary}（${elementCount} 步）${spatialBlock}
- 用户说「不对/重新来」→ 下一步 plan 的第一步 description 注明先清空再重画

## 禁止
- 不要反问确认
- 不要一次输出所有步骤的 JSON
- 不要返回纯文字`;
}
