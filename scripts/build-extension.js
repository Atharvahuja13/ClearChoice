import { mkdir, copyFile } from 'node:fs/promises';
await mkdir(new URL('../apps/browser-extension/src/',import.meta.url),{recursive:true});
await copyFile(new URL('../packages/engine/src/index.js',import.meta.url),new URL('../apps/browser-extension/src/index.js',import.meta.url));
await copyFile(new URL('../packages/engine/src/browser-adapter.js',import.meta.url),new URL('../apps/browser-extension/src/browser-adapter.js',import.meta.url));
process.stdout.write('Packaged shared ClearChoice engine and browser adapter for the MV3 extension.\n');
