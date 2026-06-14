/** Re-export canvas/scene formatting from shared spatial module. */
export type { Bounds, StepLayoutRecord } from '../leafer-renderer/scene-bounds';
export {
  mergeBounds,
  formatBounds,
  formatCompletedSteps,
  formatPlanOverview,
  formatCanvasSpec,
  formatSceneStateBlock,
} from '../leafer-renderer/scene-bounds';
