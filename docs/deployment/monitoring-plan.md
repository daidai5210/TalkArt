# 监控告警方案：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp

---

## MVP 阶段

MVP 阶段采用轻量监控：

| 监控项 | 方式 | 告警 |
|---|---|---|
| 页面 JS 异常 | ErrorBoundary + console.error | 浏览器 Console |
| LLM API 错误 | /api/llm 返回 5xx | 前端 Toast 提示 |
| LLM 延迟 >5s | Performance API 打点 | 前端骨架动画 |

---

## 生产阶段（后续）

如需完整监控，可接入：

| 工具 | 用途 |
|---|---|
| Vercel Analytics | 页面 PV、性能 |
| Sentry | JS 异常收集 |
| Datadog / Grafana | 全栈监控 |

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
