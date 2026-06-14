/**
 * OpenAI-compatible LLM endpoint configuration from environment variables.
 *
 * Primary (recommended):
 *   LLM_BASE_URL  — e.g. https://api.openai.com/v1
 *   LLM_API_KEY
 *   LLM_MODEL
 *
 * Legacy fallbacks:
 *   LLM_PROVIDER=openai|deepseek → default base URL when LLM_BASE_URL unset
 *   OPENAI_API_KEY / DEEPSEEK_API_KEY when LLM_API_KEY unset
 */

export interface LlmEnvConfig {
  baseUrl: string;
  chatCompletionsUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
};

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  deepseek: 'deepseek-chat',
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Normalize base URL or full chat/completions URL from env. */
export function resolveLlmBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit =
    env.LLM_BASE_URL?.trim() ||
    env.OPENAI_BASE_URL?.trim() ||
    env.OPENAI_API_BASE?.trim();

  if (explicit) {
    const normalized = trimTrailingSlash(explicit);
    if (normalized.endsWith('/chat/completions')) {
      return normalized.slice(0, -'/chat/completions'.length);
    }
    return normalized;
  }

  const provider = (env.LLM_PROVIDER || 'openai').toLowerCase();
  return DEFAULT_BASE_URLS[provider] ?? DEFAULT_BASE_URLS.openai;
}

export function resolveChatCompletionsUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit =
    env.LLM_BASE_URL?.trim() ||
    env.OPENAI_BASE_URL?.trim() ||
    env.OPENAI_API_BASE?.trim();

  if (explicit) {
    const normalized = trimTrailingSlash(explicit);
    if (normalized.endsWith('/chat/completions')) {
      return normalized;
    }
    return `${normalized}/chat/completions`;
  }

  return `${resolveLlmBaseUrl(env)}/chat/completions`;
}

export function resolveLlmApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const direct = env.LLM_API_KEY?.trim();
  if (direct) return direct;

  const provider = (env.LLM_PROVIDER || 'openai').toLowerCase();
  if (provider === 'deepseek') {
    return env.DEEPSEEK_API_KEY?.trim() || env.OPENAI_API_KEY?.trim() || '';
  }
  return env.OPENAI_API_KEY?.trim() || env.DEEPSEEK_API_KEY?.trim() || '';
}

export function resolveLlmModel(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.LLM_MODEL?.trim();
  if (explicit) return explicit;

  const provider = (env.LLM_PROVIDER || 'openai').toLowerCase();
  return DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.openai;
}

export function resolveLlmEnvConfig(env: NodeJS.ProcessEnv = process.env): LlmEnvConfig {
  const baseUrl = resolveLlmBaseUrl(env);
  return {
    baseUrl,
    chatCompletionsUrl: resolveChatCompletionsUrl(env),
    apiKey: resolveLlmApiKey(env),
    model: resolveLlmModel(env),
  };
}
