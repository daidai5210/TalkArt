# 模块设计：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp

---

## 一、模块边界

```
src/
├── main.tsx                    # 入口
├── App.tsx                     # 应用壳
├── modules/
│   ├── voice-input/            # 语音输入模块
│   │   ├── VoiceManager.ts     # 麦克风管理 + 唤醒词检测
│   │   ├── WakeWordDetector.ts # 唤醒词匹配（"小zhi" 同音）
│   │   ├── ASREngine.ts        # Web Speech API 封装
│   │   └── EndPhraseDetector.ts# 结束语检测（"开始吧"/"可以了"）
│   │
│   ├── ai-agent/               # AI Agent 模块
│   │   ├── AgentStore.ts       # 对话状态管理（Zustand slice）
│   │   ├── ConversationManager.ts # 多轮对话管理
│   │   ├── ToolDispatcher.ts   # Function Calling 调度
│   │   └── llm-client.ts       # BFF API 调用封装
│   │
│   ├── drawing-tools/          # 绘图工具函数库
│   │   ├── index.ts            # 工具注册 + 导出
│   │   ├── tool-definitions.ts # 15 个工具的 JSON Schema 定义
│   │   ├── basic-shapes.ts     # drawRect/Circle/Ellipse/Line/Text/Triangle
│   │   ├── element-ops.ts      # select/update/delete/move/scale/duplicate
│   │   ├── canvas-ops.ts       # clearCanvas/undoAction/exportImage
│   │   ├── coordinate-utils.ts # 语义→坐标映射
│   │   └── types.ts            # 工具函数类型定义
│   │
│   ├── svg-renderer/           # SVG 渲染模块
│   │   ├── Canvas.tsx          # SVG 画布组件
│   │   ├── ElementRenderer.tsx # 元素渲染器（根据 type 渲染对应 SVG）
│   │   ├── SelectionOverlay.tsx# 选中高亮
│   │   ├── CanvasStore.ts      # 画布状态（Zustand slice）
│   │   └── shapes/             # 各形状的 SVG 组件
│   │
│   └── export/                 # 导出模块
│       ├── SvgExporter.ts      # SVG 导出
│       └── PngExporter.ts      # PNG 导出（Canvas API）
│
├── components/                 # UI 组件
│   ├── MicrophoneButton.tsx    # 麦克风按钮
│   ├── TranscriptPanel.tsx     # "你说的：xxx" 面板
│   ├── ConfirmationBubble.tsx  # AI 反问确认气泡
│   ├── Toolbar.tsx             # 基础工具栏
│   └── StatusBar.tsx           # 状态栏
│
├── store/                      # Zustand Store
│   └── index.ts                # 根 Store（组合 slices）
│
└── api/                        # BFF API Route
    └── llm.ts                  # POST /api/llm
```

---

## 二、模块接口

### 2.1 voice-input → ai-agent

```typescript
interface VoiceManager {
  onSpeechResult: (text: string) => void;
  onWakeWord: () => void;
  onEndPhrase: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
}
```

### 2.2 ai-agent → drawing-tools

```typescript
interface ToolDispatcher {
  execute(name: string, params: Record<string, unknown>): ToolResult;
  getDefinitions(): ToolDefinition[];
  getCanvasContext(): CanvasContext;
}

interface ToolResult {
  success: boolean;
  elementId?: string;
  error?: string;
}
```

### 2.3 drawing-tools → svg-renderer

```typescript
interface SVGElement {
  id: string;
  type: 'rect' | 'circle' | 'ellipse' | 'line' | 'text' | 'triangle';
  props: Record<string, unknown>;
  // 具体属性取决于 type
}
```

### 2.4 svg-renderer → export

```typescript
interface ExportService {
  exportSVG(filename: string): void;
  exportPNG(filename: string, canvasElement: SVGSVGElement): Promise<void>;
}
```

---

## 三、状态管理设计

### Zustand Store 结构

```typescript
interface AppStore {
  // 画布状态
  elements: SVGElement[];
  selectedId: string | null;
  
  // 操作历史
  history: Snapshot[];
  historyIndex: number;
  
  // AI Agent 状态
  conversation: Message[];
  agentState: 'idle' | 'wake_word' | 'listening' | 'confirming' | 'executing';
  currentTranscript: string;
  confirmationText: string;
  
  // Actions
  addElement: (el: SVGElement) => void;
  updateElement: (id: string, props: Partial<SVGElement['props']>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  
  addMessage: (msg: Message) => void;
  setAgentState: (state: AppStore['agentState']) => void;
  setTranscript: (text: string) => void;
  setConfirmation: (text: string) => void;
}
```

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
