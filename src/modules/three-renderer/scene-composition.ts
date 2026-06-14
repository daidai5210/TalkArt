/**
 * Scene composition: layers, ground line, and component assembly on the canvas plane.
 */

import { parseStepLayoutSpec } from '../leafer-renderer/step-layout-aligner';
import type { StepLayoutSpec, LayoutTarget } from '../leafer-renderer/step-layout-aligner';
import { resolveStepLayoutTarget } from '../leafer-renderer/step-layout-aligner';
import type { StepLayoutRecord } from '../leafer-renderer/scene-bounds';

export type SceneLayer = 'background' | 'ground' | 'structure' | 'detail' | 'foreground';

export interface SceneMeta {
  groundLineY: number;
  /** Y below which is sky/background zone */
  skyBottomY?: number;
}

export interface StepComposition {
  layer: SceneLayer;
  /** When true, component bottom snaps to ground line or attach target top */
  grounded?: boolean;
}

export interface ComposedDrawingPlanStep {
  index: number;
  label: string;
  description: string;
  layer: SceneLayer;
  grounded?: boolean;
  layout?: StepLayoutSpec;
}

export interface ComposedDrawingPlan {
  planId: string;
  totalSteps: number;
  scene: SceneMeta;
  steps: ComposedDrawingPlanStep[];
}

const LAYER_Z: Record<SceneLayer, number> = {
  background: 0,
  ground: 2,
  structure: 8,
  detail: 14,
  foreground: 22,
};

export function layerToZ(layer: SceneLayer): number {
  return LAYER_Z[layer];
}

const LAYER_LABEL: Record<SceneLayer, string> = {
  background: '背景层',
  ground: '地面层',
  structure: '主体结构',
  detail: '细节装饰',
  foreground: '前景层',
};

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function parseLayer(raw: unknown): SceneLayer {
  const layers: SceneLayer[] = ['background', 'ground', 'structure', 'detail', 'foreground'];
  if (typeof raw === 'string' && layers.includes(raw as SceneLayer)) {
    return raw as SceneLayer;
  }
  return 'structure';
}

export function defaultSceneMeta(canvasHeight: number): SceneMeta {
  return {
    groundLineY: Math.round(canvasHeight * 0.82),
    skyBottomY: Math.round(canvasHeight * 0.55),
  };
}

export function parseSceneMeta(
  raw: unknown,
  _canvasWidth: number,
  canvasHeight: number,
): SceneMeta {
  const defaults = defaultSceneMeta(canvasHeight);
  if (!raw || typeof raw !== 'object') return defaults;
  const o = raw as Record<string, unknown>;
  return {
    groundLineY: num(o.groundLineY) ?? defaults.groundLineY,
    skyBottomY: num(o.skyBottomY) ?? defaults.skyBottomY,
  };
}

export function parseComposedDrawingPlan(
  args: Record<string, unknown>,
  canvasWidth: number,
  canvasHeight: number,
): ComposedDrawingPlan | null {
  const planId = typeof args.planId === 'string' ? args.planId : `plan-${Date.now()}`;
  const steps = args.steps;
  if (!Array.isArray(steps) || steps.length === 0) return null;

  const parsed = steps
    .map((s, i) => {
      if (!s || typeof s !== 'object') return null;
      const step = s as Record<string, unknown>;
      const layoutRaw = step.layout;
      return {
        index: typeof step.index === 'number' ? step.index : i,
        label: String(step.label ?? `步骤 ${i + 1}`),
        description: String(step.description ?? step.label ?? ''),
        layer: parseLayer(step.layer),
        grounded: step.grounded === true,
        layout: parseStepLayoutSpec(layoutRaw),
      };
    })
    .filter(Boolean) as ComposedDrawingPlanStep[];

  if (parsed.length === 0) return null;

  return {
    planId,
    totalSteps: typeof args.totalSteps === 'number' ? args.totalSteps : parsed.length,
    scene: parseSceneMeta(args.scene, canvasWidth, canvasHeight),
    steps: parsed,
  };
}

