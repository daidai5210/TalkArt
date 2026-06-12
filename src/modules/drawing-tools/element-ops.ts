/**
 * Element operation tool functions for the TalkArt AI Agent.
 *
 * These functions handle modifying existing elements on the canvas:
 * select, update, delete, move, scale, and duplicate.
 *
 * Like the basic-shapes functions, these are pure functions: they compute
 * and return results without modifying the Zustand store. The caller is
 * responsible for applying the returned changes.
 */

import { CanvasContext, ToolResult } from './types';
import { generateId, parseColor } from './coordinate-utils';

// ─── Element type keyword mapping for description-based selection ────────

/** Maps Chinese type keywords to element type strings */
const TYPE_KEYWORDS: Record<string, string> = {
  '圆': 'circle',
  '圆形': 'circle',
  '圈': 'circle',
  '球': 'circle',
  '矩形': 'rect',
  '矩形框': 'rect',
  '长方形': 'rect',
  '方形': 'rect',
  '方块': 'rect',
  '正方形': 'rect',
  '椭圆': 'ellipse',
  '线': 'line',
  '直线': 'line',
  '文字': 'text',
  '文本': 'text',
  '字': 'text',
  '三角形': 'triangle',
  '三角': 'triangle',
};

/** Chinese color name → hex code mapping (duplicated from coordinate-utils for matching) */
const COLOR_KEYWORDS: Record<string, string> = {
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

/** Chinese color names also as simple tokens for matching */
const COLOR_NAMES = Object.keys(COLOR_KEYWORDS);

/**
 * Find the best matching element by description.
 *
 * Matches against element type keywords (e.g., "圆" → circle) and
 * color names (e.g., "蓝色" → blue fill/stroke).
 *
 * @param context - Current canvas context with elements array
 * @param description - Chinese description of the target element
 * @returns The matching element, or null if none found
 */
function findElementByDescription(
  context: CanvasContext,
  description: string,
): CanvasContext['elements'][number] | null {
  if (!description || !context.elements.length) return null;

  let bestMatch: CanvasContext['elements'][number] | null = null;
  let bestScore = 0;

  for (const element of context.elements) {
    let score = 0;

    // Check type keyword matches
    for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
      if (description.includes(keyword) && element.type === type) {
        score += 2; // type match is high priority
        break;
      }
    }

    // Check color keyword matches against element properties
    for (const colorName of COLOR_NAMES) {
      if (description.includes(colorName)) {
        // We need to check the element's fill/stroke, but the context
        // elements only have positional props. For now, score if
        // description contains a color name (we'd need extended element
        // data for perfect matching). In practice, the store will have
        // full element data with fill/stroke.
        const hexColor = COLOR_KEYWORDS[colorName];
        const elementAny = element as Record<string, unknown>;
        if (
          elementAny.fill === hexColor ||
          elementAny.stroke === hexColor ||
          elementAny.fill === colorName ||
          elementAny.stroke === colorName
        ) {
          score += 1; // color match
        }
      }
    }

    // If no specific keywords matched, just return the last element
    // as a fallback (most recently created)
    if (score > bestScore) {
      bestScore = score;
      bestMatch = element;
    }
  }

  // If nothing scored, fall back to the last element (most recent)
  if (!bestMatch && context.elements.length > 0) {
    bestMatch = context.elements[context.elements.length - 1];
  }

  return bestMatch;
}

/**
 * Get an element by ID, or return the currently selected element,
 * or find by description.
 *
 * Priority: id param > selectedId on context > description match
 *
 * @param context - Current canvas context
 * @param params - Params with optional id and description
 * @returns The element and its ID, or an error ToolResult
 */
function resolveElement(
  context: CanvasContext,
  params: { id?: string; description?: string },
): { element: CanvasContext['elements'][number]; elementId: string } | ToolResult {
  // 1. Try by explicit ID
  if (params.id) {
    const found = context.elements.find((el) => el.id === params.id);
    if (found) {
      return { element: found, elementId: found.id };
    }
    return {
      success: false,
      error: `未找到ID为 "${params.id}" 的元素`,
    };
  }

  // 2. Try currently selected element
  if (context.selectedId) {
    const found = context.elements.find((el) => el.id === context.selectedId);
    if (found) {
      return { element: found, elementId: found.id };
    }
  }

  // 3. Try by description
  if (params.description) {
    const found = findElementByDescription(context, params.description);
    if (found) {
      return { element: found, elementId: found.id };
    }
    return {
      success: false,
      error: `未找到匹配描述 "${params.description}" 的元素`,
    };
  }

  return {
    success: false,
    error: '请指定要操作的元素：提供id、描述或先选中一个元素',
  };
}

