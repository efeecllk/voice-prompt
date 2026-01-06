# Voice Prompt

A lightweight macOS menu bar app that converts Turkish speech to English text.

![Voice Prompt Demo](docs/demo.gif)

## Features

- **Speech-to-Text**: Record Turkish voice and convert to text using OpenAI Whisper
- **Translation**: Automatically translate Turkish text to English using GPT-4o-mini
- **Menu Bar App**: Lives in your macOS menu bar for quick access
- **Global Shortcut**: Trigger recording from anywhere (default: `Cmd+Shift+R`)
- **History**: Keeps your last 20 translations
- **Dark/Light Mode**: Follows your system preference or set manually
- **Lightweight**: ~10MB app size thanks to Tauri

## Installation

### Download

Download the latest `.dmg` from [Releases](https://github.com/YOUR_USERNAME/voice-prompt/releases).

### Build from Source

Prerequisites:
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/voice-prompt.git
cd voice-prompt

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Usage

1. Click the menu bar icon or press `Cmd+Shift+R`
2. Go to Settings (gear icon) and enter your OpenAI API key
3. Click the microphone button or press `Space` to start recording
4. Speak in Turkish
5. Click again to stop recording
6. Your translated text will appear - click the copy button to copy

## API Key

You need an OpenAI API key to use this app:

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Paste it in the app's Settings

### Cost Estimate

- **Whisper API**: $0.006 per minute of audio
- **GPT-4o-mini**: ~$0.15 per 1M input tokens

Typical usage (50 translations/day) costs approximately **$0.05/day**.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+R` | Toggle recording (global) |
| `Space` | Toggle recording (when app is focused) |

You can customize the global shortcut in Settings.

## Tech Stack

- **Framework**: [Tauri 2.0](https://tauri.app/)
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **APIs**: OpenAI Whisper + GPT-4o-mini

## Development

```bash
# Start development server
pnpm tauri dev

# Run linter
pnpm lint

# Build for production
pnpm tauri build
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
