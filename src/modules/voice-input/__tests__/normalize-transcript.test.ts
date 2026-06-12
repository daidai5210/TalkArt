import { describe, it, expect } from 'vitest';
import { normalizeVoiceTranscript } from '../normalize-transcript';

describe('normalizeVoiceTranscript', () => {
  it('collapses repeated ASR prefix and keeps last intent', () => {
    const raw =
      '帮我画一个二月五帮我画一个奥运五环，奥运五环后面是中国的国帮我画一个奥运五环，奥运五环后面是中国的国旗。现在帮我画一个奥运五环奥运五环后面是中国的国旗 现在直接就画';
    const result = normalizeVoiceTranscript(raw);
    expect(result.length).toBeLessThan(raw.length);
    expect(result).toContain('奥运五环');
    expect(result).toContain('国旗');
    expect(result).toContain('直接就画');
    expect(result).not.toContain('二月五');
  });

  it('returns short text unchanged', () => {
    expect(normalizeVoiceTranscript('画一个圆')).toBe('画一个圆');
  });
});