// ─── Element operation functions ─────────────────────────────────────

/**
 * Select an element on the canvas.
 *
 * If an id is provided, selects that element directly.
 * If a description is provided (e.g., "那个圆", "蓝色的矩形"),
 * finds the best matching element by type/color keywords.
 *
 * @param context - Current canvas context
 * @param params - Selection parameters
 * @param params.id - Element ID to select
 * @param params.description - Chinese description of the element to select
 * @returns ToolResult with the selected elementId
 */
export function selectElement(
  context: CanvasContext,
  params: { id?: string; description?: string },
): ToolResult {
  try {
    if (!context.elements.length) {
      return {
        success: false,
        error: '画布上没有元素可以选择',
      };
    }

    const result = resolveElement(context, params);
    if ('success' in result && !result.success) {
      return result as ToolResult;
    }

    const { elementId } = result as { element: CanvasContext['elements'][number]; elementId: string };

    return {
      success: true,
      elementId,
    };
  } catch (error) {
    return {
      success: false,
      error: `选择元素失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Update properties of an element.
 *
 * The properties can include: fill, stroke, strokeWidth, position (x/y or cx/cy),
 * size (width/height, r, rx/ry), fontSize, etc.
 *
 * If no id is provided and no element is selected, returns an error.
 *
 * @param context - Current canvas context
 * @param params - Update parameters
 * @param params.id - Optional element ID (uses selected element if omitted)
 * @param params.properties - Key-value pairs of properties to update
 * @returns ToolResult with the updated element data
 */
export function updateElement(
  context: CanvasContext,
  params: { id?: string; properties: Record<string, unknown> },
): ToolResult {
  try {
    const { properties } = params;

    if (!properties || Object.keys(properties).length === 0) {
      return {
        success: false,
        error: '请提供要更新的属性',
      };
    }

    const result = resolveElement(context, params);
    if ('success' in result && !result.success) {
      return result as ToolResult;
    }

    const { element, elementId } = result as { element: CanvasContext['elements'][number]; elementId: string };

    // Build the updated props by merging existing element data with new properties
    const existingProps: Record<string, unknown> = { ...element };
    const updatedProps: Record<string, unknown> = { ...existingProps };

    // Process each property
    for (const [key, value] of Object.entries(properties)) {
      // Handle color properties through parseColor
      if (key === 'fill' || key === 'stroke') {
        updatedProps[key] = typeof value === 'string' ? parseColor(value) : value;
      } else {
        updatedProps[key] = value;
      }
    }

    // Remove 'id' from props — it's immutable
    delete updatedProps.id;

    return {
      success: true,
      elementId,
      element: {
        id: elementId,
        type: element.type,
        props: updatedProps,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `更新元素失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Delete an element from the canvas.
 *
 * If no id is provided, deletes the currently selected element.
 *
 * @param context - Current canvas context
 * @param params - Deletion parameters
 * @param params.id - Optional element ID (uses selected element if omitted)
 * @returns ToolResult indicating success
 */
export function deleteElement(
  context: CanvasContext,
  params: { id?: string },
): ToolResult {
  try {
    if (!context.elements.length) {
      return {
        success: false,
        error: '画布上没有元素可以删除',
      };
    }

    const result = resolveElement(context, params);
    if ('success' in result && !result.success) {
      return result as ToolResult;
    }

    const { elementId } = result as { element: CanvasContext['elements'][number]; elementId: string };

    return {
      success: true,
      elementId,
    };
  } catch (error) {
    return {
      success: false,
      error: `删除元素失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** Semantic direction → pixel offset mapping for moveElement */
const DIRECTION_MAP: Record<string, { dx: number; dy: number }> = {
  '左边': { dx: -50, dy: 0 },
  '左': { dx: -50, dy: 0 },
  '左面': { dx: -50, dy: 0 },
  '右边': { dx: 50, dy: 0 },
  '右': { dx: 50, dy: 0 },
  '右面': { dx: 50, dy: 0 },
  '上面': { dx: 0, dy: -50 },
  '上': { dx: 0, dy: -50 },
  '上面一点': { dx: 0, dy: -50 },
  '下面': { dx: 0, dy: 50 },
  '下': { dx: 0, dy: 50 },
  '下面一点': { dx: 0, dy: 50 },
};

/**
 * Move an element on the canvas.
 *
 * Supports two modes:
 * 1. Exact: provide dx/dy pixel offsets
 * 2. Semantic: provide a direction string like "左边" (left), "右边" (right),
 *    "上面" (up), "下面" (down) — defaults to 50px per move
 *
 * @param context - Current canvas context
 * @param params - Move parameters
 * @param params.id - Optional element ID (uses selected element if omitted)
 * @param params.dx - Horizontal pixel offset
 * @param params.dy - Vertical pixel offset
 * @param params.direction - Semantic direction string
 * @returns ToolResult with the updated element position
 */
export function moveElement(
  context: CanvasContext,
  params: { id?: string; dx?: number; dy?: number; direction?: string },
): ToolResult {
  try {
    const result = resolveElement(context, params);
    if ('success' in result && !result.success) {
      return result as ToolResult;
    }

    const { element, elementId } = result as { element: CanvasContext['elements'][number]; elementId: string };

    // Determine dx/dy from direction or explicit values
    let dx = params.dx ?? 0;
    let dy = params.dy ?? 0;

    if (params.direction) {
      const mapped = DIRECTION_MAP[params.direction];
      if (mapped) {
        dx = mapped.dx;
        dy = mapped.dy;
      } else {
        return {
          success: false,
          error: `未知的方向 "${params.direction}"，支持的方向：左边、右边、上面、下面`,
        };
      }
    }

    // If no dx/dy and no direction, default to 0 (no-op)
    if (dx === 0 && dy === 0 && !params.direction && params.dx === undefined && params.dy === undefined) {
      return {
        success: false,
        error: '请指定移动方向或偏移量',
      };
    }

    // Compute new position based on element type
    const updatedProps: Record<string, unknown> = { ...element };
    delete updatedProps.id;

    if (element.type === 'circle' || element.type === 'ellipse') {
      // Circle/ellipse use cx/cy
      if (element.cx !== undefined) updatedProps.cx = element.cx + dx;
      if (element.cy !== undefined) updatedProps.cy = element.cy + dy;
    } else {
      // Rect, text, triangle, line use x/y (or x1/y1, x2/y2)
      if (element.type === 'line') {
        // For lines, move both endpoints
        const elementAny = element as Record<string, unknown>;
        if (elementAny.x1 !== undefined) updatedProps.x1 = (elementAny.x1 as number) + dx;
        if (elementAny.y1 !== undefined) updatedProps.y1 = (elementAny.y1 as number) + dy;
        if (elementAny.x2 !== undefined) updatedProps.x2 = (elementAny.x2 as number) + dx;
        if (elementAny.y2 !== undefined) updatedProps.y2 = (elementAny.y2 as number) + dy;
      } else if (element.type === 'triangle') {
        // For triangles, move all three vertices
        const elementAny = element as Record<string, unknown>;
        if (elementAny.x1 !== undefined) updatedProps.x1 = (elementAny.x1 as number) + dx;
        if (elementAny.y1 !== undefined) updatedProps.y1 = (elementAny.y1 as number) + dy;
        if (elementAny.x2 !== undefined) updatedProps.x2 = (elementAny.x2 as number) + dx;
        if (elementAny.y2 !== undefined) updatedProps.y2 = (elementAny.y2 as number) + dy;
        if (elementAny.x3 !== undefined) updatedProps.x3 = (elementAny.x3 as number) + dx;
        if (elementAny.y3 !== undefined) updatedProps.y3 = (elementAny.y3 as number) + dy;
      } else {
        // rect, text: use x/y
        if (element.x !== undefined) updatedProps.x = element.x + dx;
        if (element.y !== undefined) updatedProps.y = element.y + dy;
      }
    }

    return {
      success: true,
      elementId,
      element: {
        id: elementId,
        type: element.type,
        props: updatedProps,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `移动元素失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** Semantic scale → factor mapping for scaleElement */
const SEMANTIC_SCALE_MAP: Record<string, number> = {
  '大一点': 1.2,
  '大一些': 1.2,
  '更大': 1.5,
  '小一点': 0.8,
  '小一些': 0.8,
  '更小': 0.5,
  '两倍': 2.0,
  '两倍大': 2.0,
  '一半': 0.5,
  '一半大': 0.5,
};

/**
 * Scale an element on the canvas.
 *
 * Supports two modes:
 * 1. Exact: provide a numeric scale factor (1.2 = 20% larger, 0.8 = 20% smaller)
 * 2. Semantic: provide a Chinese phrase like "大一点" (a bit bigger → 1.2),
 *    "小一点" (a bit smaller → 0.8), "两倍" (double → 2.0), "一半" (half → 0.5)
 *
 * For circles: scales r.
 * For rects: scales width and height.
 * For ellipses: scales rx and ry.
 * For text: scales fontSize.
 * For lines: scales stroke endpoints relative to center.
 * For triangles: scales vertices relative to center.
 *
 * @param context - Current canvas context
 * @param params - Scale parameters
 * @param params.id - Optional element ID (uses selected element if omitted)
 * @param params.scale - Numeric scale factor
 * @param params.semantic - Semantic scale string
 * @returns ToolResult with the updated element data
 */
export function scaleElement(
  context: CanvasContext,
  params: { id?: string; scale?: number; semantic?: string },
): ToolResult {
  try {
    const result = resolveElement(context, params);
    if ('success' in result && !result.success) {
      return result as ToolResult;
    }

    const { element, elementId } = result as { element: CanvasContext['elements'][number]; elementId: string };

    // Determine scale factor
    let scaleFactor: number | undefined;

    if (params.semantic) {
      scaleFactor = SEMANTIC_SCALE_MAP[params.semantic];
      if (scaleFactor === undefined) {
        return {
          success: false,
          error: `未知的缩放语义 "${params.semantic}"，支持：大一点、小一点、两倍、一半`,
        };
      }
    } else if (params.scale !== undefined) {
      scaleFactor = params.scale;
    }

    if (scaleFactor === undefined) {
      return {
        success: false,
        error: '请指定缩放比例或语义缩放',
      };
    }

    if (scaleFactor <= 0) {
      return {
        success: false,
        error: '缩放比例必须大于0',
      };
    }

    // Apply scaling based on element type
    const updatedProps: Record<string, unknown> = { ...element };
    delete updatedProps.id;

    switch (element.type) {
      case 'circle':
        // Scale radius
        if (element.r !== undefined) {
          updatedProps.r = element.r * scaleFactor;
        }
        break;

      case 'rect':
        // Scale width and height around center
        if (element.width !== undefined && element.height !== undefined && element.x !== undefined && element.y !== undefined) {
          const newWidth = element.width * scaleFactor;
          const newHeight = element.height * scaleFactor;
          // Keep center the same: adjust x/y so center stays put
          updatedProps.width = newWidth;
          updatedProps.height = newHeight;
          updatedProps.x = element.x + (element.width - newWidth) / 2;
          updatedProps.y = element.y + (element.height - newHeight) / 2;
        }
        break;

      case 'ellipse':
        // Scale rx and ry around center
        {
          const elementAny = element as Record<string, unknown>;
          if (elementAny.rx !== undefined && elementAny.ry !== undefined) {
            updatedProps.rx = (elementAny.rx as number) * scaleFactor;
            updatedProps.ry = (elementAny.ry as number) * scaleFactor;
          }
        }
        break;

      case 'text':
        // Scale fontSize
        {
          const elementAny = element as Record<string, unknown>;
          if (elementAny.fontSize !== undefined) {
            updatedProps.fontSize = (elementAny.fontSize as number) * scaleFactor;
          }
        }
        break;

      case 'line':
        // Scale line length around midpoint
        {
          const elementAny = element as Record<string, unknown>;
          const x1 = elementAny.x1 as number | undefined;
          const y1 = elementAny.y1 as number | undefined;
          const x2 = elementAny.x2 as number | undefined;
          const y2 = elementAny.y2 as number | undefined;
          if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            updatedProps.x1 = midX + (x1 - midX) * scaleFactor;
            updatedProps.y1 = midY + (y1 - midY) * scaleFactor;
            updatedProps.x2 = midX + (x2 - midX) * scaleFactor;
            updatedProps.y2 = midY + (y2 - midY) * scaleFactor;
          }
        }
        break;

      case 'triangle':
        // Scale vertices around centroid
        {
          const elementAny = element as Record<string, unknown>;
          const x1 = elementAny.x1 as number | undefined;
          const y1 = elementAny.y1 as number | undefined;
          const x2 = elementAny.x2 as number | undefined;
          const y2 = elementAny.y2 as number | undefined;
          const x3 = elementAny.x3 as number | undefined;
          const y3 = elementAny.y3 as number | undefined;
          if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined && x3 !== undefined && y3 !== undefined) {
            const cx = (x1 + x2 + x3) / 3;
            const cy = (y1 + y2 + y3) / 3;
            updatedProps.x1 = cx + (x1 - cx) * scaleFactor;
            updatedProps.y1 = cy + (y1 - cy) * scaleFactor;
            updatedProps.x2 = cx + (x2 - cx) * scaleFactor;
            updatedProps.y2 = cy + (y2 - cy) * scaleFactor;
            updatedProps.x3 = cx + (x3 - cx) * scaleFactor;
            updatedProps.y3 = cy + (y3 - cy) * scaleFactor;
          }
        }
        break;

      default:
        return {
          success: false,
          error: `不支持的元素类型 "${element.type}" 的缩放操作`,
        };
    }

    return {
      success: true,
      elementId,
      element: {
        id: elementId,
        type: element.type,
        props: updatedProps,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `缩放元素失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/** Default offset for duplicate in pixels */
const DEFAULT_DUPLICATE_OFFSET = 30;

/**
 * Duplicate an element on the canvas.
 *
 * Creates a copy of the element with a new ID, offset by dx/dy pixels
 * (default offset: 30px right and 30px down).
 *
 * @param context - Current canvas context
 * @param params - Duplicate parameters
 * @param params.id - Optional element ID (uses selected element if omitted)
 * @param params.dx - Horizontal offset for the duplicate (default: 30)
 * @param params.dy - Vertical offset for the duplicate (default: 30)
 * @returns ToolResult with the new duplicated element data
 */
export function duplicateElement(
  context: CanvasContext,
  params: { id?: string; dx?: number; dy?: number },
): ToolResult {
  try {
    const result = resolveElement(context, params);
    if ('success' in result && !result.success) {
      return result as ToolResult;
    }

    const { element, elementId: _originalId } = result as { element: CanvasContext['elements'][number]; elementId: string };

    const dx = params.dx ?? DEFAULT_DUPLICATE_OFFSET;
    const dy = params.dy ?? DEFAULT_DUPLICATE_OFFSET;

    // Create a new element with the same type, offset position, and new ID
    const newId = generateId(element.type);

    // Copy all props and offset position
    const newProps: Record<string, unknown> = { ...element };

    // Remove the old id from props (it's not a real prop, but may be present)
    delete newProps.id;

    // Offset position based on element type
    if (element.type === 'circle' || element.type === 'ellipse') {
      if (element.cx !== undefined) newProps.cx = element.cx + dx;
      if (element.cy !== undefined) newProps.cy = element.cy + dy;
    } else if (element.type === 'line') {
      const elementAny = element as Record<string, unknown>;
      if (elementAny.x1 !== undefined) newProps.x1 = (elementAny.x1 as number) + dx;
      if (elementAny.y1 !== undefined) newProps.y1 = (elementAny.y1 as number) + dy;
      if (elementAny.x2 !== undefined) newProps.x2 = (elementAny.x2 as number) + dx;
      if (elementAny.y2 !== undefined) newProps.y2 = (elementAny.y2 as number) + dy;
    } else if (element.type === 'triangle') {
      const elementAny = element as Record<string, unknown>;
      if (elementAny.x1 !== undefined) newProps.x1 = (elementAny.x1 as number) + dx;
      if (elementAny.y1 !== undefined) newProps.y1 = (elementAny.y1 as number) + dy;
      if (elementAny.x2 !== undefined) newProps.x2 = (elementAny.x2 as number) + dx;
      if (elementAny.y2 !== undefined) newProps.y2 = (elementAny.y2 as number) + dy;
      if (elementAny.x3 !== undefined) newProps.x3 = (elementAny.x3 as number) + dx;
      if (elementAny.y3 !== undefined) newProps.y3 = (elementAny.y3 as number) + dy;
    } else {
      // rect, text: use x/y
      if (element.x !== undefined) newProps.x = element.x + dx;
      if (element.y !== undefined) newProps.y = element.y + dy;
    }

    return {
      success: true,
      elementId: newId,
      element: {
        id: newId,
        type: element.type,
        props: newProps,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `复制元素失败: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
