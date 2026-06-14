import { describe, expect, it } from 'vitest';
import {
  resolveChatCompletionsUrl,
  resolveLlmApiKey,
  resolveLlmEnvConfig,
  resolveLlmModel,
} from '../llm-env-config';

describe('llm-env-config', () => {
  it('uses explicit LLM_BASE_URL + LLM_API_KEY + LLM_MODEL', () => {
    const cfg = resolveLlmEnvConfig({
      LLM_BASE_URL: 'https://custom.example/v1',
      LLM_API_KEY: 'sk-custom',
      LLM_MODEL: 'my-model',
    });
    expect(cfg.baseUrl).toBe('https://custom.example/v1');
    expect(cfg.chatCompletionsUrl).toBe('https://custom.example/v1/chat/completions');
    expect(cfg.apiKey).toBe('sk-custom');
    expect(cfg.model).toBe('my-model');
  });

  it('accepts full chat/completions URL in LLM_BASE_URL', () => {
    expect(
      resolveChatCompletionsUrl({
        LLM_BASE_URL: 'https://proxy.example/v1/chat/completions',
      }),
    ).toBe('https://proxy.example/v1/chat/completions');
  });

  it('falls back to deepseek defaults', () => {
    const cfg = resolveLlmEnvConfig({
      LLM_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'sk-ds',
    });
    expect(cfg.chatCompletionsUrl).toBe('https://api.deepseek.com/v1/chat/completions');
    expect(cfg.apiKey).toBe('sk-ds');
    expect(cfg.model).toBe('deepseek-chat');
  });

  it('respects LLM_MODEL over provider default', () => {
    expect(
      resolveLlmModel({
        LLM_PROVIDER: 'deepseek',
        LLM_MODEL: 'deepseek-v4-flash',
      }),
    ).toBe('deepseek-v4-flash');
  });
});
