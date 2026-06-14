/**
 * Canvas context passed to LLM BFF for LeaferJS drawing.
 */

export interface CanvasContext {
  width: number;
  height: number;
  elements: Array<{ id: string; type: string; [key: string]: unknown }>;
  selectedId: string | null;
  /** Number of completed Leafer render steps on canvas. */
  element_count?: number;
}
