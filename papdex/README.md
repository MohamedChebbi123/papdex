<p align="center">
  <img src="public/papdex-logo.png" alt="Papdex logo" width="120" />
</p>

<h1 align="center">Papdex</h1>

<p align="center">
  A desktop file and document organizer for students.
</p>

Papdex is an Electron + React desktop app that organizes your study files around an
academic hierarchy: **Academic Years → Semesters → Subjects → Virtual Folders → Files**.
Everything is stored locally in a SQLite database — no account, no cloud, no sync required.

## Features

- Organize files by academic year, semester, and subject
- Group files into virtual folders within a subject
- Built-in preview for images, video, PDF, Markdown, and syntax-highlighted code
- Local-first storage via SQLite (`better-sqlite3`) — your files stay on your machine
- Light and dark themes
- Available for Windows, macOS, and Linux

## Installation

Download the latest installer for your platform from the [Releases](../../releases) page:

- **Windows** — `Papdex-Windows-<version>-Setup.exe`
- **macOS** — `Papdex-Mac-<version>-Installer.dmg`
- **Linux** — `Papdex-Linux-<version>.AppImage`

## Development

```bash
npm install
npm run dev       # Start Electron app in development mode (Vite + Electron hot-reload)
```

Other scripts:

```bash
npm run build     # tsc + vite build + electron-builder (produces a distributable)
npm run lint      # ESLint with zero warnings tolerance
npm run preview   # Preview the renderer only (no Electron process)
```

## Tech stack

- [Electron](https://www.electronjs.org/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for bundling and dev server
- [Tailwind CSS](https://tailwindcss.com/) v4 + [shadcn/ui](https://ui.shadcn.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for local storage
- [electron-builder](https://www.electron.build/) for packaging

See [CLAUDE.md](CLAUDE.md) for a deeper look at the architecture (IPC channels, process
boundaries, file preview system).

## License

No license has been chosen yet for this project.
