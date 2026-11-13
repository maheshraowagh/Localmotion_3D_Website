/**
 * LOCAL MOTION 3D WEBSITE - PRODUCTION & SERVERLESS HTTP SERVER
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Ensure @vercel/nft traces frames folder
path.join(__dirname, 'frames');
path.join(__dirname, 'public');

const PORT = process.env.PORT || 3000;
const DIRS = [
  __dirname,
  path.join(__dirname, 'public'),
  process.cwd(),
  path.join(process.cwd(), 'public')
];

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

function findExistingFile(relPath) {
  for (const dir of DIRS) {
    const candidate = path.join(dir, relPath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function handleRequest(req, res) {
  let reqUrl = (req.url || '/').split('?')[0];
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }

  const decoded = decodeURIComponent(reqUrl);
  const safeRelative = path.normalize(decoded).replace(/^(\.\.[\/\\])+/, '');

  if (safeRelative === 'favicon.ico') {
    const fav = findExistingFile('favicon.ico');
    if (!fav) {
      res.writeHead(204, { 'Content-Type': 'image/x-icon' });
      res.end();
      return;
    }
  }

  const filePath = findExistingFile(safeRelative);
  if (!filePath) {
    // If an image, script, or stylesheet is not found, return 404 (NEVER return HTML!)
    const ext = path.extname(safeRelative).toLowerCase();
    if (ext && ext !== '.html') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${safeRelative}`);
      return;
    }

    // Fall back to index.html for root or SPA page routes
    const indexPath = findExistingFile('index.html');
    if (indexPath) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      fs.createReadStream(indexPath).pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const isCacheable = ext === '.jpg' || ext === '.png' || ext === '.webp' || ext === '.woff2';
  const stats = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': isCacheable ? 'public, max-age=31536000, immutable' : 'no-cache'
  });

  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Local Motion 3D Website running at http://localhost:${PORT}\n`);
  });
}

module.exports = handleRequest;
module.exports.server = server;
