# Changelog

## [0.4.0](https://github.com/efeecllk/voice-prompt/compare/v0.3.0...v0.4.0) (2026-09-23)


### Features

* **onboarding:** guided first-run setup and Accessibility check ([b36f8e4](https://github.com/efeecllk/voice-prompt/commit/b36f8e44426bcad0a2aac53a62c02d5dffe74fb2))
* **recording:** capture audio natively so recording works with the window hidden ([4ef4ecc](https://github.com/efeecllk/voice-prompt/commit/4ef4ecc899c7d03df8340a15b99afc66e573a660))
* **shortcut:** dictate from any app with sound cues and automatic copy ([50eaa0b](https://github.com/efeecllk/voice-prompt/commit/50eaa0bad66db2166801809c2696e145c4f0fc3f))
* **shortcut:** global shortcut starts and stops recording ([623a21b](https://github.com/efeecllk/voice-prompt/commit/623a21b19f1e3c57c7394dbf0b0287b08d05a6b6))
* **tauri:** add Linux platform support ([c693561](https://github.com/efeecllk/voice-prompt/commit/c693561e37cabc1274502608059e2e3971907cea))
* **transcribe:** switch from whisper-1 to gpt-transcribe ([7cbe9ec](https://github.com/efeecllk/voice-prompt/commit/7cbe9ec3547676acd0d78ba78352d41033bd5a7a))
* **updater:** check for updates on launch and install in one click ([6b2d554](https://github.com/efeecllk/voice-prompt/commit/6b2d55404ea550a60de1e6fa03a72c3b0e51cf13))


### Bug Fixes

* **ci:** correct misspelled rust-toolchain action in Linux release ([c6e40d4](https://github.com/efeecllk/voice-prompt/commit/c6e40d4b6f3cb7af852982536bc43455c6e67684))
* **ci:** drop macOS version requirement from generated cask ([b175866](https://github.com/efeecllk/voice-prompt/commit/b17586640b8f4e39db966262eb3cda5c5a6eaab0))
* **ci:** repair update-homebrew workflow YAML ([f6f4714](https://github.com/efeecllk/voice-prompt/commit/f6f47148387ed6111ca432f25b3e7cc0b26a9c36))
* **ci:** run the Homebrew tap update as a job in the macOS release ([b910430](https://github.com/efeecllk/voice-prompt/commit/b9104307f9f633660cf82889718cbfa0444b7b5e))
* **ci:** use current depends_on macos syntax in generated cask ([cf684e9](https://github.com/efeecllk/voice-prompt/commit/cf684e97faaa011cfc21602864f1d9435b0d678c))

## 0.3.0

- **Send to Terminal** - Paste prompts directly into Ghostty, Warp, iTerm2, or Terminal.app
- **Auto-paste** - Automatically send generated prompts to your terminal
- **Auto-submit** - Optionally press Enter after pasting for hands-free workflow
- **Smart Terminal Detection** - Auto-detects running terminals, prioritizes dev terminals
- **History Send** - Send any history item directly to your terminal

## 0.2.0

- **Windows Support** - Full Windows 10+ support with native installer
- **Intel Mac Support** - Now works on both Apple Silicon and Intel Macs
- **Custom Output Formats** - Create your own AI processing templates with voice
- **My Prompts Library** - Save and organize your favorite outputs
- **Favorites System** - Star important translations for quick access
