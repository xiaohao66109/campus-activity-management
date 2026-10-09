import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  root,
  configFile: false,
  plugins: [react()],
  resolve: { alias: { '@': root } },
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    write: false,
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
    modulePreload: false,
    rolldownOptions: {
      input: resolve(root, 'portable/index.html'),
      output: { codeSplitting: false },
    },
  },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
const chunks = outputs.filter((o) => o.type === 'chunk');
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) {
  throw new Error('Portable output must contain exactly one self-contained script.');
}
const css = outputs.filter((o) => o.type === 'asset' && o.fileName.endsWith('.css'))
  .map((o) => String(o.source)).join('\n');
const js = chunks[0].code.replace(/<\/script/gi, '<\\/script');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>校园活动管理系统 V2.0</title><style>${css}</style></head>
<body><div id="root"></div><noscript>请使用启用 JavaScript 的浏览器打开本系统。</noscript><script type="module">${js}</script></body></html>`;
const destination = resolve(root, '打开校园活动系统.html');
await writeFile(destination, html, 'utf8');
console.log(`Portable app: ${destination} (${Buffer.byteLength(html)} bytes)`);
