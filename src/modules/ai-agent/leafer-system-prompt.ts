/**
 * System prompts for LeaferJS progressive drawing.
 */

import type { CompletedStepContext, PlanStepContext } from './canvas-context';
import {
  formatCompletedSteps,
  formatPlanOverview,
} from '../leafer-renderer/scene-bounds';

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
5. **每步 description 必须写清精确像素坐标**，供后续步骤对齐拼合，格式示例：
   - 「身体：Ellipse 中心(${cx},${cy + 80}) 宽200 高140 填充#FFDAB9」
   - 「头部：Ellipse 中心(${cx},${cy - 40}) 宽120 高100」
   - 「左耳：Polygon 中心(${cx - 40},${cy - 90}) 宽40 高50」
6. 先规划整体构图锚点（主体居中），后续步骤坐标必须基于前面步骤的位置，确保能拼成完整图形
7. 禁止反问、禁止纯文字回复`;
}

export function buildLeaferRenderPrompt(ctx: {
  width: number;
  height: number;
  userIntent: string;
  stepIndex: number;
  totalSteps: number;
  stepLabel: string;
  stepDescription: string;
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
5. 严格按本步说明中的坐标绘制；若说明含坐标，必须原样使用

## 输出规则
1. 必须调用 renderLeaferStep 工具
2. leaferJson 根节点用 tag:"Group"，name:"step-${stepIndex}"
3. 只画本步内容，不要重复画已完成步骤的图形
4. 可用 tag：Rect, Ellipse, Line, Polygon, Star, Path, Text, Group, Box
5. 颜色用 hex 或中文转 hex（红色=#FF0000，黄色=#FFD700）
6. 禁止纯文字回复

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
