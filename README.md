# Claude Tools Viewer

A desktop app for discovering, browsing, and editing Claude Code tools across global, project, and plugin scopes.

## Installation

### Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/StellaPolaris/peek-context/main/scripts/install.sh | bash
```

### Manual Install

Download the latest release, extract, move the app to Applications, then remove Gatekeeper quarantine:

```bash
xattr -dr com.apple.quarantine "/Applications/Claude Tools Viewer.app"
```

### Pin a Version

```bash
VERSION=0.1.0 curl -fsSL https://raw.githubusercontent.com/StellaPolaris/peek-context/main/scripts/install.sh | bash
```

## Development

```bash
npm install
npm run tauri:dev
```

```bash
npm run tauri:build
```
