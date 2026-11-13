/**
 * LOCAL MOTION 3D WEBSITE - DUAL-MODE SERVER & SERVERLESS HANDLER
 * Runs seamlessly on:
 * 1. Local Node.js (`node server.js` or `npm start`)
 * 2. AWS Lambda / Serverless / AWS Amplify (`app.handler`)
 * 3. Vercel / Netlify / Render / Railway HTTP functions
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

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

const BINARY_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.ico', '.woff', '.woff2', '.ttf']);

// Resolve incoming URL path to absolute local file path
function resolveFilePath(reqUrl) {
  let cleanUrl = (reqUrl || '/').split('?')[0];
  if (cleanUrl === '/' || cleanUrl === '') {
    cleanUrl = '/index.html';
  }

  const decoded = decodeURIComponent(cleanUrl);
  const safeRelative = path.normalize(decoded).replace(/^(\.\.[\/\\])+/, '');
  const absolutePath = path.join(PUBLIC_DIR, safeRelative);

  // Directory traversal defense
  if (!absolutePath.startsWith(PUBLIC_DIR)) {
    return null;
  }
  return absolutePath;
}

// ----------------------------------------------------------------------------
// 1. STANDARD NODE.JS HTTP REQUEST HANDLER (Local + Vercel + Netlify + Containers)
// ----------------------------------------------------------------------------
function handleNodeRequest(req, res) {
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
      // If requested file not found, fall back to index.html for SPA routing
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.stat(indexPath, (idxErr, idxStats) => {
        if (idxErr || !idxStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        fs.createReadStream(indexPath).pipe(res);
      });
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
}

// ----------------------------------------------------------------------------
// 2. AWS LAMBDA / SERVERLESS / API GATEWAY HANDLER
// ----------------------------------------------------------------------------
async function lambdaHandler(event, context) {
  try {
    const rawPath = event.rawPath || event.path || '/';
    if (rawPath === '/favicon.ico' && !fs.existsSync(path.join(PUBLIC_DIR, 'favicon.ico'))) {
      return { statusCode: 204, headers: { 'Content-Type': 'image/x-icon' }, body: '' };
    }

    let filePath = resolveFilePath(rawPath);
    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isBinary = BINARY_EXTENSIONS.has(ext);
    const isCacheable = ext === '.jpg' || ext === '.png' || ext === '.webp' || ext === '.woff2';

    const fileBuffer = fs.readFileSync(filePath);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': isCacheable ? 'public, max-age=31536000, immutable' : 'no-cache',
        'Access-Control-Allow-Origin': '*'
      },
      isBase64Encoded: isBinary,
      body: isBinary ? fileBuffer.toString('base64') : fileBuffer.toString('utf-8')
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: `Internal Server Error: ${err.message}`
    };
  }
}

// Create native Node server
const server = http.createServer(handleNodeRequest);

// Start server when executed directly via CLI
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Motion Drink 3D Website running at:`);
    console.log(`   👉 http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

module.exports = handleNodeRequest;
module.exports.server = server;
module.exports.handler = lambdaHandler;
module.exports.handleNodeRequest = handleNodeRequest;
