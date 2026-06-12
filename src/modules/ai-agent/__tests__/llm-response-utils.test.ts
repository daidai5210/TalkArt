import { describe, it, expect } from 'vitest';
import { isLLMServiceError } from '../llm-response-utils';

describe('isLLMServiceError', () => {
  it('detects timeout message', () => {
    expect(isLLMServiceError('抱歉，AI 响应超时，请重试。')).toBe(true);
  });

  it('does not flag normal confirmation', () => {
    expect(isLLMServiceError('好的，我将在画布中央画奥运五环和中国国旗，可以吗？')).toBe(false);
  });
});
