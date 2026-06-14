import { readFileSync } from 'node:fs';
import { resolveLlmEnvConfig } from '../src/modules/ai-agent/llm-env-config.ts';
import { PLAN_DRAWING_STEPS_DEFINITION } from '../src/modules/ai-agent/leafer-tool-definitions.ts';

for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const cfg = resolveLlmEnvConfig();
console.log('model:', cfg.model, 'url:', cfg.chatCompletionsUrl);

const controller = new AbortController();
setTimeout(() => controller.abort(), 45_000);

try {
  const res = await fetch(cfg.chatCompletionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: '画一只猫，请调用 planDrawingSteps 工具' }],
      tools: [PLAN_DRAWING_STEPS_DEFINITION],
      tool_choice: 'auto',
      max_tokens: 2048,
    }),
    signal: controller.signal,
  });
  console.log('status', res.status);
  console.log((await res.text()).slice(0, 1200));
} catch (e) {
  console.error('failed:', e instanceof Error ? e.message : e);
}
