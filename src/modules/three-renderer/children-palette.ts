/**
 * Bright, kid-friendly color palette for children's sketchbook drawing.
 * LLM should pick from this list; post-processing remaps dark/muddy colors.
 */

export const CHILDREN_PALETTE = [
  '#FFD93D', // 阳光黄
  '#FF6B6B', // 珊瑚红
  '#FF9F43', // 活力橙
  '#4ECDC4', // 青绿
  '#74B9FF', // 天蓝
  '#A29BFE', // 薰衣草紫
  '#FD79A8', // 糖果粉
  '#55E6C1', // 薄荷绿
  '#FFEAA7', // 奶油黄
  '#FAB1A0', // 蜜桃色
  '#00CEC9', // 湖水蓝
  '#E17055', // 柿子橙
] as const;

export function formatPaletteForPrompt(): string {
  return `## 儿童简笔画配色（必须使用，禁止暗色）
从以下 **12 种鲜艳浅色** 中选择，禁止 #000/#333/#666/#8B4513 等深色/褐色：
${CHILDREN_PALETTE.map((c) => `- ${c}`).join('\n')}
- 动物毛发可用 #FFD93D、#FF9F43、#FAB1A0
- 眼睛鼻子可用 #FF6B6B、#E17055
- 天空/水元素可用 #74B9FF、#4ECDC4
- 植物可用 #55E6C1、#FFD93D`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

/** Remap dark or missing colors to the nearest kid-friendly palette color. */
export function normalizeChildColor(color: string | undefined, fallbackIndex = 0): string {
  if (!color || color.toLowerCase() === '#ffffff' || color.toLowerCase() === '#fff') {
    return CHILDREN_PALETTE[fallbackIndex % CHILDREN_PALETTE.length];
  }

  const rgb = hexToRgb(color);
  if (!rgb) return CHILDREN_PALETTE[fallbackIndex % CHILDREN_PALETTE.length];

  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  if (lum < 0.35) {
    let best: string = CHILDREN_PALETTE[0];
    let bestDist = Infinity;
    for (const hex of CHILDREN_PALETTE) {
      const p = hexToRgb(hex)!;
      const d = colorDistance(rgb, p);
      if (d < bestDist) {
        bestDist = d;
        best = hex;
      }
    }
    return best;
  }

  return color.startsWith('#') ? color : `#${color}`;
}

/** Apply palette normalization to all primitives in a step. */
export function normalizePrimitivesColors<T extends { color?: string }>(
  primitives: T[],
): T[] {
  return primitives.map((p, i) => ({
    ...p,
    color: normalizeChildColor(p.color, i),
  }));
}
