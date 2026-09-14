const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');
const fs = require('fs');

// Configure reliable DNS servers to prevent Windows querySrv ECONNREFUSED on MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e);
}

// Force IPv4 resolution to prevent ETIMEDOUT issues on local environments/ISPs that do not support IPv6 SMTP
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { createServer } = require('http');
const next = require('next');
const { initSocketServer } = require('./src/lib/socket');
const { startBackgroundCleanup } = require('./src/lib/cron');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

/** Simple MIME-type lookup for common media/file types */
function getMimeType(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const mimes = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
    pdf: 'application/pdf', zip: 'application/zip',
    txt: 'text/plain', json: 'application/json',
  };
  return mimes[ext] || 'application/octet-stream';
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(
        req.url,
        `http://${req.headers.host || 'localhost'}`
      );

      if (parsedUrl.pathname.startsWith('/api/socket')) {
        return;
      }

      const origin = req.headers.origin || '*';

      // CORS
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept, x-device-id, x-device-name, x-device-type, x-device-os, x-device-browser'
      );
      res.setHeader('Access-Control-Max-Age', '86400');

      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url}`
      );

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      // ─── Direct file streaming for runtime-uploaded media ────────────────
      // Next.js static asset cache does NOT pick up files written to /public at
      // runtime — they only appear after a rebuild. We intercept /uploads/ and
      // /transit_uploads/ here and stream directly from disk so profile pictures,
      // story images, and message attachments are available immediately.
      if (req.method === 'GET') {
        const pathname = parsedUrl.pathname;
        let diskPath = null;
        if (pathname.startsWith('/uploads/')) {
          const filename = pathname.slice('/uploads/'.length);
          if (filename && !filename.includes('..')) {
            diskPath = path.join(process.cwd(), 'public', 'uploads', filename);
          }
        } else if (pathname.startsWith('/transit_uploads/')) {
          const filename = pathname.slice('/transit_uploads/'.length);
          if (filename && !filename.includes('..')) {
            diskPath = path.join(process.cwd(), 'public', 'transit_uploads', filename);
          }
        }
        if (diskPath && fs.existsSync(diskPath)) {
          const stat = fs.statSync(diskPath);
          res.setHeader('Content-Type', getMimeType(diskPath));
          res.setHeader('Content-Length', stat.size);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          res.statusCode = 200;
          fs.createReadStream(diskPath).pipe(res);
          return;
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      await handle(req, res);
    } catch (err) {
      console.error('>>> Next handler error:', err);

      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  });

  // Initialize Socket.IO
  initSocketServer(server);

  // Initialize Zero-Store Ephemeral Media and Message Cleaner
  startBackgroundCleanup();

  server.listen(port, hostname, () => {
    console.log('\n====================================');
    console.log(`🚀 Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log('✅ Ready for Flutter / Web requests');
    console.log('====================================\n');
  });

  server.on('error', (err) => {
    console.error('❌ Server Error:', err);
    process.exit(1);
  });
}).catch((err) => {
  console.error('❌ Failed to prepare Next.js app:', err);
  process.exit(1);
});