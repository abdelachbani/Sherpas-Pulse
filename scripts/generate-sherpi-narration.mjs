import { createHash } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { build } from 'esbuild';

const teamKey = process.env.TEAM_KEY;
if (!teamKey) throw new Error('Set TEAM_KEY in the process environment.');

const { outputFiles } = await build({
  stdin: {
    contents: `
      import { CASES } from './src/lib/mcp/cases';
      import { extractStoryData } from './src/lib/mcp/extractor';
      import { buildStoryFrames } from './src/lib/storyFrames';
      import { SHERPI_INTRO_STEPS } from './src/lib/sherpiIntro';
      const lines = SHERPI_INTRO_STEPS.map(step => step.title + '. ' + step.text);
      for (const plan of CASES) {
        const stories = extractStoryData(plan.financialHealth, plan.investmentAnalysis);
        for (const style of ['visual', 'analytical', 'express']) {
          for (const frame of buildStoryFrames(stories, style)) {
            if (frame.card.voiceScript) lines.push(frame.card.voiceScript);
          }
        }
      }
      export default [...new Set(lines)];
    `,
    resolveDir: process.cwd(),
  },
  bundle: true, platform: 'node', format: 'esm', write: false,
});
const { default: lines } = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const folder = 'public/sherpi-narration';
await mkdir(folder, { recursive: true });
const entries = lines.map(line => [line, createHash('sha256').update(line).digest('hex').slice(0, 16) + '.mp3']);
console.log(`Preparing ${entries.length} clips (${lines.join('').length} characters before cache).`);

async function render([line, filename]) {
  const path = `${folder}/${filename}`;
  if (await access(path).then(() => true, () => false)) return;
  const response = await fetch('https://llm-hackathon.sherpaswealth.com/v1/audio/speech', {
    method: 'POST',
    headers: { authorization: `Bearer ${teamKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'eleven-flash-v2.5', voice: 'alloy', input: line, response_format: 'mp3' }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('audio/')) {
    throw new Error(`Speech generation failed for ${filename} (HTTP ${response.status}).`);
  }
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

for (let start = 0; start < entries.length; start += 3) {
  await Promise.all(entries.slice(start, start + 3).map(render));
}
await writeFile('src/lib/sherpiNarrationClips.json', JSON.stringify(Object.fromEntries(entries), null, 2) + '\n');
