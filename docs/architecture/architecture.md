# 系统架构：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp
> **路线**: A-L（轻量 MVP，无数据库）
> **上游研究**: `docs/product-research/proposal-20260611-talkart-tool/07-technical-feasibility.md`

---

## 一、架构总览

```
┌──────────────────────────────────────────────────────────┐
│                    用户浏览器 (Browser)                     │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────────┐ │
│  │ 语音输入  │  │  ASR     │  │   TalkArt App (React)   │ │
│  │(麦克风)   │→│(Web      │→│                          │ │
│  │          │  │ Speech)  │  │  ┌───────────────────┐  │ │
│  └──────────┘  └──────────┘  │  │   Voice Manager   │  │ │
│                               │  │  (唤醒词+采集+ASR) │  │ │
│  ┌──────────┐                 │  └────────┬──────────┘  │ │
│  │ 文本兜底  │                 │           │              │ │
│  │(input框) │                 │  ┌────────▼──────────┐  │ │
│  └──────────┘                 │  │   AI Agent Store   │  │ │
│                               │  │  (对话状态+确认)    │  │ │
│                               │  └────────┬──────────┘  │ │
│                               │           │              │ │
│                               │  ┌────────▼──────────┐  │ │
│                               │  │  Drawing Tools     │  │ │
│                               │  │  (15个工具函数)     │  │ │
│                               │  └────────┬──────────┘  │ │
│                               │           │              │ │
│                               │  ┌────────▼──────────┐  │ │
│                               │  │  SVG Renderer      │  │ │
│                               │  │  (React SVG +      │  │ │
│                               │  │   Zustand Store)   │  │ │
│                               │  └───────────────────┘  │ │
│                               └─────────────────────────┘ │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│                    Vercel Platform                         │
│                                                            │
│  ┌────────────────────┐   ┌────────────────────────────┐ │
│  │   Static Hosting   │   │   API Route (/api/llm)      │ │
│  │   (React SPA)      │   │   BFF 代理 LLM 请求         │ │
│  └────────────────────┘   │   保护 API Key              │ │
│                            └──────────┬─────────────────┘ │
└───────────────────────────────────────┼───────────────────┘
                                        │ HTTPS
                                        ▼
                              ┌──────────────────┐
                              │   OpenAI API     │
                              │ / DeepSeek API   │
                              └──────────────────┘
```

---

## 二、模块划分

| 模块 | 职责 | 技术 | 依赖 |
|---|---|---|---|
| **voice-input** | 麦克风采集、唤醒词检测、ASR 转文字 | Web Speech API | — |
| **ai-agent** | LLM 对话管理、意图分析、确认对话、Function Calling | OpenAI/DeepSeek SDK | voice-input, drawing-tools |
| **drawing-tools** | 15 个工具函数、语义→坐标映射 | TypeScript | — |
| **svg-renderer** | SVG 元素渲染、选中高亮、画布状态管理 | React + Zustand | drawing-tools |
| **export** | SVG/PNG 导出 | File API + Canvas API | svg-renderer |
| **api-route** | BFF 代理 LLM API、保护 API Key | Vercel API Route | — |

---

## 三、数据流

### 3.1 核心数据流

```
[麦克风]
  ↓ audio stream
[Web Speech API]
  ↓ text
[Voice Manager] → displayText (UI 展示)
  ↓ userMessage
[AI Agent Store] → addToHistory()
  ↓ conversation[]
[BFF /api/llm] → OpenAI/DeepSeek
  ↓ LLM response (confirmation text OR function_call)
[AI Agent Store]
  ├── confirmation → displayConfirmationText (UI 反问)
  └── function_call → [Drawing Tools] → SVG Element → [Zustand Store] → React SVG re-render
```

### 3.2 状态管理

```
Zustand Store: {
  elements: SVGElement[]          // 画布上所有元素
  selectedId: string | null       // 当前选中元素
  history: Snapshot[]             // 操作历史（撤销/重做）
  historyIndex: number
  conversation: Message[]         // AI Agent 对话历史
  agentState: 'idle' | 'listening' | 'confirming' | 'executing'
}
```

---

## 四、时序图

### 4.1 完整交互时序

```
用户         浏览器              BFF              LLM API
  │            │                  │                 │
  │ "小智小智"  │                  │                 │
  ├───────────→│                  │                 │
  │            │ 检测唤醒词        │                 │
  │            │ 🎤开始监听        │                 │
  │ "画一个圆"  │                  │                 │
  ├───────────→│                  │                 │
  │            │ ASR → "画一个圆"   │                 │
  │            ├─────────────────→│                 │
  │            │  POST /api/llm   ├────────────────→│
  │            │                  │  tool_choice=   │
  │            │                  │  "auto"         │
  │            │                  │←────────────────┤
  │            │                  │  content:       │
  │            │                  │  "你想画一个圆，  │
  │            │                  │   放中间对吗？"   │
  │            │←─────────────────┤                 │
  │  "你想画一个圆，放中间对吗？"    │                 │
  │←───────────┤                  │                 │
  │ "对，开始吧" │                  │                 │
  ├───────────→│                  │                 │
  │            │ 检测"开始吧"       │                 │
  │            ├─────────────────→│                 │
  │            │  POST /api/llm   ├────────────────→│
  │            │  + 对话历史       │  function_call: │
  │            │                  │  drawCircle(     │
  │            │                  │   cx:400,       │
  │            │                  │   cy:300,       │
  │            │                  │   r:100)        │
  │            │←─────────────────┤                 │
  │            │ execute drawCircle│                 │
  │            │ SVG render ✅     │                 │
  │  🔵 出现    │                  │                 │
  │←───────────┤                  │                 │
```

---

## 五、ADP（架构决策记录）

| ID | 决策 | 理由 |
|---|---|---|
| ADR-1 | 纯前端 + BFF 代理 | 无后端服务，最小化运维 |
| ADR-2 | React + 原生 SVG | 声明式匹配 LLM 输出，零额外依赖 |
| ADR-3 | Zustand 状态管理 | 轻量，适合画布元素管理 |
| ADR-4 | Vercel 部署 | 零配置，全球 CDN |
| ADR-5 | 无数据库 | 画布状态仅存浏览器内存 |
| ADR-6 | 工具函数前端执行 | 零延迟，BFF 只代理 LLM API |
| ADR-7 | 语义→坐标映射在工具侧 | LLM 输出语义参数，工具函数计算精确坐标 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
