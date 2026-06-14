/**
 * LLM upstream fetch with extended connect/body timeouts.
 * Node's default fetch (undici) uses connectTimeout=10s which fails on slow networks.
 */

import { Agent, fetch as undiciFetch } from 'undici';
import { LLM_CONNECT_TIMEOUT_MS, LLM_REQUEST_TIMEOUT_MS } from './llm-config';

const llmDispatcher = new Agent({
  connectTimeout: LLM_CONNECT_TIMEOUT_MS,
  headersTimeout: LLM_REQUEST_TIMEOUT_MS,
  bodyTimeout: LLM_REQUEST_TIMEOUT_MS,
});

export function isConnectTimeoutError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; cause?: { code?: string } };
  return (
    e.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    e.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    (err instanceof Error && err.message.includes('Connect Timeout'))
  );
}

export async function fetchLlmUpstream(
  url: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
): Promise<Response> {
  return undiciFetch(url, {
    method: init.method ?? 'GET',
    headers: init.headers,
    body: init.body,
    dispatcher: llmDispatcher,
  }) as unknown as Promise<Response>;
}
