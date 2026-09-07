const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');

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

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

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