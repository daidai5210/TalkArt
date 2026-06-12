# 部署方案：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp

---

## 部署拓扑

```
GitHub (源码)
  │ git push
  ▼
Vercel (自动构建 + 部署)
  ├── Static Files (React SPA → CDN)
  └── API Route (/api/llm → Serverless Function)
```

---

## 部署步骤

1. 将项目推送到 GitHub 仓库
2. Vercel 连接 GitHub 仓库
3. 配置环境变量（`OPENAI_API_KEY`、`LLM_PROVIDER` 等）
4. Vercel 自动构建和部署
5. 每次 push 自动 Preview Deploy

---

## Vercel 配置

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

---

## 回滚

- Vercel Dashboard 一键回滚到任意历史部署
- 每个部署有唯一 URL，可直接访问历史版本

---

## 监控

- Vercel Analytics（免费额度）
- 前端 Error Boundary + console.error 收集
- LLM API 调用次数和延迟打点

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
