export { ThreeCanvas, LeaferCanvas } from './ThreeCanvas';
export { ThreeManager, getThreeManager, getLeaferManager } from './ThreeManager';
export { stepDelayMs, fadeDurationMs } from './ThreeStepAnimator';
export type { ThreeStepJSON, DrawingPlan, DrawingPlanStep, StepProgress } from './types';
export { ALLOWED_THREE_TAGS } from './types';
export {
  validateThreeJson,
  parseDrawingPlan,
  parseRenderThreeStep,
} from './three-json-validator';
export type { ValidationResult } from './three-json-validator';
export {
  extractThreeJsonBounds,
  summarizeThreeJson,
  extractLeaferJsonBounds,
  summarizeLeaferJson,
  formatCanvasSpec,
  formatSceneStateBlock,
} from './scene-bounds';

/** @deprecated use parseRenderThreeStep */
export { parseRenderThreeStep as parseRenderLeaferStep } from './three-json-validator';

/** @deprecated use validateThreeJson */
export { validateThreeJson as validateLeaferJson } from './three-json-validator';

export {
  alignStepJsonToLayout,
  resolveStepLayoutTarget,
  describeLayoutTargetForPrompt,
  formatAttachReference,
  parseStepLayoutSpec,
} from '../leafer-renderer/step-layout-aligner';

export type { StepLayoutSpec, LayoutTarget } from '../leafer-renderer/step-layout-aligner';
export type { Bounds, StepLayoutRecord } from './scene-bounds';
