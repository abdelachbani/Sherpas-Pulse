import { build } from 'esbuild';
import { readdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const files = (await readdir('tests')).filter(f => f.endsWith('.test.ts'));
const chosen = process.argv.slice(2);
const selected = chosen.length ? files.filter(f => chosen.some(arg => f.includes(arg))) : files;
if (!selected.length) throw new Error('No tests selected');
const temp = await mkdtemp(join(tmpdir(), 'sherpas-tests-'));
try {
  const out = [];
  for (const file of selected) {
    const result = await build({ entryPoints: [resolve('tests', file)], bundle: true, platform: 'node', format: 'esm', write: false });
    const target = join(temp, file.replace('.ts', '.mjs'));
    await writeFile(target, result.outputFiles[0].text);
    out.push(target);
  }
  const result = spawnSync(process.execPath, ['--test', ...out], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally { await rm(temp, { recursive: true, force: true }); }
