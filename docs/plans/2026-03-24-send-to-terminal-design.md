# Send to Terminal — Design

## Overview
Add "Send to Terminal" capability so generated prompts auto-paste directly into a running terminal (Ghostty, Warp, Terminal.app, iTerm2) instead of requiring manual copy-paste.

## User Flow
1. Voice Prompt generates text → copies to clipboard (existing)
2. If **auto-paste ON**: immediately sends Cmd+V to selected terminal
3. If **auto-paste OFF**: user clicks "Send to Terminal" button on ResultCard
4. If **auto-submit ON** (default OFF): also sends Enter after paste

## Settings
- **Target Terminal**: Dropdown of known terminals, auto-detects running ones, pre-selects first match
- **Auto-paste to terminal**: Toggle (default OFF)
- **Auto-submit after paste**: Toggle (default OFF), only visible when auto-paste is ON

## Technical Approach
- **Keystroke injection via AppleScript**: `osascript` sends Cmd+V (and optionally Enter) to target terminal app
- **Process detection**: `pgrep` or `ps` to detect running terminals
- **Tauri shell plugin**: Execute osascript from Rust backend via shell command
- **Requires**: macOS Accessibility permission (one-time OS grant)

## Known Terminals
| ID | App Name (for AppleScript) | Process Name |
|----|---------------------------|--------------|
| ghostty | Ghostty | ghostty |
| warp | Warp | Warp |
| terminal | Terminal | Terminal |
| iterm2 | iTerm2 | iTerm2 |

## Architecture
- **Rust**: New Tauri commands `send_to_terminal` and `detect_terminals`
- **Store**: New fields `targetTerminal`, `autoPaste`, `autoSubmit`
- **Settings UI**: Terminal picker + toggles
- **ResultCard**: New "Send to Terminal" button
- **useAudioRecorder**: Auto-paste trigger after result generation
