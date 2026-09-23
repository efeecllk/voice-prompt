# Voice Prompt: notes for agents

Tauri v2 tray app: React/TypeScript frontend in `src/`, Rust backend in `src-tauri/`.
Records audio, transcribes and translates it through the OpenAI API, and can paste the
result into a terminal.

## Commands

- `pnpm install`, `pnpm build` (type-check + frontend build)
- `pnpm tauri dev` to run the app
- `pnpm tauri build --debug --no-bundle` compiles everything, as CI does

Use pnpm, never npm.

## Rules

- **Conventional Commits** (`feat:`, `fix:`, `docs:`, `ci:`, `refactor:`, `chore:`).
  release-please derives the next version and the changelog from them: `feat` bumps
  minor, `fix` bumps patch.
- **Never bump versions, edit CHANGELOG.md, or push tags by hand.** Merging the release
  PR that release-please opens is the only way to release, and it is a human decision:
  agents do not merge it.
- The version lives in `package.json` (`tauri.conf.json` reads it from there) and
  `src-tauri/Cargo.toml`; release-please updates both.
- Tauri Rust crates and their `@tauri-apps/*` npm packages must share major.minor
  (the tauri CLI refuses to build otherwise; CI builds through it). Upgrade them together.
- Verify before claiming something works: run the build, and for UI or Rust changes run
  the app.

## Where things are

- `src/lib/openai.ts`: transcription (`gpt-transcribe`) and chat calls
- `src/hooks/useMicRecorder.ts`: MediaRecorder plumbing shared by all recording UIs
- `src-tauri/src/lib.rs`: tray, window placement, the `TERMINALS` table, and
  send-to-terminal (CGEvent on macOS, xdotool/wtype on Linux)
- `.github/workflows/release.yml`: release-please, then signed builds for all platforms
  and the Homebrew tap update
