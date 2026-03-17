# Contributing to AgentSwarp

Thank you for your interest in contributing to AgentSwarp! This project is built by the community, and every contribution matters - whether it's code, docs, bug reports, or ideas.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0 or later
- [Git](https://git-scm.com)
- (Optional) [Docker](https://docker.com) for running the full stack
- (Optional) [Ollama](https://ollama.ai) for local LLM testing

### Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/raynr7/agentswarm.git
cd agentswarm

# 3. Install dependencies
bun install

# 4. Copy the environment file
cp .env.example .env

# 5. Start the dev server
bun dev
```

The app will be available at `http://localhost:3000`.

## Code Style

- **TypeScript** everywhere - no `any` types unless absolutely necessary
- **Prettier** for formatting - run `bun format` before committing
- **ESLint** for linting - run `bun lint` to check
- Keep functions small and well-named
- Write comments for "why", not "what"
- Prefer composition over inheritance

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** - keep commits focused and atomic

3. **Test your changes**:
   ```bash
   bun test
   ```

4. **Push and open a PR**:
   ```bash
   git push origin feat/your-feature-name
   ```

5. Fill out the PR template - describe what changed and why

6. Wait for review - we aim to review all PRs within 48 hours

## Good First Issues

New to the project? Look for issues labeled [good first issue](https://github.com/raynr7/agentswarm/labels/good%20first%20issue). These are:

- Well-scoped tasks with clear requirements
- Great for learning the codebase
- Always have a maintainer available to help

## Reporting Bugs

Use the [bug report template](https://github.com/raynr7/agentswarm/issues/new?template=bug_report.md) and include:

- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Bun version, Docker version)

## Requesting Features

Use the [feature request template](https://github.com/raynr7/agentswarm/issues/new?template=feature_request.md) and describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Community

- [Discord](https://discord.gg/agentswarm) - Chat with contributors and get help
- [Issues](https://github.com/raynr7/agentswarm/issues) - Report bugs and request features
- [Discussions](https://github.com/raynr7/agentswarm/discussions) - Share ideas and ask questions

## Code of Conduct

Be kind, be respectful, be constructive. We're all here to build something great together.

---

Thank you for helping make AI automation accessible to everyone.
