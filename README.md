# Voice Prompt

A lightweight cross-platform app that converts speech to text and processes it with AI. Perfect for crafting prompts for AI tools like Claude and ChatGPT - speak in your native language, get polished English output ready to use.

<img width="819" height="551" alt="Screenshot 2026-01-26 at 13 31 22" src="https://github.com/user-attachments/assets/c0dc7739-166b-4ca1-99cb-4009b3cab221" />


![macOS](https://img.shields.io/badge/macOS-10.15+-blue?logo=apple)
![Windows](https://img.shields.io/badge/Windows-10+-0078D6?logo=windows)
![Apple Silicon](https://img.shields.io/badge/Apple%20Silicon-M1%2FM2%2FM3-black?logo=apple)
![Intel Mac](https://img.shields.io/badge/Intel%20Mac-Supported-gray?logo=apple)
![Tauri](https://img.shields.io/badge/Tauri-2.0-orange?logo=tauri)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What's New in v0.2.0

- **Windows Support** - Full Windows 10+ support with native installer
- **Intel Mac Support** - Now works on both Apple Silicon and Intel Macs
- **Custom Output Formats** - Create your own AI processing templates with voice
- **My Prompts Library** - Save and organize your favorite outputs
- **Favorites System** - Star important translations for quick access

---

## Installation

### macOS (Recommended)

**We strongly recommend using Homebrew for macOS.** It handles installation, updates, and uninstallation automatically.

```bash
brew tap efeecllk/voice-prompt
brew install --cask voice-prompt
```

Works on both **Apple Silicon** (M1/M2/M3) and **Intel** Macs automatically.

**Why Homebrew?**
- Automatic architecture detection (Apple Silicon vs Intel)
- Easy updates with `brew upgrade`
- Clean uninstall with `brew uninstall`
- No manual DMG mounting needed

> **Note**: Direct DMG downloads are available in [Releases](https://github.com/efeecllk/voice-prompt/releases) but are not recommended. Use Homebrew instead.

### Windows

Download from [Releases](https://github.com/efeecllk/voice-prompt/releases):
- `Voice.Prompt_x.x.x_x64.msi` - Windows Installer (recommended)
- `Voice.Prompt_x.x.x_x64-setup.exe` - NSIS Installer

**Note**: You may see a SmartScreen warning on first run. Click "More info" → "Run anyway".

### Update

**macOS:**
```bash
brew update && brew upgrade --cask voice-prompt
```

**Windows:** Download the latest version from [Releases](https://github.com/efeecllk/voice-prompt/releases).

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Menu Bar / System Tray** | Lives in your menu bar (macOS) or system tray (Windows), always one click away |
| **Voice Recording** | One-click recording with visual feedback and waveform animation |
| **Speech-to-Text** | Powered by OpenAI Whisper API - industry-leading accuracy |
| **Multi-Language** | 20+ source languages including auto-detect |
| **Global Shortcut** | Trigger recording from any app (default: `Cmd/Ctrl + Shift + Space`) |
| **Dark Mode** | Follows your system theme automatically |

### Output Formats

| Format | Description |
|--------|-------------|
| **Standard Translation** | Clean, accurate English translation |
| **Formal English** | Professional business English |
| **Casual English** | Friendly, conversational tone |
| **Ralph Wiggum Mode** | Transforms simple requests into detailed Claude Code prompts |
| **Custom Formats** | Create your own AI processing templates |

### Organization

| Feature | Description |
|---------|-------------|
| **History** | Access your last 20 translations |
| **Favorites** | Star important outputs for quick access |
| **My Prompts** | Save outputs to your personal prompt library |
| **One-Click Copy** | Copy any text instantly to clipboard |

---

## Feature Details

### 1. Voice Recording

Click the microphone button or use the global shortcut to start recording. The app shows:
- Recording duration timer
- Live audio waveform visualization
- Clear stop button

Recording stops automatically when you click stop, and processing begins immediately.

### 2. Output Format Selection

Choose how your speech is processed:

- **Default Translation** - Translates to natural English
- **Formal Business** - Professional tone for work contexts
- **Casual Conversation** - Relaxed, friendly output
- **Ralph Wiggum Mode** - Special mode that expands simple voice requests into detailed, well-structured prompts for Claude Code

### 3. Custom Output Formats

Create your own processing templates:

1. Go to **Settings**
2. In "Create Your Own Output Format", click the **microphone icon**
3. **Describe what you want** in your voice (e.g., "Convert my speech into git commit messages")
4. The AI generates a custom format with name, description, and system prompt
5. Optionally select an **emoji icon** for easy recognition
6. Click **Save**

Your custom format appears in the Output Format dropdown and shows in the header when active.

### 4. My Prompts Library

Save and organize your favorite outputs:

1. **From Favorites**: Click the document icon on any favorite to save it
2. **Access**: Click the document icon in the header to view My Prompts
3. **Edit**: Click any prompt to edit its name, description, or content
4. **Copy**: Copy individual fields (name, description, content) with one click
5. **Delete**: Remove prompts you no longer need

### 5. History & Favorites

- **History Tab**: Shows your last 20 recordings with source and output
- **Favorites Tab**: Shows starred items for quick access
- **Star Button**: Click to add/remove from favorites
- **Copy Button**: Copy the output text instantly
- **Save to My Prompts**: Save favorites to your prompt library

### 6. Global Shortcut

Trigger Voice Prompt from any application:

| Shortcut | Platform |
|----------|----------|
| `Cmd + Shift + Space` | macOS (default) |
| `Ctrl + Shift + Space` | Windows (default) |

Change in Settings → Global Shortcut. Available options:
- `Cmd/Ctrl + Shift + Space`
- `Cmd/Ctrl + Option/Alt + Space`
- `Cmd/Ctrl + Shift + .`
- `Cmd/Ctrl + Option/Alt + V`

### 7. Theme Support

- **System** (default) - Follows your OS appearance
- **Light** - Always light mode
- **Dark** - Always dark mode

---

## Supported Languages

| Language | Code | Language | Code |
|----------|------|----------|------|
| Auto-detect | auto | Korean | ko |
| Turkish | tr | Chinese | zh |
| English | en | Arabic | ar |
| Spanish | es | Hindi | hi |
| French | fr | Dutch | nl |
| German | de | Polish | pl |
| Italian | it | Swedish | sv |
| Portuguese | pt | Danish | da |
| Russian | ru | Norwegian | no |
| Japanese | ja | Finnish | fi |
| Greek | el | | |

---

## Configuration

### API Key

Your OpenAI API key is stored securely on your device.

1. Get your API key from [platform.openai.com](https://platform.openai.com/api-keys)
2. Open Voice Prompt → Settings
3. Paste your API key
4. Click Save

### API Costs

| Service | Cost |
|---------|------|
| Whisper (Speech-to-Text) | ~$0.006/minute |
| GPT-4.1-nano (Processing) | ~$0.0001/request |

**Estimated**: ~$0.05/day for 50 translations

---

## Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) stable
- **macOS**: Xcode Command Line Tools
- **Windows**: Visual Studio Build Tools with C++ workload

### Steps

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

| Layer | Technology |
|-------|------------|
| Framework | Tauri 2.0 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Speech-to-Text | OpenAI Whisper |
| Text Processing | OpenAI GPT-4.1-nano |

---

## Troubleshooting

### macOS: "App is damaged" or "Cannot be opened"

```bash
xattr -cr /Applications/Voice\ Prompt.app
```

### Windows: SmartScreen Warning

Click "More info" → "Run anyway". This appears because the app isn't code-signed.

### API Key Not Working

1. Check your API key at [platform.openai.com](https://platform.openai.com/api-keys)
2. Ensure you have billing enabled
3. Try generating a new key

### Recording Not Working

1. Grant microphone permission when prompted
2. Check System Settings → Privacy & Security → Microphone (macOS)
3. Check Settings → Privacy → Microphone (Windows)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Made with [Tauri](https://tauri.app)
