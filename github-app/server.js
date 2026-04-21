import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { handlePullRequest, verifyWebhookSignature } from './app.js';

const PORT = process.env.PORT || 3001;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;
const APP_ID = process.env.APP_ID;
const PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH;

// Get installation access token
async function getInstallationToken(installationId) {
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
    iss: APP_ID,
  };

  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const data = await response.json();
  return data.token;
}

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
        const installationId = payload.installation?.id;

        if (!installationId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No installation ID' }));
          return;
        }

        const token = await getInstallationToken(installationId);
        const result = await handlePullRequest(payload, token);
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
