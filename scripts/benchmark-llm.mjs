/**
 * Quick LLM latency check for complex drawing prompts.
 * Usage: node scripts/benchmark-llm.mjs
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const { TOOL_DEFINITIONS } = await import(
  pathToFileURL(join(root, 'src/modules/drawing-tools/tool-definitions.ts')).href
);
const { PHASE5_TOOL_DEFINITIONS } = await import(
  pathToFileURL(join(root, 'src/modules/drawing-tools/v2/phase5-tool-definitions.ts')).href
);
const { EXECUTE_DRAWING_PLAN_DEFINITION } = await import(
  pathToFileURL(join(root, 'src/modules/drawing-tools/v2/tool-schema-skeleton.ts')).href
);

const allTools = [...TOOL_DEFINITIONS, EXECUTE_DRAWING_PLAN_DEFINITION, ...PHASE5_TOOL_DEFINITIONS];
const compactTools = [EXECUTE_DRAWING_PLAN_DEFINITION];
const tools = process.argv.includes('--compact') ? compactTools : allTools;
const label = process.argv.includes('--compact') ? 'compact' : 'full';
const payloadKb = (JSON.stringify(tools).length / 1024).toFixed(1);
console.log(`mode=${label} tools=${tools.length} schema≈${payloadKb}KB`);

const userText = '帮我画一个奥运五环，奥运五环后面是中国的国旗，现在直接就画';
const model = process.env.LLM_MODEL || 'deepseek-chat';
const t0 = Date.now();

const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  },
  body: JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content:
          '复杂多步场景必须用 executeDrawingPlan。用户说直接画时立即调用工具，不要反问。',
      },
      { role: 'user', content: userText },
    ],
    tools,
    tool_choice: 'auto',
    max_tokens: 4096,
  }),
  signal: AbortSignal.timeout(90_000),
});

const data = await res.json();
const elapsed = Date.now() - t0;
console.log(`model=${model} status=${res.status} elapsed=${elapsed}ms`);

if (data.choices?.[0]?.message?.tool_calls?.length) {
  console.log(
    'tool_calls:',
    data.choices[0].message.tool_calls.map((t) => t.function.name).join(', '),
  );
} else {
  const content = data.choices?.[0]?.message?.content ?? JSON.stringify(data.error ?? data);
  console.log('response:', String(content).slice(0, 300));
}
