import { readFile } from 'node:fs/promises';

const file = 'node_modules/@angular/build/node_modules/vite/dist/client/client.mjs';
const c = await readFile(file, 'utf-8');

const target = [
  '"You can also disable this overlay by setting ",',
  '      h("code", { part: "config-option-name" }, "server.hmr.overlay"),',
  '      " to ",',
  '      h("code", { part: "config-option-value" }, "false"),',
  '      " in ",',
  '      h("code", { part: "config-file-name" }, hmrConfigName),',
  '      "."',
].join('\n');

console.log('file hasCRLF =', c.includes('\r\n'));
console.log('LF target found   =', c.includes(target));
console.log('CRLF target found =', c.includes(target.replace(/\n/g, '\r\n')));
