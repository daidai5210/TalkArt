import { describe, it, expect } from 'vitest';
import {
  isDrawingRequest,
  selectToolsForRequest,
  LEAFER_TOOLS,
  PLANNING_TOOLS,
  RENDER_TOOLS,
} from '../llm-tool-selector';
import { THREE_DRAWING_TOOLS } from '../three-tool-definitions';

function countSchemaParams(node: unknown): number {
  if (!node || typeof node !== 'object') return 0;
  const o = node as Record<string, unknown>;
  let n = 0;
  if (o.properties && typeof o.properties === 'object') {
    const props = o.properties as Record<string, unknown>;
    n += Object.keys(props).length;
    for (const v of Object.values(props)) n += countSchemaParams(v);
  }
  if (o.items) n += countSchemaParams(o.items);
  return n;
}

describe('llm-tool-selector', () => {
  it('detects drawing intent', () => {
    expect(isDrawingRequest('画奥运五环，后面是中国国旗，直接画')).toBe(true);
    expect(isDrawingRequest('你好')).toBe(false);
  });

  it('returns Leafer tools for drawing requests', () => {
    const all = [{ function: { name: 'drawCircle' } }];
    const selected = selectToolsForRequest(all, '奥运五环和国旗');
    expect(selected).toEqual(LEAFER_TOOLS);
    expect(selected).toHaveLength(3);
  });

  it('exports planning and render tool subsets', () => {
    expect(PLANNING_TOOLS[0].function.name).toBe('planDrawingSteps');
    expect(RENDER_TOOLS[0].function.name).toBe('renderThreeStep');
  });

  it('keeps tool schema under Xunfei 100-param limit', () => {
    for (const tool of THREE_DRAWING_TOOLS) {
      const count = countSchemaParams(tool.function.parameters);
      expect(count).toBeLessThanOrEqual(100);
    }
    const allCount = THREE_DRAWING_TOOLS.reduce(
      (sum, t) => sum + countSchemaParams(t.function.parameters),
      0,
    );
    expect(allCount).toBeLessThanOrEqual(100);
    expect(LEAFER_TOOLS).toEqual(THREE_DRAWING_TOOLS);
  });
});
