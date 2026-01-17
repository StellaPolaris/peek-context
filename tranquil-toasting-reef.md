# Production Release Plan: Claude Tools Viewer

**GitHub Repository:** `StellaPolaris/peek-context`

## Overview

Ship Claude Tools Viewer publicly with:
- Curl-based installer (no Apple notarization required)
- Semantic versioning with git tags
- Self-update capability from within the app
- GitHub Actions for automated releases

---

## Phase 1: Repository Cleanup & Version Sync

### 1.1 Update `.gitignore`
**File:** `/Users/p/Projects/tool-viewer/.gitignore`

Add Rust/Tauri entries:
```gitignore
# Rust
target/
*.rs.bk

# Tauri build artifacts
*.dmg
*.app
*.AppImage
*.deb
*.msi

# Signing keys (never commit)
*.key
*.pem

# Environment
.env
.env.local
```

### 1.2 Sync Versions
- Remove `"version": "0.1.0"` from `tauri.conf.json` (will inherit from Cargo.toml)
- Update `package.json` version to `"0.1.0"` to match

### 1.3 Create Version Bump Script
**File:** `/Users/p/Projects/tool-viewer/scripts/version.sh`

Script that:
- Reads current version from `Cargo.toml`
- Accepts `major`, `minor`, `patch`, or direct version number
- Updates both `Cargo.toml` and `package.json`

---

## Phase 2: Self-Update Feature

### 2.1 Add Dependencies

**`src-tauri/Cargo.toml`** - Add:
```toml
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
```

**`package.json`** - Add to dependencies:
```json
"@tauri-apps/plugin-updater": "^2.0.0",
"@tauri-apps/plugin-process": "^2.0.0"
```

### 2.2 Configure Updater

**`src-tauri/tauri.conf.json`** - Add to `bundle`:
```json
"bundle": {
  "createUpdaterArtifacts": true
}
```

Add new `plugins` section:
```json
"plugins": {
  "updater": {
    "pubkey": "<GENERATED_PUBLIC_KEY>",
    "endpoints": [
      "https://github.com/StellaPolaris/peek-context/releases/latest/download/latest.json"
    ]
  }
}
```

### 2.3 Update Capabilities

**`src-tauri/capabilities/default.json`** - Add permissions:
```json
"updater:default",
"process:allow-restart"
```

### 2.4 Register Plugins

**`src-tauri/src/lib.rs`** - Add plugin registration:
```rust
.plugin(tauri_plugin_updater::Builder::new().build())
.plugin(tauri_plugin_process::init())
```

### 2.5 Frontend Update Component

**New file:** `src/components/UpdateChecker.tsx`

Component that:
- Checks for updates on app launch
- Shows notification when update available
- Downloads and installs update with progress
- Relaunches app after update

Integrate into `SettingsView.tsx` or as a global notification.

### 2.6 Generate Signing Keys (One-time)

```bash
npx tauri signer generate -w ~/.tauri/claude-tools-viewer.key
```

Save public key to `tauri.conf.json`, private key to GitHub Secrets.

---

## Phase 3: Install Script

**File:** `/Users/p/Projects/tool-viewer/scripts/install.sh`

### Features:
1. **Architecture detection** - `uname -m` for arm64 vs x86_64
2. **Platform detection** - macOS initially, extensible to Linux
3. **Download from GitHub Releases** - Fetch latest or specific version
4. **Checksum verification** - Download and verify SHA256
5. **Gatekeeper bypass** - `xattr -dr com.apple.quarantine`
6. **Installation** - Copy `.app` to `~/Applications/`
7. **Error handling** - Wrapped in `main()` function, `set -euo pipefail`

### Install command:
```bash
curl -fsSL https://raw.githubusercontent.com/StellaPolaris/peek-context/main/scripts/install.sh | bash
```

### Key security practices:
- Use `-fsSL` flags (fail silently, follow redirects, show errors)
- HTTPS only
- Verify checksums before installation
- Support `VERSION` env var for pinning

---

## Phase 4: GitHub Actions CI/CD

### 4.1 Build Workflow
**File:** `.github/workflows/build.yml`

Triggers on: PR and push to main
- Runs `npm ci`
- Runs `npm run lint`
- Runs `npm run tauri:build` (verify it compiles)

### 4.2 Release Workflow
**File:** `.github/workflows/release.yml`

Triggers on: push tags `v*`

Matrix build:
- `aarch64-apple-darwin` (Apple Silicon)
- `x86_64-apple-darwin` (Intel Mac)
- (Optional: Linux targets)

Uses `tauri-apps/tauri-action@v0` to:
- Build platform binaries
- Create signed updater artifacts
- Generate `latest.json` for auto-updater
- Create GitHub Release (draft)
- Upload all artifacts with checksums

### Required GitHub Secrets:
- `TAURI_SIGNING_PRIVATE_KEY` - From key generation
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - Key password

---

## Phase 5: Documentation

### 5.1 Update README.md

Add installation section:
```markdown
## Installation

### Quick Install
curl -fsSL https://raw.githubusercontent.com/StellaPolaris/peek-context/main/scripts/install.sh | bash

### Manual Install
Download from Releases, extract, move to Applications, then:
xattr -dr com.apple.quarantine "/Applications/Claude Tools Viewer.app"
```

### 5.2 Create VERSIONING.md

Document:
- Semantic versioning strategy
- How to bump versions
- Release process (tag -> CI -> draft release -> publish)
- How auto-updates work

### 5.3 Create CHANGELOG.md

Format:
```markdown
# Changelog

## [0.2.0] - YYYY-MM-DD
### Added
- Self-update feature
- Curl-based installer

## [0.1.0] - Initial Release
- Tool discovery and browsing
- Inline editing
- Project matrix view
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `.gitignore` | Edit - add Rust/Tauri entries |
| `package.json` | Edit - sync version, add plugins |
| `src-tauri/Cargo.toml` | Edit - add updater/process plugins |
| `src-tauri/tauri.conf.json` | Edit - remove version, add updater config |
| `src-tauri/capabilities/default.json` | Edit - add permissions |
| `src-tauri/src/lib.rs` | Edit - register plugins |
| `scripts/install.sh` | Create |
| `scripts/version.sh` | Create |
| `.github/workflows/build.yml` | Create |
| `.github/workflows/release.yml` | Create |
| `src/components/UpdateChecker.tsx` | Create |
| `README.md` | Edit - add installation docs |
| `VERSIONING.md` | Create |
| `CHANGELOG.md` | Create |

---

## Implementation Order

1. **Foundation** - .gitignore, version sync, version.sh script
2. **Self-update backend** - Rust plugins, config, capabilities
3. **Self-update frontend** - UpdateChecker component
4. **CI/CD** - GitHub workflows
5. **Install script** - scripts/install.sh
6. **Documentation** - README, VERSIONING, CHANGELOG
7. **First release** - Generate keys, tag v0.2.0, publish

---

## Verification

After implementation:
1. Run `npm run tauri:build` - verify it produces signed artifacts
2. Test install script locally with a GitHub release
3. Verify auto-update by installing old version, releasing new one
4. Test on both arm64 and x86_64 Macs if available
