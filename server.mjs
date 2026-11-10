import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const buildRoot = resolve(root, 'dist');
const publicRoot = existsSync(buildRoot) ? buildRoot : root;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const isAppRoute = /^\/app(?:\/.*)?$/.test(pathname) && !/\.[^/]+$/.test(pathname);
  const relativePath = isAppRoute ? 'app/index.html' : pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = resolve(publicRoot, relativePath);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const file = statSync(filePath);
    if (!file.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, '127.0.0.1', () => {
  console.log(`Hisab landing page running at http://127.0.0.1:${port}`);
});
