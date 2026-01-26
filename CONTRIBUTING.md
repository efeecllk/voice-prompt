# Contributing to Voice Prompt

Welcome to Voice Prompt! We're excited you're interested in contributing.

## Quick Links

| Resource | Link |
|----------|------|
| GitHub | [efeecllk/voice-prompt](https://github.com/efeecllk/voice-prompt) |
| Issues | [Report a Bug](https://github.com/efeecllk/voice-prompt/issues) |

## Project Maintainer

| Role | Name | GitHub |
|------|------|--------|
| Lead Maintainer | efeecllk | [@efeecllk](https://github.com/efeecllk) |

**Version**: X:efeecllk

## How to Contribute

### Bug Fixes
Minor bug fixes can go directly to a pull request. Make sure to:
- Reference the related issue (if one exists)
- Include a clear description of the fix
- Test your changes locally

### New Features
For new features, please open a [GitHub Discussion](https://github.com/efeecllk/voice-prompt/discussions) or create an issue first. This helps us:
- Discuss the best approach
- Avoid duplicate work
- Ensure the feature fits the project vision

### Questions & Setup Help
Having trouble getting started? Open an issue with the `question` label.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) stable
- **macOS**: Xcode Command Line Tools
- **Windows**: Visual Studio Build Tools with C++ workload

### Getting Started

```bash
# Clone the repository
git clone https://github.com/efeecllk/voice-prompt.git
cd voice-prompt

# Install dependencies
pnpm install

# Run in development
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Pull Request Guidelines

1. **Test locally** - Ensure your changes work on your platform
2. **Run linting** - Execute `pnpm lint` before submitting
3. **Keep PRs focused** - One issue/feature per PR
4. **Write clear descriptions** - Explain what changed and why
5. **Update documentation** - If your change affects user-facing features

## Tech Stack

Understanding the stack helps with contributions:

| Layer | Technology |
|-------|------------|
| Framework | Tauri 2.0 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Backend | Rust |
| APIs | OpenAI Whisper & GPT |

## AI-Generated Code Policy

**AI-Assisted PRs Welcome!**

We embrace AI tools in the development process. If you use AI assistance:
- Test the code thoroughly before submitting
- Ensure you understand what the code does
- Be ready to explain and maintain it

AI-assisted contributions receive equal consideration as traditionally-written code.

## Current Focus Areas

- Cross-platform stability (macOS & Windows)
- User experience improvements
- Performance optimization
- New output format templates

## Code of Conduct

Be respectful and constructive. We're all here to build something great together.

---

Thank you for contributing to Voice Prompt!
