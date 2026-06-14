/**
 * Static bounds extraction from Leafer JSON for spatial context between steps.
 */

import type { LeaferStepJSON } from './types';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface StepLayoutRecord {
  stepIndex: number;
  label: string;
  bounds: Bounds;
  summary: string;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function mergeBounds(a: Bounds, b: Bounds): Bounds {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function boundsFromSize(
  tag: string,
  x: number,
  y: number,
  width: number,
  height: number,
): Bounds {
  const centerBased = tag === 'Ellipse' || tag === 'Star' || tag === 'Polygon';
  if (centerBased) {
    return {
      minX: x - width / 2,
      minY: y - height / 2,
      maxX: x + width / 2,
      maxY: y + height / 2,
    };
  }
  return {
    minX: x,
    minY: y,
    maxX: x + width,
    maxY: y + height,
  };
}

function extractNodeBounds(node: LeaferStepJSON, offsetX = 0, offsetY = 0): Bounds | null {
  const tag = String(node.tag ?? '');
  const x = num(node.x) + offsetX;
  const y = num(node.y) + offsetY;
  const width = num(node.width);
  const height = num(node.height);

  if (tag === 'Line') {
    const toX = num(node.toX ?? (node.to as { x?: number } | undefined)?.x, x);
    const toY = num(node.toY ?? (node.to as { y?: number } | undefined)?.y, y);
    return {
      minX: Math.min(x, toX),
      minY: Math.min(y, toY),
      maxX: Math.max(x, toX),
      maxY: Math.max(y, toY),
    };
  }

  if (tag === 'Group' || tag === 'Box' || tag === 'Frame') {
    let merged: Bounds | null = null;
    const children = node.children;
    if (Array.isArray(children)) {
      for (const child of children) {
        const childBounds = extractNodeBounds(child as LeaferStepJSON, x, y);
        if (childBounds) {
          merged = merged ? mergeBounds(merged, childBounds) : childBounds;
        }
      }
    }
    if (width > 0 && height > 0) {
      const self = boundsFromSize('Rect', x, y, width, height);
      merged = merged ? mergeBounds(merged, self) : self;
    }
    return merged;
  }

  if (width > 0 && height > 0) {
    return boundsFromSize(tag, x, y, width, height);
  }

  return null;
}

export function extractLeaferJsonBounds(json: LeaferStepJSON): Bounds | null {
  return extractNodeBounds(json);
}

export function formatBounds(bounds: Bounds): string {
  const w = Math.round(bounds.maxX - bounds.minX);
  const h = Math.round(bounds.maxY - bounds.minY);
  const cx = Math.round((bounds.minX + bounds.maxX) / 2);
  const cy = Math.round((bounds.minY + bounds.maxY) / 2);
  return `包围盒(${Math.round(bounds.minX)},${Math.round(bounds.minY)})-(${Math.round(bounds.maxX)},${Math.round(bounds.maxY)}) 约${w}×${h}px 中心(${cx},${cy})`;
}

function summarizeNode(node: LeaferStepJSON): string {
  const tag = String(node.tag ?? 'Node');
  const x = num(node.x);
  const y = num(node.y);
  const w = num(node.width);
  const h = num(node.height);
  if (w && h) {
    const anchor =
      tag === 'Ellipse' || tag === 'Star' || tag === 'Polygon' ? '中心' : '左上';
    return `${tag} ${anchor}(${Math.round(x)},${Math.round(y)}) ${Math.round(w)}×${Math.round(h)}`;
  }
  if (Array.isArray(node.children) && node.children.length) {
    return node.children
      .slice(0, 4)
      .map((c) => summarizeNode(c as LeaferStepJSON))
      .join('; ');
  }
  return tag;
}

export function summarizeLeaferJson(json: LeaferStepJSON): string {
  return summarizeNode(json);
}

export function formatCompletedSteps(steps: StepLayoutRecord[]): string {
  if (steps.length === 0) return '（尚无已完成步骤）';
  return steps
    .map(
      (s) =>
        `- 步骤${s.stepIndex + 1}「${s.label}」: ${s.summary}；${formatBounds(s.bounds)}`,
    )
    .join('\n');
}

export function formatPlanOverview(
  steps: Array<{ index: number; label: string; description: string; layout?: Record<string, unknown> }>,
  currentIndex: number,
): string {
  return steps
    .map((s) => {
      const marker =
        s.index === currentIndex ? '→ 当前' : s.index < currentIndex ? '✓ 已完成' : '待绘制';
      const layoutStr = s.layout ? ` layout=${JSON.stringify(s.layout)}` : '';
      return `${marker} 步骤${s.index + 1}「${s.label}」: ${s.description}${layoutStr}`;
    })
    .join('\n');
}

/** Explicit canvas coordinate system block for LLM prompts. */
export function formatCanvasSpec(width: number, height: number): string {
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);
  const margin = 40;
  return `## 画布坐标系（必须遵守，禁止超出）
- 尺寸：宽 ${width}px × 高 ${height}px，**白纸背景（#FFFFFF）已由系统提供**
- 原点 (0,0) 在左上角；x 向右增大，y 向下增大
- 中心点 (${cx}, ${cy})
- 建议有效区域：x ${margin}~${width - margin}，y ${margin}~${height - margin}
- 所有坐标必须是 0~${width}（x）和 0~${height}（y）范围内的像素整数
- **禁止绘制背景**：不要画天空/草地/全屏底色/环境铺底，只画用户要的主体`;
}

/** Structured scene snapshot of completed steps. */
export function formatSceneStateBlock(
  width: number,
  height: number,
  steps: StepLayoutRecord[],
): string {
  if (steps.length === 0) {
    return `## 当前画布状态\n白纸画布 ${width}×${height}px，尚无已绘制步骤（背景已由系统提供，勿画背景）。`;
  }

  const lines = steps.map((s) => {
    const b = s.bounds;
    const cx = Math.round((b.minX + b.maxX) / 2);
    const cy = Math.round((b.minY + b.maxY) / 2);
    return `  步骤${s.stepIndex + 1}「${s.label}」: 包围盒(${Math.round(b.minX)},${Math.round(b.minY)})-(${Math.round(b.maxX)},${Math.round(b.maxY)}) 中心(${cx},${cy}) | ${s.summary}`;
  });

  return `## 当前画布状态（上一步及之前已渲染的真实坐标，本步必须与之拼合）
画布 ${width}×${height}px，已完成 ${steps.length} 步：
${lines.join('\n')}`;
}
