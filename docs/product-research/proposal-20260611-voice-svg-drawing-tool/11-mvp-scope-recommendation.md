# MVP 范围建议：纯语音控制 AI SVG 绘图工具

> **proposal-id**: `proposal-20260611-talkart-tool`
> **分析日期**: 2026-06-11
> **关联**: `06-feature-solution-design.md` | `08-business-value-and-cost.md` | `09-risk-and-compliance.md`

---

## 一、MVP 目标

**验证核心假设**：用户可以通过纯语音指令，借助 AI Agent 的 Function Calling 能力，成功创建和编辑 SVG 矢量图形，且体验优于传统鼠标操作（对非专业用户）。

---

## 二、MVP 范围定义

### 2.1 P0 — MVP 必做（预计 10-15 人天）

#### 语音输入模块

| 功能 | 说明 |
|---|---|
| 麦克风权限获取 | getUserMedia |
| Web Speech API 语音识别 | 浏览器内置 ASR，中文 |
| 识别文本实时展示 | 画布上方展示"你说的：xxx" |
| 文本输入兜底 | 语音失败时打字输入 |

#### AI Agent 模块

| 功能 | 说明 |
|---|---|
| LLM Function Calling | GPT-4o-mini / DeepSeek |
| 工具选择与参数填充 | 自动选择正确工具 |
| 画布上下文注入 | 当前元素列表摘要 |
| 单步指令执行 | MVP 不支持多步拆解 |
| 基础错误恢复 | 工具调用失败时提示用户 |

#### 绘图工具（15 个 P0 工具）

| 类别 | 工具 |
|---|---|
| **基础图形（6）** | `drawRect`, `drawCircle`, `drawEllipse`, `drawLine`, `drawText`, `drawTriangle` |
| **元素操作（6）** | `selectElement`, `updateElement`, `deleteElement`, `moveElement`, `scaleElement`, `duplicateElement` |
| **画布操作（3）** | `clearCanvas`, `undoAction`, `exportImage` |

#### SVG 渲染模块

| 功能 | 说明 |
|---|---|
| React + 原生 SVG 渲染 | 声明式 SVG 元素 |
| 元素选中高亮 | 蓝色边框 |
| 实时预览 | 工具调用后立即渲染 |

#### 导出模块

| 功能 | 说明 |
|---|---|
| 导出 SVG | 原生 SVG 下载 |
| 导出 PNG | Canvas 转 PNG 下载 |

#### 基础设施

| 功能 | 说明 |
|---|---|
| Vercel 部署 | 静态托管 + API Route |
| BFF API Key 代理 | `/api/llm` 保护 API key |
| 基础 UI 壳 | 麦克风按钮 + 画布 + 状态栏 |
| 设计文档 | 指令能力支持清单（用户要求） |

### 2.2 P1 — MVP 后第一迭代（预计 5-8 人天）

| 功能 | 说明 |
|---|---|
| 进阶图形工具 | `drawPath`, `drawPolygon`, `drawArrow` |
| 对齐与分布 | `alignElements`, `distributeElements` |
| 渐变填充 | `addGradient` |
| 多步指令拆解 | "画三个圆排成一行" |
| 画布缩放/平移 | 滚轮 + 拖拽 |
| 复制到剪贴板 | 直接粘贴到其他应用 |
| 英文支持 | 中英双语 |
| 流式响应 | 降低感知延迟 |

### 2.3 P2 — 长期（预计 8-12 人天）

| 功能 | 说明 |
|---|---|
| 图层管理 | 图层面板 |
| 模板系统 | 预设模板 |
| 图表生成 | `drawChart` |
| SVG 动画 | SMIL/CSS 动画 |
| 图标库 | `drawIcon` |
| 协作编辑 | 实时多人 |
| 语音唤醒词 | "嘿画图" |
| 本地 Whisper | 离线 ASR |

---

## 三、不做项（MVP 明确排除）

| 不做项 | 原因 | 何时做 |
|---|---|---|
| AI 文生图 | 与核心定位冲突 | 永不做 |
| 图片编辑/滤镜 | 不是图片编辑器 | 永不做 |
| 3D 绘图 | 不在 SVG 2D 范围 | 永不做 |
| 移动原生 App | Web 优先 | P2（PWA） |
| 离线桌面应用 | Web 优先 | 不确定 |
| 实时协作 | MVP 后 | P2 |
| 图层管理 | MVP 后 | P2 |
| 复杂路径编辑 | MVP 后 | P1 |

---

## 四、MVP 成功指标

| 指标 | 目标 | 测量方式 |
|---|---|---|
| 核心流程可用 | 语音→绘图→导出 全链路通过 | E2E 测试 |
| 工具选择准确率 | >90%（20 个标准指令） | 手动测试 |
| 端到端延迟（P50） | <3 秒 | Performance API |
| 用户任务完成率 | >70%（3 个测试任务） | 用户测试 |
| 零崩溃 | 无 JS 异常导致白屏 | 错误监控 |

---

## 五、MVP 时间线建议

```
Week 1: 项目脚手架 + SVG 渲染 + 工具函数（drawRect 等）
Week 2: LLM Agent 集成 + Function Calling 调试
Week 3: 语音输入 + 全链路联调 + UI 壳
Week 4: 测试 + 优化 + 设计文档 + 部署
```

---

## 六、MVP 后的决策分支

```
MVP 验证结果
  ├── ✅ 核心假设验证通过
  │     → 进入 P1 迭代
  │     → 开始用户增长
  │
  ├── ⚠️ 部分验证（语音可用但体验需优化）
  │     → 优化延迟 + ASR
  │     → 再次验证
  │
  └── ❌ 核心假设不成立（用户不接受语音绘图）
        → 分析原因
        → Pivot: 文本输入为主 + 语音为辅
        → 或: 转向特定场景（无障碍/教育）
```

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本：MVP 范围、成功指标、时间线、决策分支 | 主 AIC |
