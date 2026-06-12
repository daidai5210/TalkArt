# API 设计：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp
> **说明**: 本项目无后端服务，仅有一个 BFF API Route

---

## 一、API 清单

| 端点 | 方法 | 用途 |
|---|---|---|
| `/api/llm` | POST | LLM 对话代理（BFF） |

---

## 二、`POST /api/llm`

### 请求

```typescript
// Request Body
{
  "messages": [
    { "role": "system", "content": "你是 TalkArt 的 AI 绘图助手..." },
    { "role": "user", "content": "画一个红色圆形在中间" },
    { "role": "assistant", "content": "你想画一个红色圆形，放在画布中间，对吗？" },
    { "role": "user", "content": "对，开始吧" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "drawCircle",
        "description": "在画布上画一个圆形...",
        "parameters": { /* JSON Schema */ }
      }
    }
    // ... 15 个工具定义
  ],
  "tool_choice": "auto",
  "canvas_context": {
    "width": 800,
    "height": 600,
    "selected_element": null,
    "elements": [
      { "id": "rect-1", "type": "rect", "x": 100, "y": 100, "width": 200, "height": 150, "fill": "blue" }
    ],
    "element_count": 1
  }
}
```

### 响应

```typescript
// 确认模式（无 function_call）
{
  "type": "confirmation",
  "content": "你想画一个红色圆形，放在画布中间，对吗？"
}

// 执行模式（有 function_call）
{
  "type": "function_call",
  "function": {
    "name": "drawCircle",
    "arguments": {
      "cx": 400,
      "cy": 300,
      "r": 100,
      "fill": "#FF0000"
    }
  }
}
```

---

## 三、System Prompt 设计

```
你是 TalkArt 的 AI 绘图助手，名字叫"小智"。
你的任务是理解用户的绘图需求，通过多轮对话确认后，调用绘图工具执行。

规则：
1. 用户描述绘图需求后，先反问确认，不要直接调用工具
2. 确认时简洁明了，1-2 句话
3. 用户说"开始吧"/"可以了"/"好的"/"行"等确认词后，立即调用对应工具
4. 用户说"不对"/"不是"/"重新来"后，放弃当前意图，重新询问
5. 模糊指令（"大一点"）基于画布上下文推断目标元素和参数
6. 空间描述（"中间"、"左边"、"右上角"）使用语义位置参数
7. 工具调用失败时，向用户说明原因并建议重试

画布上下文会在每次请求中提供。
```

---

## 四、错误响应

```typescript
// 400 - 请求错误
{ "error": "invalid_request", "message": "messages 不能为空" }

// 500 - LLM API 错误
{ "error": "llm_error", "message": "AI 服务暂时不可用，请稍后重试" }

// 504 - 超时
{ "error": "timeout", "message": "AI 响应超时，请重试" }
```

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
