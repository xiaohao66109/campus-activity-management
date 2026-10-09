import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = resolve(root, 'node_modules/vinext/dist/cli.js');
const [major, minor] = process.versions.node.split('.').map(Number);
if (process.platform !== 'win32' || process.arch !== 'x64') {
  throw new Error('This launcher requires 64-bit Windows (x64).');
}
if (major < 22 || (major === 22 && minor < 13)) {
  throw new Error('Node.js 22.13 or later is required. Use the Windows x64 runtime ZIP.');
}
await access(cli);
console.log(`Runtime: ${process.execPath} (${process.version}, ${process.arch})`);
if (process.argv.includes('--check')) process.exit(0);

async function portAvailable(port) {
  return new Promise((resolveAvailable) => {
    const probe = createServer();
    probe.once('error', () => resolveAvailable(false));
    probe.listen(port, 'localhost', () => probe.close(() => resolveAvailable(true)));
  });
}

let port = Number(process.env.CAMPUS_PORT || 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65520) throw new Error('Invalid CAMPUS_PORT.');
const limit = port + 10;
while (!(await portAvailable(port))) {
  port += 1;
  if (port >= limit) throw new Error('No available local port. Close older app windows and retry.');
}
const url = `http://localhost:${port}/`;
console.log(`Starting campus app at ${url}. Keep this window open; Ctrl+C stops the server.`);
const child = spawn(process.execPath, [cli, 'dev', '--hostname', 'localhost', '--port', String(port)], {
  cwd: root,
  stdio: 'inherit',
  windowsHide: true,
});
let finished = false;
let ready = false;
child.once('error', (error) => { finished = true; console.error(error.message); process.exitCode = 1; });
child.once('exit', (code) => { finished = true; process.exitCode = code ?? 1; });
process.on('SIGINT', () => { finished = true; child.kill(); });
process.on('SIGTERM', () => { finished = true; child.kill(); });

const deadline = Date.now() + 180000;
while (!finished && Date.now() < deadline) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (response.ok && (await response.text()).includes('校园活动')) {
      ready = true;
      console.log(`Ready: ${url}`);
      if (!process.argv.includes('--no-open')) {
        const browser = spawn('cmd.exe', ['/d', '/c', 'start', '', url], {
          stdio: 'ignore', windowsHide: true,
        });
        browser.on('error', () => console.log(`Open ${url} in your browser.`));
      }
      break;
    }
  } catch { /* The server is still starting. */ }
  await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
}
if (!ready && !finished) {
  console.error('The server did not become ready within 3 minutes. Review the errors above.');
  child.kill();
  process.exitCode = 1;
}
