# 技术可行性评估：纯语音控制 AI SVG 绘图工具

> **proposal-id**: `proposal-20260611-talkart-tool`
> **分析日期**: 2026-06-11
> **关联**: `06-feature-solution-design.md` | `10-testability-and-validation-plan.md`

---

## 一、技术栈选型

### 1.1 推荐技术栈

| 层次 | 技术选择 | 备选方案 | 选择理由 |
|---|---|---|---|
| **前端框架** | React 18+ | Vue 3 / Svelte | 生态最大，SVG JSX 声明式匹配最好 |
| **SVG 渲染** | 原生 SVG (JSX) | SVG.js / D3.js | 零额外依赖，LLM 参数直接映射到 SVG 属性 |
| **状态管理** | Zustand / Jotai | Redux / Recoil | 轻量，适合管理画布元素状态和操作历史 |
| **构建工具** | Vite | Next.js / CRA | 快速 HMR，轻量 SPA |
| **样式** | Tailwind CSS | CSS Modules | 快速开发 UI 壳 |
| **ASR (MVP)** | Web Speech API | — | 浏览器内置，零成本，零延迟 |
| **ASR (生产)** | Whisper API / Deepgram | Azure Speech / 讯飞 | 准确率高，支持中文 |
| **LLM** | GPT-4o-mini (主) + DeepSeek (备) | Claude Haiku / Qwen 2.5 | 成本低，Function Calling 成熟 |
| **部署** | Vercel / Cloudflare Pages | Netlify | 零配置，全球 CDN |

### 1.2 技术栈评级

| 技术 | 成熟度 | 风险 | 成本 |
|---|---|---|---|
| React + SVG | 🟢 极成熟 | 低 | 免费 |
| Web Speech API | 🟢 成熟 | 中（中文准确率） | 免费 |
| GPT-4o-mini Function Calling | 🟢 成熟 | 低 | $0.15-0.6/1M tokens |
| Vercel 部署 | 🟢 成熟 | 低 | 免费额度可用 |
| Zustand | 🟢 成熟 | 低 | 免费 |

---

## 二、核心可行性评估

### 2.1 语音→ASR→文字

| 评估维度 | 结论 | 说明 |
|---|---|---|
| **可实现性** | ✅ 可实现 | Web Speech API 在所有主流浏览器可用 |
| **中文准确率** | ⚠️ 有条件 | Web Speech API 中文 ~85-90%，需文本纠错兜底 |
| **延迟** | ✅ 可接受 | 浏览器本地识别 <100ms |
| **生产方案** | ✅ 可升级 | 切换到 Whisper API 无需架构变更 |
| **结论** | ✅ **可实现** | MVP 用 Web Speech API，生产切 Whisper |

### 2.2 LLM Function Calling → 工具选择

| 评估维度 | 结论 | 说明 |
|---|---|---|
| **工具定义** | ✅ 可行 | JSON Schema 定义工具，LLM 原生支持 |
| **工具选择准确率** | ✅ 高 | <15 个工具时选择准确率 >90% |
| **参数填充准确率** | ⚠️ 有条件 | 需要工具描述写得好 + 参数约束清晰 |
| **空间推理** | ⚠️ 有条件 | LLM 对"画在右边"的具体像素推理不够精确，需要工具函数内做坐标计算 |
| **中文指令** | ✅ 可行 | GPT-4o / DeepSeek 中文 Function Calling 成熟 |
| **延迟** | ⚠️ 需优化 | API 往返 1-3s，需流式响应 + 乐观更新 |
| **结论** | ✅ **可实现（有条件）** | 工具数量控制在 15 以内，空间计算放在工具函数侧 |

### 2.3 SVG 渲染

| 评估维度 | 结论 | 说明 |
|---|---|---|
| **声明式渲染** | ✅ 可行 | React JSX 直接渲染 SVG 元素 |
| **元素管理** | ✅ 可行 | 每个 SVG 元素带唯一 ID，Zustand 管理状态 |
| **性能** | ✅ 可接受 | 100 元素内无性能问题，1000+ 需虚拟化 |
| **事件处理** | ✅ 可行 | 点击选中、拖拽移动等 |
| **导出** | ✅ 可行 | SVG 字符串直接下载，Canvas 转 PNG |
| **结论** | ✅ **可实现** | 技术风险低 |

### 2.4 上下文维护（核心挑战）

| 评估维度 | 结论 | 说明 |
|---|---|---|
| **画布状态摘要** | ✅ 可行 | 将当前画布元素列表（简化版）注入 LLM 上下文 |
| **"这个""那个"指代** | ⚠️ 需设计 | 需要维护"当前选中元素"作为默认操作目标 |
| **连续对话** | ✅ 可行 | LLM 对话历史天然支持 |
| **结论** | ✅ **可实现** | 需精心设计画布上下文摘要格式 |

---

## 三、关键技术决策

### 3.1 工具函数放前端还是后端？

| 方案 | 优点 | 缺点 | **选择** |
|---|---|---|---|
| **前端执行** | 零延迟，离线能力 | LLM API key 暴露（需 BFF） | ✅ **推荐** |
| 后端执行 | API key 安全 | 增加一跳延迟 | ❌ |

**决策**：前端执行工具函数。加一个简单的 BFF（Vercel API Route）代理 LLM 请求以保护 API key。

### 3.2 空间推理：LLM 直接输出坐标 vs 语义映射

