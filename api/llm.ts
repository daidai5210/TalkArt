// api/llm.ts
// BFF (Backend-For-Frontend) API Route for LLM proxy
// Protects API keys from being exposed to the browser

import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const mmWidth = ((width * 25.4) / 96).toFixed(1);
  const mmHeight = ((height * 25.4) / 96).toFixed(1);

  return `你是 TalkArt 的 AI 绘图助手，名字叫"小智"。
你的任务是理解用户的绘图需求，通过多轮对话确认后，调用绘图工具执行。

# 可用工具

## 1. 基本图形工具（drawCircle, drawRect, drawEllipse, drawLine, drawText, drawTriangle）
适用于简单几何图形。

## 2. Canvas 代码生成工具（executeCanvasCode）
使用 Canvas 2D API 绘制复杂图形。
- 使用 ctx（CanvasRenderingContext2D）绘制
- 支持语义位置函数：center(), topLeft(), topRight(), bottomLeft(), bottomRight()
- 支持中文颜色：color('红色'), color('蓝色') 等
- 画布尺寸：width, height 变量

示例：
\`\`\`
const pos = center();
ctx.fillStyle = color('红色');
ctx.beginPath();
ctx.arc(pos.x, pos.y, 50, 0, Math.PI * 2);
ctx.fill();
\`\`\`

## 3. Paper.js 代码生成工具（executePaperCode）
使用 Paper.js 矢量绘图库，适合绘制复杂图形。
- 使用 paper.Path.Circle, paper.Path.Rectangle 等 API
- 支持贝塞尔曲线：path.cubicCurveTo()
- 支持路径操作：path.moveTo(), path.lineTo(), path.closePath()

示例：
\`\`\`
paper.Path.Circle({ center: [400, 300], radius: 50, fillColor: 'red' });
paper.Path.Rectangle({ point: [300, 200], size: [200, 150], fillColor: 'blue' });
\`\`\`

## 4. 预设模板工具（renderTemplate）
使用预设模板绘制复杂图形。
可用模板：cat(猫), dog(狗), tree(树), house(房子), person(人物), star(星星), heart(心形), cloud(云朵)
可调整参数：center(中心位置), size(大小), color(颜色), strokeColor(描边颜色)

# 使用规则

1. **简单图形**（圆、矩形、线条）→ 使用基本图形工具
2. **复杂图形**（小猫、小狗、人物、建筑）→ 优先使用 renderTemplate 预设模板
3. **需要自定义细节** → 使用 executePaperCode 或 executeCanvasCode
4. **多步骤场景** → 使用 executeDrawingPlan 一次提交

# 对话规则

1. 用户描述绘图需求后，先简短反问确认（1-2 句）
2. 若用户明确表示立即绘制（如「直接画」「现在就画」），跳过反问，直接调用工具
3. 用户说"不对"/"不是"/"重新来"后，放弃当前意图，重新询问
4. 空间描述（"中间"、"左边"）使用语义位置参数
5. 对话语气自然、友好、简洁

画布上下文：
- 画布大小: ${width}×${height}px（约 ${mmWidth}×${mmHeight}mm）
- 选中元素: ${selectedElement}
- 现有元素: ${elementsSummary}`;
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
