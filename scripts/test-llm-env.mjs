import { readFileSync } from 'node:fs';
import { resolveLlmEnvConfig } from '../src/modules/ai-agent/llm-env-config.ts';

for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const cfg = resolveLlmEnvConfig();
console.log('chatCompletionsUrl:', cfg.chatCompletionsUrl);
console.log('model:', cfg.model);

async function probe(label, url, model, apiKey) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'say ok' }],
      max_tokens: 16,
    }),
  });
  const text = await res.text();
  console.log(`\n[${label}] status=${res.status}`);
  console.log(text.slice(0, 500));
}

await probe('current env', cfg.chatCompletionsUrl, cfg.model, cfg.apiKey);

// If model looks like MaaS inference (xop*), also try maas-api host
if (cfg.model.startsWith('xop')) {
  const altUrl = 'https://maas-api.cn-huabei-1.xf-yun.com/v2/chat/completions';
  await probe('maas-api v2', altUrl, cfg.model, cfg.apiKey);
}