| 方案 | 优点 | 缺点 | **选择** |
|---|---|---|---|
| **LLM 直接输出坐标** | 灵活 | 空间推理不精确 | 基础场景 |
| **语义映射在工具侧** | 精确 | 工具函数复杂 | ✅ **混合方案** |

**决策**：混合方案——LLM 输出语义级参数（`position: "center"` | `position: "right"`），工具函数内部基于画布尺寸和现有元素计算精确坐标。

**示例**：
```javascript
// 工具函数定义
drawCircle({ position: "center" | {cx, cy}, r: number, fill: string })
// 如果 position = "center"，内部计算 cx = canvasWidth/2, cy = canvasHeight/2
// 如果 position = {cx: 100, cy: 200}，直接使用
```

### 3.3 实时反馈策略

| 阶段 | 延迟 | 用户感知 | 优化策略 |
|---|---|---|---|
| 语音采集 | 实时 | 无感知 | — |
| ASR 识别 | <100ms | 无感知（Web Speech API） | — |
| 文本展示 | 即时 | 看到"你说的" | 乐观展示 |
| LLM API 调用 | 1-3s | 有感知 | **流式响应 + 骨架动画** |
| 工具执行 | <10ms | 无感知 | — |
| SVG 渲染 | <16ms | 无感知 | — |

**端到端延迟目标**：<3 秒（含 LLM API 1-3s），通过流式响应和乐观 UI 让用户感觉更快。

---

## 四、架构决策记录

### ADR-1: 纯前端 + BFF 代理

```
用户浏览器 ←→ Vercel (静态托管 + API Route)
                │
                ├── 静态文件 (React App)
                └── /api/llm → OpenAI/DeepSeek API
```

- 前端：React + SVG，部署到 Vercel 静态托管
- BFF：Vercel API Route（`/api/llm`）代理 LLM 请求，保护 API key
- 无需数据库（MVP）：画布状态仅存浏览器内存
- 无需后端服务：最小化运维

### ADR-2: 工具函数定义为 JSON Schema

```json
{
  "name": "drawRect",
  "description": "在画布上画一个矩形。使用此工具当用户想画矩形、方块、方形、框时。",
  "parameters": {
    "type": "object",
    "properties": {
      "position": {
        "type": "object",
        "description": "矩形的位置，可以是语义位置'center'、'top-left'等，或精确坐标{x, y}",
        "properties": {
          "semantic": {"type": "string", "enum": ["center", "top-left", "top-right", "bottom-left", "bottom-right", "top", "bottom", "left", "right"]},
          "x": {"type": "number", "description": "精确 x 坐标（像素）"},
          "y": {"type": "number", "description": "精确 y 坐标（像素）"}
        }
      },
      "size": {
        "type": "object",
        "description": "矩形的大小",
        "properties": {
          "width": {"type": "number"},
          "height": {"type": "number"},
          "semantic": {"type": "string", "enum": ["small", "medium", "large"]}
        }
      },
      "style": {
        "type": "object",
        "properties": {
          "fill": {"type": "string", "description": "填充颜色（CSS color）"},
          "stroke": {"type": "string", "description": "边框颜色"},
          "strokeWidth": {"type": "number"},
          "cornerRadius": {"type": "number", "description": "圆角半径"}
        }
      }
    },
    "required": ["position", "size"]
  }
}
```

### ADR-3: 画布上下文摘要格式

每次 LLM 调用时，注入当前画布状态的简化摘要：

```json
{
  "canvasSize": {"width": 800, "height": 600},
  "selectedElement": {"id": "rect-3", "type": "rect", "position": {...}},
  "elements": [
    {"id": "rect-1", "type": "rect", "x": 100, "y": 100, "width": 200, "height": 150, "fill": "blue"},
    {"id": "circle-1", "type": "circle", "cx": 400, "cy": 300, "r": 100, "fill": "red"}
  ],
  "elementCount": 5
}
```

---

## 五、风险矩阵

| 风险 | 概率 | 影响 | 缓解 | 残留风险 |
|---|---|---|---|---|
| LLM 空间推理不够精确 | 中 | 高 | 工具侧语义→坐标映射 | 中 |
| Web Speech API 中文差 | 中 | 中 | 文本兜底 + 可切 Whisper | 低 |
| LLM 延迟影响体验 | 中 | 中 | 流式响应 + 骨架屏 | 中 |
| Function Calling 选错工具 | 低 | 中 | <15 个工具，精确 Tool Description | 低 |
| 复杂指令拆解失败 | 中 | 中 | MVP 先支持单步指令 | 中（MVP 可接受） |
| 长对话上下文溢出 | 低 | 中 | 摘要式上下文注入 | 低 |

---

## 六、总结

| 技术组件 | 可行性 | 风险等级 |
|---|---|---|
| 语音采集 + ASR | ✅ 可实现 | 🟢 低 |
| LLM Function Calling | ✅ 可实现（有条件） | 🟡 中 |
| SVG 渲染 | ✅ 可实现 | 🟢 低 |
| 上下文维护 | ✅ 可实现（需设计） | 🟡 中 |
| 导出 | ✅ 可实现 | 🟢 低 |
| 部署 | ✅ 可实现 | 🟢 低 |

**总体结论**：✅ **技术可行，建议进入开发阶段。** 核心风险（空间推理、延迟）有明确的缓解方案，MVP 范围内技术风险可控。

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本：技术栈选型、可行性评估、架构决策、风险矩阵 | 主 AIC |
