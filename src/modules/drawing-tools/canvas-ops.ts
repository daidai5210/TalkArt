/**
 * Canvas operation tool functions for the TalkArt AI Agent.
 *
 * These functions handle canvas-level operations: clear, undo, and export.
 *
 * Like all drawing tool functions, these are pure functions: they return
 * action descriptors rather than directly modifying the store. The caller
 * (the AI Agent orchestration layer) is responsible for executing the
 * actual canvas operations based on the returned results.
 */

import { CanvasContext, ToolResult } from './types';

/**
 * Clear all elements from the canvas.
 *
 * Returns a success result. The caller should clear the Zustand store's
 * elements array when this result is received.
 *
 * @param _context - Current canvas context (unused, but kept for API consistency)
 * @returns ToolResult indicating the clear action
 */
export function clearCanvas(_context: CanvasContext): ToolResult {
  return {
    success: true,
    elementId: undefined,
  };
}

/**
 * Undo the last action on the canvas.
 *
 * Returns a success result with action 'undo'. The caller should call
 * store.undo() when this result is received.
 *
 * @param _context - Current canvas context (unused, but kept for API consistency)
 * @returns ToolResult with undo action descriptor
 */
export function undoAction(_context: CanvasContext): ToolResult {
  return {
    success: true,
    action: 'undo' as const,
  };
}

/**
 * Export the canvas as an image file.
 *
 * Returns a success result with action 'export', format, and filename.
 * The caller should trigger the actual export (e.g., serialize SVG DOM,
 * or render to canvas for PNG) when this result is received.
 *
 * @param _context - Current canvas context (unused, but kept for API consistency)
 * @param params - Export parameters
 * @param params.format - Output format: 'svg' or 'png' (default: 'svg')
 * @param params.filename - Output filename (without extension, default: 'talkart-export')
 * @returns ToolResult with export action descriptor
 */
export function exportImage(
  _context: CanvasContext,
  params?: { format?: 'svg' | 'png'; filename?: string },
): ToolResult {
  const format = params?.format || 'svg';
  const filename = params?.filename || 'talkart-export';

  return {
    success: true,
    action: 'export' as const,
    format,
    filename,
  };
}
