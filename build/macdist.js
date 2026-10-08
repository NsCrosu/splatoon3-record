import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'release');
const stage = mkdtempSync(join(tmpdir(), 'splatoon3record-'));
const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

function buildMac() {
  const cli = join(root, 'node_modules', 'electron-builder', 'cli.js');
  const args = ['--mac', 'dmg', `--${arch}`, '--publish', 'never', '--config', 'electron-builder.cjs', `--config.directories.output=${stage}`];
  execFileSync(process.execPath, [cli, ...args], { cwd: root, stdio: 'inherit' });
  if (process.env.S3R_TEST_PACKAGE === 'true') {
    execFileSync(process.execPath, [join(root, 'tests', 'packaged.js')], { cwd: root, stdio: 'inherit', env: { ...process.env, S3R_PACKAGE_DIR: stage } });
  }
}

function collectDmg() {
  mkdirSync(output, { recursive: true });
  for (const name of readdirSync(stage)) {
    if (!name.endsWith('.dmg')) continue;
    cpSync(join(stage, name), join(output, name));
    console.log(`产物就绪：release/${name}`);
  }
}

try {
  buildMac();
  collectDmg();
} finally {
  rmSync(stage, { recursive: true, force: true });
}
