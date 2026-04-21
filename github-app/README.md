# DevNorm GitHub App

> Automatic AI-powered code review on GitHub Pull Requests

## Setup

### 1. Create a GitHub App

1. Go to https://github.com/settings/apps/new
2. Fill in:
   - **GitHub App name**: `devnorm` (or your choice)
   - **Homepage URL**: `https://github.com/mlxlx01/devnorm`
   - **Webhook URL**: Your server URL (e.g., `https://your-server.com/webhook`)
   - **Webhook secret**: Generate a random string

3. Under **Permissions**, set:
   - **Pull requests**: Read & Write
   - **Repository contents**: Read (for accessing code)
   - **Issues**: Read & Write (for posting comments)

4. Subscribe to events: **Pull requests**

### 2. Deploy

```bash
# Set environment variables
export GITHUB_TOKEN=your_github_pat
export GITHUB_WEBHOOK_SECRET=your_webhook_secret
export MINIMAX_API_KEY=your_minimax_key
export PORT=3001

# Start server
node github-app/server.js
```

### 3. Install the App

1. Go to your GitHub App settings
2. Click "Install App"
3. Select the repositories you want to enable

## How It Works

1. When a PR is opened or updated, GitHub sends a webhook
2. DevNorm fetches the diff
3. AI analyzes the code changes
4. Review comments are posted directly on the PR

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token with repo and comment permissions |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying webhook authenticity |
| `MINIMAX_API_KEY` | MiniMax API key for AI analysis |
| `PORT` | Server port (default: 3001) |
