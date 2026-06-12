import { describe, it, expect } from 'vitest';
import {
  isComplexDrawingRequest,
  selectToolsForRequest,
  COMPACT_DRAWING_TOOLS,
} from '../llm-tool-selector';

describe('llm-tool-selector', () => {
  it('detects Olympic rings + flag as complex', () => {
    expect(isComplexDrawingRequest('画奥运五环，后面是中国国旗，直接画')).toBe(true);
  });

  it('returns executeDrawingPlan-only for complex requests', () => {
    const all = [{ function: { name: 'drawCircle' } }, { function: { name: 'drawRect' } }];
    const selected = selectToolsForRequest(all, '奥运五环和国旗') as { function: { name: string } }[];
    expect(selected).toHaveLength(1);
    expect(selected[0].function.name).toBe('executeDrawingPlan');
  });

  it('keeps full tools for simple requests', () => {
    const all = [{ function: { name: 'a' } }, { function: { name: 'b' } }];
    expect(selectToolsForRequest(all, '画一个红色的圆')).toBe(all);
  });
});
