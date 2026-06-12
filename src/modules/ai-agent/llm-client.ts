/**
 * @module ai-agent/llm-client
 * Client for the TalkArt BFF API route (/api/llm).
 */

import type { Message, LLMResponse } from './types';
import type { CanvasContext } from '../drawing-tools/types';
import { LLM_REQUEST_TIMEOUT_MS } from './llm-config';

const SERVICE_UNAVAILABLE_MSG = '抱歉，AI 服务暂时不可用，请稍后重试。';
const TIMEOUT_MSG = '抱歉，AI 响应超时，请重试。';
const MAX_ATTEMPTS = 2;

function buildPayload(messages: Message[], tools: unknown[], canvasContext: CanvasContext) {
  return {
    messages,
    tools,
    tool_choice: 'auto',
    canvas_context: {
      width: canvasContext.width,
      height: canvasContext.height,
      element_count: canvasContext.elements.length,
      element_types: canvasContext.elements.map((el) => el.type),
      selected_id: canvasContext.selectedId,
    },
  };
}

async function fetchLLMOnce(
  messages: Message[],
  tools: unknown[],
  canvasContext: CanvasContext,
): Promise<LLMResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(messages, tools, canvasContext)),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = SERVICE_UNAVAILABLE_MSG;
      try {
        const errorBody = await response.json();
        if (errorBody?.message) errorMessage = errorBody.message;
      } catch {
        // ignore
      }
      console.error(`[LLM Client] BFF status ${response.status}: ${errorMessage}`);
      return {
        type: 'error',
        content: errorMessage,
        retryable: response.status === 504 || response.status >= 500,
      };
    }

    return (await response.json()) as LLMResponse;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('[LLM Client] Request timed out');
      return { type: 'error', content: TIMEOUT_MSG, retryable: true };
    }
    if (error instanceof TypeError) {
      console.error('[LLM Client] Network error:', error.message);
      return { type: 'error', content: SERVICE_UNAVAILABLE_MSG, retryable: true };
    }
    console.error('[LLM Client] Unexpected error:', error);
    return { type: 'error', content: SERVICE_UNAVAILABLE_MSG, retryable: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendToLLM(
  messages: Message[],
  tools: unknown[],
  canvasContext: CanvasContext,
): Promise<LLMResponse> {
  let last: LLMResponse = { type: 'error', content: SERVICE_UNAVAILABLE_MSG };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    last = await fetchLLMOnce(messages, tools, canvasContext);
    if (last.type !== 'error' || !last.retryable || attempt === MAX_ATTEMPTS - 1) {
      return last;
    }
    console.warn(`[LLM Client] Retry attempt ${attempt + 2}/${MAX_ATTEMPTS}`);
  }

  return last;
}
