/**
 * LOCAL MOTION 3D WEBSITE - LOCAL DEVELOPMENT SERVER
 * Runs locally via `node scripts/server.js` or `npm start`.
 * Placed in `scripts/` so cloud hosts (like Vercel) deploy the root as a pure static CDN site.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function resolveFilePath(reqUrl) {
  let cleanUrl = (reqUrl || '/').split('?')[0];
  if (cleanUrl === '/' || cleanUrl === '') {
    cleanUrl = '/index.html';
  }

  const decoded = decodeURIComponent(cleanUrl);
  const safeRelative = path.normalize(decoded).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(PUBLIC_DIR, safeRelative);

  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    return null;
  }
  return absolutePath;
}

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico' && !fs.existsSync(path.join(PUBLIC_DIR, 'favicon.ico'))) {
    res.writeHead(204, { 'Content-Type': 'image/x-icon' });
    res.end();
    return;
  }

  const filePath = resolveFilePath(req.url);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isCacheable = ext === '.jpg' || ext === '.png' || ext === '.webp' || ext === '.woff2';

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': isCacheable ? 'public, max-age=31536000, immutable' : 'no-cache'
    };

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Motion Drink 3D Website running at:`);
    console.log(`   👉 http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

module.exports = server;

