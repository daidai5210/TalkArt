/**
 * Coordinate utility functions for the drawing tools module.
 *
 * These functions translate semantic parameters (like position: "center",
 * size: "medium") into exact pixel coordinates based on canvas dimensions.
 * They also provide color parsing (Chinese color names → hex) and ID generation.
 */

import { SemanticPosition, SemanticSize } from './types';

/** Margin from canvas edges for positioned elements (in pixels) */
const EDGE_MARGIN = 40;

/** Default semantic size dimensions (in pixels) */
const SIZE_MAP = {
  small: { width: 100, height: 100 },
  medium: { width: 200, height: 200 },
  large: { width: 300, height: 300 },
} as const;

/** Default radius for circles at each semantic size */
const CIRCLE_RADIUS_MAP = {
  small: 50,
  medium: 100,
  large: 150,
} as const;

/** Chinese color name → hex code mapping */
const COLOR_MAP: Record<string, string> = {
  '红色': '#FF0000',
  '蓝色': '#0000FF',
  '绿色': '#00FF00',
  '黄色': '#FFFF00',
  '黑色': '#000000',
  '白色': '#FFFFFF',
  '橙色': '#FF8800',
  '紫色': '#7c5cfc',
  '粉色': '#FF69B4',
  '灰色': '#808080',
  '青色': '#00FFFF',
};

/**
 * Resolve a semantic position to exact pixel coordinates.
 *
 * When a semantic position is provided, the function calculates coordinates
 * based on canvas dimensions and element size, accounting for the element's
 * bounding box so that the element is properly placed within the canvas.
 *
 * When exact x/y coordinates are provided, they are used directly.
 *
 * @param position - The semantic or exact position specification
 * @param canvasWidth - Width of the canvas in pixels
 * @param canvasHeight - Height of the canvas in pixels
 * @param elementWidth - Width of the element to position (for offset calculation)
 * @param elementHeight - Height of the element to position (for offset calculation)
 * @returns Exact { x, y } coordinates in pixels
 */
export function resolvePosition(
  position: SemanticPosition,
  canvasWidth: number,
  canvasHeight: number,
  elementWidth: number,
  elementHeight: number,
): { x: number; y: number } {
  // If exact coordinates are provided, use them directly
  if (position.x !== undefined && position.y !== undefined) {
    return { x: position.x, y: position.y };
  }

  const semantic = position.semantic || 'center';

  switch (semantic) {
    case 'center':
      return {
        x: canvasWidth / 2 - elementWidth / 2,
        y: canvasHeight / 2 - elementHeight / 2,
      };
    case 'top-left':
      return { x: EDGE_MARGIN, y: EDGE_MARGIN };
    case 'top-right':
      return {
        x: canvasWidth - elementWidth - EDGE_MARGIN,
        y: EDGE_MARGIN,
      };
    case 'bottom-left':
      return {
        x: EDGE_MARGIN,
        y: canvasHeight - elementHeight - EDGE_MARGIN,
      };
    case 'bottom-right':
      return {
        x: canvasWidth - elementWidth - EDGE_MARGIN,
        y: canvasHeight - elementHeight - EDGE_MARGIN,
      };
    case 'top':
      return {
        x: canvasWidth / 2 - elementWidth / 2,
        y: EDGE_MARGIN,
      };
    case 'bottom':
      return {
        x: canvasWidth / 2 - elementWidth / 2,
        y: canvasHeight - elementHeight - EDGE_MARGIN,
      };
    case 'left':
      return {
        x: EDGE_MARGIN,
        y: canvasHeight / 2 - elementHeight / 2,
      };
    case 'right':
      return {
        x: canvasWidth - elementWidth - EDGE_MARGIN,
        y: canvasHeight / 2 - elementHeight / 2,
      };
    default:
      // Fallback to center for unknown semantic values
      return {
        x: canvasWidth / 2 - elementWidth / 2,
        y: canvasHeight / 2 - elementHeight / 2,
      };
  }
}

/**
 * Resolve a semantic size to pixel dimensions.
 *
 * When a semantic size is provided, returns predefined dimensions.
 * When exact width/height are provided, uses them directly.
 * Falls back to "medium" if no size information is given.
 *
 * @param size - The semantic or exact size specification
 * @param canvasWidth - Width of the canvas (reserved for future proportional sizing)
 * @param canvasHeight - Height of the canvas (reserved for future proportional sizing)
 * @returns Exact { width, height } dimensions in pixels
 */
export function resolveSize(
  size: SemanticSize,
  _canvasWidth: number,
  _canvasHeight: number,
): { width: number; height: number } {
  // If exact dimensions are provided, use them directly
  if (size.width !== undefined && size.height !== undefined) {
    return { width: size.width, height: size.height };
  }

  const semantic = size.semantic || 'medium';
  const mapped = SIZE_MAP[semantic];

  if (mapped) {
    return { width: mapped.width, height: mapped.height };
  }

  // Fallback to medium
  return { width: SIZE_MAP.medium.width, height: SIZE_MAP.medium.height };
}

/**
 * Get the circle radius for a given semantic size.
 *
 * @param semantic - The semantic size string, or undefined for default
 * @returns Radius in pixels
 */
export function resolveCircleRadius(semantic?: string): number {
  if (!semantic) return CIRCLE_RADIUS_MAP.medium;
  return CIRCLE_RADIUS_MAP[semantic as keyof typeof CIRCLE_RADIUS_MAP] ?? CIRCLE_RADIUS_MAP.medium;
}

/**
 * Parse a color string into a valid CSS color value.
 *
 * Supports:
 * - Chinese color names (e.g., "红色" → "#FF0000")
 * - Hex color codes (e.g., "#FF0000")
 * - CSS color names (e.g., "red", "blue")
 * - Any other valid CSS color string is passed through as-is
 *
 * @param color - The color string to parse
 * @returns A valid CSS color string
 */
export function parseColor(color: string): string {
  if (!color) return '#7c5cfc'; // default purple

  // Check Chinese color name mapping
  const mapped = COLOR_MAP[color];
  if (mapped) return mapped;

  // Pass through as-is for hex codes, CSS color names, rgb(), etc.
  return color;
}

/**
 * Generate a unique element ID for a given shape type.
 *
 * Format: `{type}-{timestamp}-{random}`
 * Example: `circle-1718201234567-a3b2c1`
 *
 * @param type - The shape type (e.g., "circle", "rect")
 * @returns A unique ID string
 */
export function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `${type}-${timestamp}-${random}`;
}
