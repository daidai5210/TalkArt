/**
 * Shared LLM request timeout (client + BFF must stay in sync).
 * Complex executeDrawingPlan tool calls can exceed 15s with full tool schemas.
 */
export const LLM_REQUEST_TIMEOUT_MS = 90_000;
