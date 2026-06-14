/**
 * Shared LLM request timeout (client + BFF must stay in sync).
 * Complex tool calls on third-party APIs (e.g. Xunfei) can take 60s+.
 */
export const LLM_CONNECT_TIMEOUT_MS = 30_000;
export const LLM_REQUEST_TIMEOUT_MS = 120_000;
