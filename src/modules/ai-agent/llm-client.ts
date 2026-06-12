/**
 * @module ai-agent/llm-client
 * Client for the TalkArt BFF API route (/api/llm).
 *
 * This module sends conversation messages, tool definitions, and canvas
 * context to the backend, which proxies the request to the configured LLM
 * provider (OpenAI / DeepSeek). The BFF handles API key security, system
 * prompt injection, and response normalization.
 *
 * The client handles:
 * - Network errors and timeouts (see llm-config)
 * - Non-200 HTTP responses from the BFF
 * - Graceful fallback to a Chinese error message on failure
 */

import type { Message, LLMResponse } from './types';
import type { CanvasContext } from '../drawing-tools/types';
import { LLM_REQUEST_TIMEOUT_MS } from './llm-config';

/** Fallback error message returned when the LLM service is unavailable. */
const SERVICE_UNAVAILABLE_MSG = '抱歉，AI 服务暂时不可用，请稍后重试。';

/**
 * Send conversation messages to the LLM via the BFF API route.
 *
 * The BFF route at `/api/llm` handles:
 * - Injecting the system prompt with canvas context
 * - Forwarding to the configured LLM provider
 * - Normalizing the response into `confirmation` or `function_call` types
 *
 * @param messages - Conversation history (user/assistant messages)
 * @param tools - OpenAI-compatible tool definitions for function calling
 * @param canvasContext - Current canvas state for context injection
 * @returns A structured LLM response (confirmation or function_call)
 *
 * @example
 * ```ts
 * const response = await sendToLLM(
 *   [{ role: 'user', content: '画一个红色的圆' }],
 *   TOOL_DEFINITIONS,
 *   { width: 800, height: 600, elements: [], selectedId: null },
 * );
 *
 * if (response.type === 'confirmation') {
 *   console.log('AI says:', response.content);
 * } else {
 *   console.log('Calling tool:', response.function?.name);
 * }
 * ```
 */
export async function sendToLLM(
  messages: Message[],
  tools: any[],
  canvasContext: CanvasContext,
): Promise<LLMResponse> {
  // Build the request payload matching the BFF's LLMRequest interface
  const payload = {
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

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    // Handle non-200 responses from the BFF
    if (!response.ok) {
      let errorMessage = SERVICE_UNAVAILABLE_MSG;

      try {
        const errorBody = await response.json();
        // The BFF returns structured errors: { error, message }
        if (errorBody?.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        // Failed to parse error body — use the default message
      }

      console.error(
        `[LLM Client] BFF returned status ${response.status}: ${errorMessage}`,
      );

      return {
        type: 'confirmation',
        content: errorMessage,
      };
    }

    // Parse the successful response
    const data: LLMResponse = await response.json();
    return data;
  } catch (error: unknown) {
    // Handle timeout (AbortError) and network errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('[LLM Client] Request timed out');
      return {
        type: 'confirmation',
        content: '抱歉，AI 响应超时，请重试。',
      };
    }

    if (error instanceof TypeError) {
      // TypeError from fetch typically means a network error
      console.error('[LLM Client] Network error:', error.message);
      return {
        type: 'confirmation',
        content: SERVICE_UNAVAILABLE_MSG,
      };
    }

    // Unexpected error — still return gracefully
    console.error('[LLM Client] Unexpected error:', error);
    return {
      type: 'confirmation',
      content: SERVICE_UNAVAILABLE_MSG,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
