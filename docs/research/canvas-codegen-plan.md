# TalkArt 代码生成架构改造计划

## 文档信息

| 字段 | 内容 |
|---|---|
| **版本** | v0.3.0-codegen-plan |
| **日期** | 2026-06-12 |
| **状态** | 进行中 |
| **目标** | 采用方案A：JS代码生成 + 沙箱执行，实现复杂图形绘制能力 |
| **基线版本** | v0.1.0-mvp |

---

## 一、改造背景

### 1.1 当前架构问题

| 问题 | 根本原因 |
|---|---|
| 思考时间长 | 架构固有延迟：语音识别 → LLM处理 → 选择工具 → 多轮确认 |
| 批量渲染 | 所有元素数据完成后一次性渲染 |
| 无法绘制复杂图形 | 工具定义限制只能绘制基本几何形状 |

### 1.2 新架构核心思路

```
用户语音 → LLM 生成 JS 绘图代码 → Canvas 执行 → 实时渲染
```

**关键优势：**
- 极大灵活性，可绘制任意复杂图形（小猫、小狗、人物）
- 支持循环、条件、函数等编程结构
- 可引入 Paper.js 等高级绘图库
- 流式渲染，用户可见绘制过程

---

## 二、阶段划分

### 阶段一：Canvas 渲染引擎基础

**目标**：建立 Canvas 渲染基础架构，支持执行 JS 绘图代码。

**计划实现的功能**：

| 功能 | 描述 |
|---|---|
| Canvas 组件 | 新增 `<canvas>` 元素与 SVG 并存 |
| executeCanvasCode 工具 | 新工具定义，接收 JS 代码字符串 |
| 代码执行器 | 安全执行 JS 代码并渲染到 Canvas |
| 基础测试 | 验证简单图形绘制 |

**修改文件清单（预估）**：

| 文件 | 操作 |
|---|---|
| `src/modules/canvas-renderer/CanvasLayer.tsx` | 新增 |
| `src/modules/canvas-renderer/CodeExecutor.ts` | 新增 |
| `src/modules/drawing-tools/v2/canvas-code-tools.ts` | 新增 |
| `src/modules/ai-agent/ToolDispatcher.ts` | 修改 |
| `src/TalkArt.tsx` | 修改 |
| `src/store/canvas-slice.ts` | 修改 |

**验收标准**：
- [ ] 手动调用 `executeCanvasCode` 可绘制圆形
- [ ] Canvas 与 SVG 画布共存显示
- [ ] 基础代码执行无报错

---

### 阶段二：LLM Prompt 优化与代码生成

**目标**：让 LLM 能够生成 Canvas 绘图代码。

**计划实现的功能**：

| 功能 | 描述 |
|---|---|
| System Prompt 重写 | 指导 LLM 生成 Canvas API 代码 |
| 代码生成模板 | 提供常见图形的代码模板 |
| 语义坐标转换 | 代码中可使用语义位置（居中、左上等） |
| 多图形组合 | 支持一次生成多个图形 |

**修改文件清单（预估）**：

| 文件 | 操作 |
|---|---|
| `api/llm.ts` | 修改 |
| `src/modules/ai-agent/ConversationManager.ts` | 修改 |
| `docs/prompt-templates/canvas-code-template.md` | 新增 |

**验收标准**：
- [ ] 语音「画一个红色圆形」生成正确的 Canvas 代码
- [ ] 语音「画一只小猫」生成可执行的代码（简单轮廓）
- [ ] 执行后画布正确显示

---

### 阶段三：高级绘图库集成

**目标**：引入 Paper.js 提供高级矢量绘图 API。

**计划实现的功能**：

| 功能 | 描述 |
|---|---|
| Paper.js 集成 | 引入矢量绘图库 |
| 高级 API 封装 | Path、Curve、Shape 等高级 API |
| 预设模板库 | 小猫、小狗、人物轮廓模板 |
| SVG 导出增强 | Paper.js 项目导出为 SVG |

**修改文件清单（预估）**：

| 文件 | 操作 |
|---|---|
| `package.json` | 修改（添加 paper.js） |
| `src/modules/paper-renderer/PaperCanvas.ts` | 新增 |
| `src/modules/paper-renderer/Templates.ts` | 新增 |
| `src/modules/drawing-tools/v2/paper-tools.ts` | 新增 |

**验收标准**：
- [ ] 语音「画一只小猫」调用预设模板
- [ ] 模板可调整参数（颜色、大小）
- [ ] 导出 SVG 包含矢量路径

---

### 阶段四：流式渲染优化

**目标**：实现渐进式绘制，增强用户体验。

**计划实现的功能**：

| 功能 | 描述 |
|---|---|
| 渐进式绘制 | 代码执行过程中逐步渲染 |
| 绘制过程可视化 | 用户可见图形逐步出现 |
| 执行进度反馈 | 显示当前绘制状态 |
| 响应速度优化 | 减少等待感 |

**修改文件清单（预估）**：

| 文件 | 操作 |
|---|---|
| `src/modules/canvas-renderer/StreamingExecutor.ts` | 新增 |
| `src/components/DrawingProgress.tsx` | 新增 |
| `src/TalkArt.tsx` | 修改 |

**验收标准**：
- [ ] 绘制过程可见（非一次性出现）
- [ ] 进度指示器显示
- [ ] 复杂图形绘制时间 < 3秒

---

### 阶段五：错误处理与容错

**目标**：完善的错误处理机制。

**计划实现的功能**：

| 功能 | 描述 |
|---|---|
| 代码执行错误捕获 | try-catch 包装，友好错误提示 |
| 自动重试机制 | 失败后可重试执行 |
| 语法错误修复 | LLM 自动修复语法错误 |
| 用户反馈提示 | 错误原因可视化展示 |

**修改文件清单（预估）**：

| 文件 | 操作 |
|---|---|
| `src/modules/canvas-renderer/ErrorHandler.ts` | 新增 |
| `src/modules/ai-agent/ConversationManager.ts` | 修改 |
| `src/components/ErrorToast.tsx` | 修改 |

**验收标准**：
- [ ] 语法错误时提示具体问题
- [ ] 支持重新生成代码
- [ ] 执行超时自动终止

---

## 三、PR 提交规范

每个阶段完成后，PR 描述必须包含：

```markdown
## 本阶段实现的功能

- 功能1：描述
- 功能2：描述

## 修改的文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| xxx.ts | 新增/修改 | 说明 |

## 遇到的问题

1. 问题描述 → 解决方案

## 测试验证

- 测试1：结果
- 测试2：结果
```

---

## 四、当前进度

| 阶段 | 状态 | 分支 | PR |
|---|---|---|---|
| 阶段一 | 🔄 进行中 | `phase-canvas-1` | - |
| 阶段二 | ⬜ 待开始 | - | - |
| 阶段三 | ⬜ 待开始 | - | - |
| 阶段四 | ⬜ 待开始 | - | - |
| 阶段五 | ⬜ 待开始 | - | - |

---

## 更新记录

| 日期 | 更新内容 |
|---|---|
| 2026-06-12 | 创建改造计划文档 |