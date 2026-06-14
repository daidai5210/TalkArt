export { ThreeCanvas, LeaferCanvas } from './ThreeCanvas';
export { ThreeManager, getThreeManager, getLeaferManager } from './ThreeManager';
export { stepDelayMs, fadeDurationMs } from './ThreeStepAnimator';
export type {
  ThreePrimitive,
  ThreeStepSpec,
  DrawingPlan,
  DrawingPlanStep,
  StepProgress,
} from './primitive-types';
export {
  GEOMETRY_CATALOG,
  GEOMETRY_KINDS,
  formatGeometryCatalogForPrompt,
  getGeometryDef,
} from './geometry-catalog';
export type { GeometryKind, GeometryDef } from './geometry-catalog';
export {
  validatePrimitives,
  parseRenderThreeStep,
} from './primitive-validator';
export type { ValidationResult } from './primitive-validator';
export {
  extractPrimitiveBounds,
  summarizePrimitives,
  summarizePrimitive,
} from './primitive-bounds';
export { alignPrimitivesToLayout } from './primitive-aligner';
export {
  assembleComponentOnCanvas,
  normalizeToLocalCenter,
  applyLayerZ,
} from './component-assembler';
export {
  parseComposedDrawingPlan,
  resolveCompositionLayoutTarget,
  formatSceneMetaForPrompt,
  formatLayerGuideForPlanning,
  layerToZ,
  defaultSceneMeta,
} from './scene-composition';
export type { SceneMeta, SceneLayer, ComposedDrawingPlan } from './scene-composition';
export {
  formatCanvasSpec,
  formatSceneStateBlock,
} from './scene-bounds';
export {
  resolveStepLayoutTarget,
  describeLayoutTargetForPrompt,
  formatAttachReference,
  parseStepLayoutSpec,
} from '../leafer-renderer/step-layout-aligner';
export type { StepLayoutSpec, LayoutTarget } from '../leafer-renderer/step-layout-aligner';
export type { Bounds, StepLayoutRecord } from './scene-bounds';

/** @deprecated */
export { parseComposedDrawingPlan as parseDrawingPlan } from './scene-composition';
