# DevNorm

> AI-powered code quality for teams

[![CI](https://github.com/mlxlx01/devnorm/actions/workflows/ci.yml/badge.svg)](https://github.com/mlxlx01/devnorm/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**DevNorm** is an AI-native code review platform that brings intelligent, automated code review to development teams. Built on the principles of the dotclaude project, DevNorm helps teams enforce code quality standards, catch bugs early, and maintain healthy codebases.

## Features

- **AI-Powered Review**: Uses advanced AI models to analyze code and identify bugs, logic errors, and maintainability issues
- **Team-Oriented**: Built for teams with collaboration features, quality dashboards, and GitHub integration
- **Lightweight CLI**: `devnorm review ./src` — review any codebase in seconds
- **GitHub App**: Automatic PR review with AI-powered analysis — install once, every PR gets reviewed
- **Customizable Rules**: Define team-specific code quality rules

## Quick Start

### CLI

```bash
npm install -g devnorm
devnorm init
export MINIMAX_API_KEY=your_api_key

# Review code
devnorm review ./src
```

### GitHub App

Install the DevNorm GitHub App to automatically review Pull Requests:

1. Go to [GitHub App setup](https://github.com/apps/devnorm-ai)
2. Install on your repositories
3. Every PR will be automatically reviewed by AI

## Demo

PRs automatically get AI-powered reviews:

![DevNorm PR Review](https://user-images.githubusercontent.com/placeholder/devnorm-review.png)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    DevNorm Cloud                     │
│  (Team Dashboard, GitHub Integration, Analytics)   │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                   DevNorm CLI                        │
│  (Local code review, Git hooks, Pre-commit)        │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              AI Model (MiniMax, Claude, etc.)       │
└─────────────────────────────────────────────────────┘
```

## Open Source

The core CLI and rules engine are open source under the MIT license. Cloud features (team collaboration, GitHub App, quality dashboards) are available as a subscription service.

## License

MIT
