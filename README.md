# Voice Prompt

A lightweight macOS menu bar app that converts Turkish speech to text and translates it to English in real-time.

![macOS](https://img.shields.io/badge/macOS-10.15+-blue?logo=apple)
![Tauri](https://img.shields.io/badge/Tauri-2.0-orange?logo=tauri)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Menu Bar App** - Lives in your menu bar, always accessible
- **Voice Recording** - One-click recording with visual feedback
- **Speech-to-Text** - Powered by OpenAI Whisper API
- **Translation** - Turkish to English using GPT-4o-mini
- **One-Click Copy** - Copy Turkish or English text instantly
- **History** - Access your last 20 translations
- **Global Shortcut** - Trigger from anywhere (customizable)
- **Dark Mode** - Automatic theme support
- **Lightweight** - ~15MB app size
- **Secure Storage** - API key stored in macOS Keychain

## Installation

### Download

Download the latest `.dmg` from [Releases](https://github.com/efeecllk/voice-prompt/releases).

### Build from Source

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

## Usage

1. Click the menu bar icon or use the global shortcut
2. Click the microphone button to start recording
3. Speak in Turkish
4. Click again to stop recording
5. Wait for transcription and translation
6. Click to copy the text you need

## Configuration

### API Key

You need an OpenAI API key to use this app:

1. Get your API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Open Voice Prompt settings
3. Paste your API key

### Global Shortcut

Default: `Cmd + Shift + Space`

Available options:
- `Cmd + Shift + Space`
- `Cmd + Option + Space`
- `Cmd + Shift + .`
- `Cmd + Option + V`

## Tech Stack

- **Framework**: Tauri 2.0
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **APIs**: OpenAI Whisper + GPT-4o-mini

---

## Roadmap

### v1.1 - UX Improvements

- [ ] Click outside to close window
- [ ] Escape key to close
- [ ] Loading animations during processing
- [ ] Recording waveform visualization
- [ ] Recording timer display

### v1.2 - Custom Prompt Templates

- [ ] **Custom Translation Prompts** - Define your own translation style
  - Formal/informal tone selection
  - Industry-specific terminology
  - Custom instructions (e.g., "keep technical terms in English")
- [ ] **Prompt Presets** - Save and switch between different prompt templates
- [ ] **Context Awareness** - Add context for better translations

### v1.3 - Multi-Language Support

- [ ] Support more language pairs
- [ ] Auto-detect source language
- [ ] Bidirectional translation (EN ↔ TR)

### v2.0 - Advanced Features

- [ ] **Streaming Transcription** - Real-time text as you speak
- [ ] **Paste to Active App** - Paste directly to focused application
- [ ] **Text-to-Speech** - Listen to translations
- [ ] **Offline Mode** - Local Whisper model support
- [ ] **Search History** - Find past translations
- [ ] **Export History** - CSV/JSON export
- [ ] **Favorites** - Star important translations

### Future Considerations

- [x] ~~Secure API storage (macOS Keychain)~~ - Implemented!
- [ ] Auto-update mechanism
- [ ] Keyboard shortcuts within app
- [ ] Sound effects for recording
- [ ] Haptic feedback
- [ ] Windows/Linux support

---

## API Costs

| Service | Cost |
|---------|------|
| Whisper | ~$0.006/minute |
| GPT-4o-mini | ~$0.00015/translation |

**Estimated**: ~$0.05/day for 50 translations

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with ❤️ using [Tauri](https://tauri.app)
