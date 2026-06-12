/**
 * End-to-end: LLM plan → ToolDispatcher → element count & errors
 * Usage: npx tsx scripts/test-draw-cat.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const { buildDrawingSystemPrompt } = await import(
  new URL('../src/modules/ai-agent/drawing-system-prompt.ts', import.meta.url).href
);
const { EXECUTE_DRAWING_PLAN_DEFINITION } = await import(
  new URL('../src/modules/drawing-tools/v2/tool-schema-skeleton.ts', import.meta.url).href
);
const { ToolDispatcher } = await import(
  new URL('../src/modules/ai-agent/ToolDispatcher.ts', import.meta.url).href
);

const userText = '帮我画一只黄色的小猫';
const sys = buildDrawingSystemPrompt({
  width: 800,
  height: 600,
  elementCount: 0,
  elementsSummary: '空画布',
});

console.log('=== 1. Call LLM ===');
const t0 = Date.now();
const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  },
  body: JSON.stringify({
    model: process.env.LLM_MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: userText },
    ],
    tools: [EXECUTE_DRAWING_PLAN_DEFINITION],
    tool_choice: 'auto',
    max_tokens: 4096,
  }),
  signal: AbortSignal.timeout(90_000),
});
const data = await res.json();
console.log(`LLM ${Date.now() - t0}ms status=${res.status}`);

const tc = data.choices?.[0]?.message?.tool_calls?.[0];
if (!tc) {
  console.error('No tool_call:', data.choices?.[0]?.message?.content || data.error);
  process.exit(1);
}

const plan = JSON.parse(tc.function.arguments);
writeFileSync(join(root, 'scripts/.last-cat-plan.json'), JSON.stringify(plan, null, 2));
console.log(`Plan steps: ${plan.steps?.length ?? 0}`);

const context = {
  width: 800,
  height: 600,
  widthMm: 211.7,
  heightMm: 158.8,
  defaultUnit: 'mm',
  elements: [],
  selectedId: null,
  layers: [{ id: 'layer-default', name: '默认', visible: true, zIndex: 0 }],
};

console.log('\n=== 2. Execute plan locally ===');
const dispatcher = new ToolDispatcher(context);
const result = dispatcher.execute('executeDrawingPlan', plan);

console.log('success:', result.success);
console.log('completed:', result.planResult?.completedSteps, '/', result.planResult?.totalSteps);
console.log('elements on canvas:', result.elements?.length ?? 0);

if (result.planResult?.errors?.length) {
  console.log('\n--- Step errors ---');
  for (const e of result.planResult.errors) {
    const step = plan.steps[e.stepIndex];
    console.log(`[${e.stepIndex}] ${e.tool} (${step?.label ?? ''}): ${e.error}`);
  }
}

console.log('\n--- Elements ---');
for (const el of result.elements ?? []) {
  const p = el.props;
  console.log(
    `${el.type} fill=${p.fill} stroke=${p.stroke} ` +
      (el.type === 'circle' ? `cx=${p.cx?.toFixed?.(0)} cy=${p.cy?.toFixed?.(0)} r=${p.r}` : '') +
      (el.type === 'ellipse' ? `cx=${p.cx?.toFixed?.(0)} cy=${p.cy?.toFixed?.(0)}` : '') +
      (el.type === 'rect' ? `x=${p.x?.toFixed?.(0)} y=${p.y?.toFixed?.(0)}` : ''),
  );
}

// Minimal SVG for visual check
const svg = renderSvg(result.elements ?? [], 800, 600);
writeFileSync(join(root, 'scripts/.last-cat-output.svg'), svg);
console.log('\nSVG written to scripts/.last-cat-output.svg');

function renderSvg(elements, w, h) {
  const shapes = elements
    .map((el) => {
      const p = el.props;
      if (el.type === 'circle')
        return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${p.fill}" stroke="${p.stroke || 'none'}" stroke-width="${p.strokeWidth || 0}"/>`;
      if (el.type === 'ellipse')
        return `<ellipse cx="${p.cx}" cy="${p.cy}" rx="${p.rx}" ry="${p.ry}" fill="${p.fill}" stroke="${p.stroke || 'none'}" stroke-width="${p.strokeWidth || 0}"/>`;
      if (el.type === 'rect')
        return `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="${p.fill}" stroke="${p.stroke || 'none'}" stroke-width="${p.strokeWidth || 0}"/>`;
      if (el.type === 'triangle')
        return `<polygon points="${p.x1},${p.y1} ${p.x2},${p.y2} ${p.x3},${p.y3}" fill="${p.fill}" stroke="${p.stroke || 'none'}" stroke-width="${p.strokeWidth || 0}"/>`;
      if (el.type === 'polyline')
        return `<polyline points="${p.points}" fill="none" stroke="${p.stroke}" stroke-width="${p.strokeWidth || 1}"/>`;
      if (el.type === 'line')
        return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${p.stroke}" stroke-width="${p.strokeWidth || 1}"/>`;
      return '';
    })
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fff"/>${shapes}</svg>`;
}
