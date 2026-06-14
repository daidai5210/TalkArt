// api/llm.ts
// BFF (Backend-For-Frontend) API Route for LLM proxy
// Protects API keys from being exposed to the browser

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildDrawingSystemPrompt } from '../src/modules/ai-agent/drawing-system-prompt';

// ---------- Types ----------

interface CanvasContext {
  width: number;
  height: number;
  /** @deprecated full elements array — prefer element_count */
  elements?: unknown[];
  element_count?: number;
  element_types?: string[];
  selected_element?: unknown | null;
  selected_id?: string | null;
  completed_steps?: Array<{
    stepIndex: number;
    label: string;
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
    summary: string;
  }>;
  plan_steps?: Array<{ index: number; label: string; description: string }>;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

interface FunctionCall {
  name: string;
  arguments: string;
}

interface LLMRequest {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  tool_choice?: string;
  canvas_context?: CanvasContext;
}

// ---------- System Prompt ----------

function buildSystemPrompt(canvasContext?: CanvasContext): string {
  const width = canvasContext?.width ?? 800;
  const height = canvasContext?.height ?? 600;
  const selectedElement = canvasContext?.selected_id ?? '无';
  const elementCount =
    canvasContext?.element_count ?? canvasContext?.elements?.length ?? 0;
  const typeSummary = canvasContext?.element_types?.length
    ? `（${canvasContext.element_types.join('、')}）`
    : '';
  const elementsSummary =
    elementCount > 0 ? `${elementCount} 个元素${typeSummary}` : '空画布';

  const completedStepsSummary =
    canvasContext?.completed_steps?.length
      ? canvasContext.completed_steps
          .map(
            (s) =>
              `步骤${s.stepIndex + 1}「${s.label}」: ${s.summary}；包围盒(${Math.round(s.bounds.minX)},${Math.round(s.bounds.minY)})-(${Math.round(s.bounds.maxX)},${Math.round(s.bounds.maxY)})`,
          )
          .join('\n')
      : undefined;

  return buildDrawingSystemPrompt({
    width,
    height,
    elementCount,
    elementsSummary: `选中:${selectedElement}；${elementsSummary}`,
    completedStepsSummary,
  });
}

// ---------- Provider Config ----------

interface ProviderConfig {
  url: string;
  apiKey: string;
  model: string;
}

function getProviderConfig(): ProviderConfig {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (provider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    return {
      url: 'https://api.deepseek.com/v1/chat/completions',
      apiKey,
      model: model === 'gpt-4o-mini' ? 'deepseek-chat' : model,
    };
  }

  // Default: OpenAI
  const apiKey = process.env.OPENAI_API_KEY || '';
  return {
    url: 'https://api.openai.com/v1/chat/completions',
    apiKey,
    model,
  };
}

// ---------- Timeout Utility ----------

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ---------- Error Responses ----------

function sendError(
  res: VercelResponse,
  status: number,
  error: string,
  message: string
): void {
  res.status(status).json({ error, message });
}

// ---------- Main Handler ----------

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // 1. Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendError(res, 405, 'method_not_allowed', '仅支持 POST 请求');
    return;
  }

  // 2. Validate request body
  const { messages, tools, tool_choice, canvas_context } = req.body as LLMRequest;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    sendError(res, 400, 'invalid_request', 'messages 不能为空');
    return;
  }

  // 3. Get provider config and check API key
  const config = getProviderConfig();

  if (!config.apiKey) {
    sendError(res, 401, 'api_key_missing', 'LLM API Key 未配置，请在 Vercel 环境变量中设置');
    return;
  }

  // 4. Build the full messages array with injected system prompt
  const systemPrompt = buildSystemPrompt(canvas_context);
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    // Remove any existing system messages from the client to prevent override
    ...messages.filter((m) => m.role !== 'system'),
  ];

  // 5. Build the request payload for the LLM API
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: fullMessages,
    max_tokens: 4096,
  };

  if (tools && Array.isArray(tools) && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = tool_choice || 'auto';
  }

  // 6. Forward to LLM API with timeout
  try {
    const response = await withTimeout(
      fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(payload),
      }),
      90_000 // 90 seconds — complex tool calls need more time
    );

    // 7. Handle LLM API errors
    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error(
        `LLM API error: status=${response.status}, body=${errorBody}`
      );

      if (response.status === 401 || response.status === 403) {
        sendError(res, 500, 'llm_error', 'AI 服务认证失败，请检查 API Key 配置');
        return;
      }

      if (response.status === 429) {
        sendError(res, 500, 'llm_error', 'AI 服务请求过多，请稍后重试');
        return;
      }

      sendError(res, 500, 'llm_error', 'AI 服务暂时不可用，请稍后重试');
      return;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const choices = data.choices as Array<Record<string, unknown>> | undefined;
    const choice = choices?.[0];
    const message = choice?.message as Record<string, unknown> | undefined;

    if (!message) {
      sendError(res, 500, 'llm_error', 'AI 服务返回了无效的响应');
      return;
    }

    // 8. Determine response type
    // Check for function_call (OpenAI legacy) or tool_calls (newer API)
    const rawFunctionCall = message.function_call as FunctionCall | null | undefined;
    const functionCall: FunctionCall | null = rawFunctionCall ?? null;
    const rawToolCalls = message.tool_calls as Array<Record<string, unknown>> | null | undefined;
    const toolCalls = rawToolCalls ?? null;

    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
      const parsedCalls = toolCalls.map((toolCall) => {
        const toolFunction = toolCall.function as {
          name: string;
          arguments: string;
        };
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(toolFunction.arguments);
        } catch {
          args = { _raw: toolFunction.arguments };
        }
        return { name: toolFunction.name, arguments: args };
      });

      if (parsedCalls.length === 1) {
        res.status(200).json({
          type: 'function_call',
          function: parsedCalls[0],
        });
        return;
      }

      res.status(200).json({
        type: 'tool_calls',
        tool_calls: parsedCalls,
      });
      return;
    }

    if (functionCall) {
      let args: Record<string, unknown>;
      try {
        args = JSON.parse(functionCall.arguments);
      } catch {
        args = { _raw: functionCall.arguments };
      }

      res.status(200).json({
        type: 'function_call',
        function: {
          name: functionCall.name,
          arguments: args,
        },
      });
      return;
    }

    // No function call — this is a confirmation/conversational response
    res.status(200).json({
      type: 'confirmation',
      content: message.content || '',
    });
  } catch (err: unknown) {
    // 9. Handle timeout and other fetch errors
    if (err instanceof Error && err.message.includes('timed out')) {
      sendError(res, 504, 'timeout', 'AI 响应超时，请重试');
      return;
    }

    console.error('LLM proxy error:', err);
    sendError(res, 500, 'llm_error', 'AI 服务暂时不可用，请稍后重试');
  }
}
