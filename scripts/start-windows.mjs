import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
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

function openBrowser(url) {
  if (process.argv.includes('--no-open')) return;
  const browser = spawn('cmd.exe', ['/d', '/c', 'start', '', url], {
    stdio: 'ignore', windowsHide: true,
  });
  browser.on('error', () => console.log(`Open ${url} in your browser.`));
}

async function pageReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return response.ok && (await response.text()).includes('校园活动');
  } catch { return false; }
}

async function openExistingServer() {
  let lock;
  try {
    lock = JSON.parse(await readFile(resolve(root, '.vinext/dev/lock.json'), 'utf8'));
  } catch { return false; }
  if (!Number.isInteger(lock.pid) || lock.pid <= 0 ||
      !Number.isInteger(lock.port) || lock.port < 1024 || lock.port > 65535 ||
      typeof lock.cwd !== 'string' ||
      resolve(lock.cwd).toLowerCase() !== resolve(root).toLowerCase() ||
      !['localhost', '127.0.0.1', '::1'].includes(lock.hostname)) return false;
  try { process.kill(lock.pid, 0); }
  catch (error) { if (error.code !== 'EPERM') return false; }
  const hostname = lock.hostname === '::1' ? '[::1]' : lock.hostname;
  const existingUrl = `http://${hostname}:${lock.port}/`;
  console.log(`Campus app is already running. Opening ${existingUrl}`);
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    if (await pageReady(existingUrl)) {
      console.log(`Ready: ${existingUrl}`);
      openBrowser(existingUrl);
      return true;
    }
    try { process.kill(lock.pid, 0); }
    catch (error) { if (error.code !== 'EPERM') return false; }
    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }
  throw new Error('The existing server is not responding. Close its startup window and retry.');
}

if (await openExistingServer()) process.exit(0);

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
    if (await pageReady(url)) {
      ready = true;
      console.log(`Ready: ${url}`);
      openBrowser(url);
      break;
    }
  await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
}
// Two quick double-clicks may race before the first process writes its lock.
if (!ready && finished && await openExistingServer()) process.exitCode = 0;
if (!ready && !finished) {
  console.error('The server did not become ready within 3 minutes. Review the errors above.');
  child.kill();
  process.exitCode = 1;
}
