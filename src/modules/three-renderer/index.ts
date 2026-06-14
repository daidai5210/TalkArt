export { ThreeCanvas, LeaferCanvas } from './ThreeCanvas';
export { ThreeManager, getThreeManager, getLeaferManager } from './ThreeManager';
export { stepDelayMs, fadeDurationMs } from './ThreeStepAnimator';
export type {
  SketchMark,
  SketchPoint,
  SketchStepSpec,
  DrawingPlan,
  DrawingPlanStep,
  StepProgress,
} from './sketch-types';
export type { ThreePrimitive, ThreeStepSpec } from './primitive-types';
export { SKETCH_MARK_KINDS, formatSketchCatalogForPrompt } from './sketch-catalog';
export type { SketchMarkKind } from './sketch-catalog';
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
  validateSketchMarks,
  parseDrawingPlan,
  parseRenderSketchStep,
} from './sketch-validator';
export type { SketchValidationResult } from './sketch-validator';
export {
  extractPrimitiveBounds,
  summarizePrimitives,
  summarizePrimitive,
} from './primitive-bounds';
export { alignPrimitivesToLayout } from './primitive-aligner';
export {
  extractSketchBounds,
  summarizeSketchMarks,
  summarizeSketchMark,
} from './sketch-bounds';
export { alignSketchMarksToLayout } from './sketch-aligner';
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

/** @deprecated use extractPrimitiveBounds */
export { extractPrimitiveBounds as extractThreeJsonBounds } from './primitive-bounds';
/** @deprecated use summarizePrimitives */
export { summarizePrimitives as summarizeThreeJson } from './primitive-bounds';
/** @deprecated use alignPrimitivesToLayout */
export { alignPrimitivesToLayout as alignStepJsonToLayout } from './primitive-aligner';
