import { describe, it, expect } from 'vitest';
import {
  isDrawingRequest,
  selectToolsForRequest,
  LEAFER_TOOLS,
  PLANNING_TOOLS,
  RENDER_TOOLS,
} from '../llm-tool-selector';

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
    expect(RENDER_TOOLS[0].function.name).toBe('renderLeaferStep');
  });
});
