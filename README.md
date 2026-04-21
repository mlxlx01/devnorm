# DevNorm

> AI-powered code quality for teams

**DevNorm** is an AI-native code review platform that brings intelligent, automated code review to development teams. Built on the principles of the dotclaude project, DevNorm helps teams enforce code quality standards, catch bugs early, and maintain healthy codebases.

## Features

- **AI-Powered Review**: Uses advanced AI models to analyze code and identify bugs, logic errors, and maintainability issues
- **Team-Oriented**: Built for teams with collaboration features, quality dashboards, and GitHub integration
- **Lightweight CLI**: `devnorm review ./src` — review any codebase in seconds
- **GitHub Actions Ready**: Integrate into your CI/CD pipeline with a single step
- **GitHub App**: Automatic PR review with AI-powered analysis
- **Customizable Rules**: Define team-specific code quality rules

## Quick Start

### Installation

```bash
npm install -g devnorm
```

### Initialize

```bash
devnorm init
```

Set your API key:

```bash
export MINIMAX_API_KEY=your_api_key
```

### Review Code

```bash
# Review current directory
devnorm review

# Review specific path
devnorm review ./src

# Review with custom model
devnorm review ./src --model M2.7-highspeed
```

### GitHub App (Beta)

Automatically review Pull Requests with AI. See [github-app/README.md](github-app/README.md) for setup.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    DevNorm Cloud                    │
│  (Team Dashboard, GitHub Integration, Analytics)   │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│                   DevNorm CLI                       │
│  (Local code review, Git hooks, Pre-commit)         │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│              AI Model (MiniMax, Claude, etc.)       │
└─────────────────────────────────────────────────────┘
```

## Open Source

The core CLI and rules engine are open source under the MIT license. Cloud features (team collaboration, GitHub App, quality dashboards) are available as a subscription service.

## License

MIT
