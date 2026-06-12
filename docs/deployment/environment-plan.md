# 环境规划：TalkArt v0.1.0-mvp

> **版本**: v0.1.0-mvp

---

## 环境清单

| 环境 | 用途 | URL |
|---|---|---|
| 本地开发 | 开发 + 单元测试 | `http://localhost:5173` |
| 预发布 | E2E + 用户验收 | Vercel Preview Deploy（每个 PR 自动生成） |
| 生产 | 正式服务 | Vercel Production（待定域名） |

---

## 环境变量

| 变量 | 环境 | 说明 |
|---|---|---|
| `OPENAI_API_KEY` | 全部 | OpenAI API Key |
| `DEEPSEEK_API_KEY` | 全部 | DeepSeek API Key（备用） |
| `LLM_PROVIDER` | 全部 | `openai` / `deepseek` |
| `LLM_MODEL` | 全部 | `gpt-4o-mini` / `deepseek-chat` |

---

## 本地开发

```bash
cp .env.example .env.local
# 编辑 .env.local 填入 API Key
npm install
npm run dev
```

---

## 更新记录

| 日期 | 更新内容 | 更新人 |
|---|---|---|
| 2026-06-11 | 初始版本 | 主 AIC |
