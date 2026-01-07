# Voice Prompt

A lightweight macOS menu bar app that converts speech to text and translates it to English. Perfect for crafting prompts for AI tools like Claude and ChatGPT - speak in your native language, get clean English output.

**Ralph Wiggum Mode**: Turn simple voice requests into detailed, well-structured prompts ready for Claude Code.

<!-- Upload video by dragging into GitHub editor to get user-attachments URL -->

![macOS](https://img.shields.io/badge/macOS-10.15+-blue?logo=apple)
![Apple Silicon](https://img.shields.io/badge/Apple%20Silicon-M1%2FM2%2FM3-black?logo=apple)
![Tauri](https://img.shields.io/badge/Tauri-2.0-orange?logo=tauri)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Installation

```bash
brew tap efeecllk/voice-prompt
brew install --cask voice-prompt
```

That's it! Open Voice Prompt from Applications.

**Requirements:**
- macOS 10.15+ (Catalina or later)
- Apple Silicon
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Update

```bash
brew update && brew upgrade --cask voice-prompt
```

---

## Features

- **Menu Bar App** - Lives in your menu bar, always accessible
- **Voice Recording** - One-click recording with visual feedback
- **Multi-Language Support** - 20+ source languages + auto-detect
- **Speech-to-Text** - Powered by OpenAI Whisper API
- **Translation** - To English using GPT-4o-mini
- **Custom Prompts** - Choose output style (standard, formal, casual, or Ralph Wiggum mode!)
- **One-Click Copy** - Copy source or translated text instantly
- **History** - Access your last 20 translations
- **Global Shortcut** - Trigger from anywhere (customizable)
- **Dark Mode** - Follows system theme automatically
- **Lightweight** - Fast and minimal resource usage

---

## Quick Start

1. **Install** - Run `brew tap efeecllk/voice-prompt && brew install --cask voice-prompt`
2. **Get API Key** - Sign up at [OpenAI](https://platform.openai.com/api-keys)
3. **Configure** - Click menu bar icon → Settings → Paste your API key
4. **Record** - Click microphone or use `Cmd + Shift + Space`
5. **Speak** - Talk in any supported language
6. **Copy** - Click to copy the translation

---

## Supported Languages

Auto-detect | Turkish | English | Spanish | French | German | Italian | Portuguese | Russian | Japanese | Korean | Chinese | Arabic | Hindi | Dutch | Polish | Swedish | Danish | Norwegian | Finnish | Greek

---

## Configuration

### API Key

Your API key is stored locally in the app data directory and persists across app restarts.

1. Get your API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Open Voice Prompt settings
3. Paste your API key
4. Click Save

### Global Shortcut

Default: `Cmd + Shift + Space`

Available options:
- `Cmd + Shift + Space`
- `Cmd + Option + Space`
- `Cmd + Shift + .`
- `Cmd + Option + V`

### Theme

- **System** (default) - Follows macOS appearance
- **Light** - Always light mode
- **Dark** - Always dark mode

---

## API Costs

| Service | Cost |
|---------|------|
| Whisper | ~$0.006/minute |
| GPT-4o-mini | ~$0.00015/translation |

**Estimated**: ~$0.05/day for 50 translations

---

## Build from Source

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

### Tech Stack

- **Framework**: Tauri 2.0
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **APIs**: OpenAI Whisper + GPT-4o-mini

---

## Roadmap

- [ ] Intel Mac support
- [ ] Windows/Linux support
- [ ] Auto-update mechanism
- [ ] More output languages
- [ ] Streaming transcription
- [ ] Offline mode (local Whisper)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with [Tauri](https://tauri.app)
