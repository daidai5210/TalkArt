# UI/UX 设计：TalkArt

> **版本**: v0.1.0-mvp

---

## 一、设计系统

### 1.1 色彩方案

| Token | 值 | 用途 |
|---|---|---|
| --color-bg | #1a1a2e | 主背景（深色主题） |
| --color-canvas | #ffffff | 画布背景 |
| --color-surface | #16213e | 面板背景 |
| --color-primary | #7c5cfc | 主色调（紫色） |
| --color-success | #4ade80 | 成功/唤醒 |
| --color-warning | #fbbf24 | 警告/监听中 |
| --color-error | #f87171 | 错误 |
| --color-text | #e2e8f0 | 主文字 |
| --color-text-muted | #94a3b8 | 次要文字 |

### 1.2 字体

| Token | 值 |
|---|---|
| --font-sans | 'Inter', system-ui, sans-serif |
| --font-mono | 'JetBrains Mono', monospace |
| --font-size-sm | 0.875rem |
| --font-size-base | 1rem |
| --font-size-lg | 1.25rem |
| --font-size-xl | 1.5rem |

### 1.3 间距与圆角

| Token | 值 |
|---|---|
| --radius-sm | 6px |
| --radius-md | 10px |
| --radius-lg | 16px |
| --spacing-xs | 4px |
| --spacing-sm | 8px |
| --spacing-md | 16px |
| --spacing-lg | 24px |
| --spacing-xl | 32px |

---

## 二、组件设计

### 2.1 状态指示器

- IDLE: 绿色圆点 + "等待唤醒..."
- LISTENING: 红色脉冲动画 + "正在听..."
- CONFIRMING: 紫色圆点 + "确认中..."
- EXECUTING: 骨架动画

### 2.2 语音面板

- 半透明深色背景
- 上方显示用户语音文本（左对齐）
- 下方显示 AI 反问确认文本（右对齐，紫色边框气泡）

### 2.3 SVG 画布

- 白色背景 + 浅灰边框
- 默认 800×600
- 选中元素：蓝色虚线边框 + 四角控制点

### 2.4 工具栏

- 底部固定
- 半透明深色背景
- 按钮：撤销、重做、清空、导出
- 状态文字：当前状态描述

---

## 三、响应式

| 断点 | 布局 |
|---|---|
| >=1024px | 全宽布局，画布居中 |
| 768-1023px | 面板宽度自适应 |
| <768px | 画布全宽，面板堆叠 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