/** Resolve layout target with grounded-bottom snapping to ground line. */
export function resolveCompositionLayoutTarget(
  step: ComposedDrawingPlanStep,
  scene: SceneMeta,
  completed: StepLayoutRecord[],
  canvasWidth: number,
  canvasHeight: number,
): LayoutTarget | null {
  const base = resolveStepLayoutTarget(step.layout, completed);
  if (base) return base;

  if (step.grounded && step.layout?.centerX != null && !step.layout.attachTo) {
    return {
      anchorX: step.layout.centerX,
      anchorY: scene.groundLineY,
      snapEdge: 'bottom',
      width: step.layout.width,
      height: step.layout.height,
    };
  }

  if (step.layer === 'background' && step.layout?.centerX == null && !step.layout?.attachTo) {
    return {
      anchorX: canvasWidth / 2,
      anchorY: (scene.skyBottomY ?? scene.groundLineY) / 2,
      snapEdge: 'center',
      width: canvasWidth - 40,
      height: scene.skyBottomY ?? Math.round(scene.groundLineY * 0.6),
    };
  }

  if (step.layer === 'ground' && !step.layout?.attachTo) {
    return {
      anchorX: canvasWidth / 2,
      anchorY: scene.groundLineY,
      snapEdge: 'bottom',
      width: canvasWidth - 40,
      height: Math.max(40, canvasHeight - scene.groundLineY),
    };
  }

  return null;
}

export function formatSceneMetaForPrompt(scene: SceneMeta, width: number, height: number): string {
  return `## 场景平面组装规范
画布 ${width}×${height}px，视为一个 2D 平面，组件按层叠顺序组装：
- **groundLineY = ${scene.groundLineY}**：地面线，所有 grounded 建筑/道路/牌坊底边必须落在此线或依附组件顶面
- **skyBottomY = ${scene.skyBottomY ?? '未设'}**：天空与地景分界（背景层 y 应 < skyBottomY）
- **层次 z（系统自动设置，勿手动覆盖）**：
  - background → z=0（天空、远景）
  - ground → z=2（草地、路面）
  - structure → z=8（牌坊、建筑主体）
  - detail → z=14（文字、窗、装饰）
  - foreground → z=22（近景树、人物）`;
}

export function formatLayerGuideForPlanning(width: number, height: number): string {
  const ground = Math.round(height * 0.82);
  const sky = Math.round(height * 0.55);
  const cx = Math.round(width / 2);
  return `## 场景组装规划（必遵守）
1. plan 必须含 scene: { groundLineY: ${ground}, skyBottomY: ${sky} }
2. 每步必须含 layer（background|ground|structure|detail|foreground）
3. 建筑/牌坊/道路等必须 grounded:true，并用 attachTo 链式拼合：
   - 步骤0 天空 background：layout { centerX:${cx}, centerY:${Math.round(sky / 2)}, width:${width - 40}, height:${sky} }
   - 步骤1 地面 ground grounded：layout { centerX:${cx}, centerY:${ground}, width:${width - 40}, height:${height - ground} }
   - 步骤2 道路 structure grounded：layout { attachTo:1, attachEdge:"top", centerX:${cx}, width:300, height:80 }
   - 步骤3 牌坊 structure grounded：layout { attachTo:2, attachEdge:"top", offsetY:-2, width:280, height:220 }
4. 禁止主体结构漂浮在 skyBottomY 以上（除非明确是飞鸟/云）`;
}

export function formatStepCompositionForRender(step: ComposedDrawingPlanStep): string {
  const layerLine = `layer=${step.layer}（${LAYER_LABEL[step.layer]}，系统 z=${layerToZ(step.layer)}）`;
  const groundedLine = step.grounded ? 'grounded=true（底边落地面/依附面）' : '';
  return [layerLine, groundedLine].filter(Boolean).join('；');
}
