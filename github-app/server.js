import http from 'http';
import { handlePullRequest, verifyWebhookSignature } from './app.js';

const PORT = process.env.PORT || 3001;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const signature = req.headers['x-hub-signature-256'] || '';
      const event = req.headers['x-github-event'];

      if (WEBHOOK_SECRET && !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
      }

      if (event !== 'pull_request') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ignored', event }));
        return;
      }

      try {
        const payload = JSON.parse(body);
        const result = await handlePullRequest(payload, GITHUB_TOKEN);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error('[DevNorm] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`[DevNorm] Webhook server running on port ${PORT}`);
});
