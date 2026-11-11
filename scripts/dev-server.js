import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const port=Number(process.env.PORT || 4173), host=process.env.BIND_HOST || '127.0.0.1';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let rel=pathname==='/'?'apps/control-center/index.html':pathname==='/demo' || pathname==='/demo/'?'demo/index.html':pathname.slice(1);
    if (pathname.split('/').some(part=>part.startsWith('.')||part==='..')) throw new Error('private path');
    const allowed=rel.startsWith('apps/emulator-viewer/')||rel.startsWith('apps/control-center/')||rel.startsWith('demo/')||rel.startsWith('packages/engine/src/')||rel.startsWith('apps/browser-extension/');
    if (!allowed) throw new Error('not published');
    const file=resolve(root,rel);
    if (file!==root && !file.startsWith(root+sep)) throw new Error('invalid path');
    if (!(await stat(file)).isFile()) throw new Error('not found');
    res.writeHead(200,{'content-type':types[extname(file)]||'application/octet-stream','cache-control':'no-store'}).end(await readFile(file));
  } catch { res.writeHead(404,{'content-type':'text/plain; charset=utf-8'}).end('Not found'); }
}).listen(port,host,()=>process.stdout.write(`ClearChoice control center: http://${host}:${port}/\nDemo store: http://${host}:${port}/demo/\n`));
