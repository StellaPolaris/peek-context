# Versioning

Claude Tools Viewer follows semantic versioning.

## Source of Truth

- `src-tauri/Cargo.toml` is the canonical version.
- `package.json` is kept in sync for frontend tooling.

## Bumping Versions

Use the version helper:

```bash
./scripts/version.sh patch
./scripts/version.sh minor
./scripts/version.sh major
./scripts/version.sh 0.2.0
```

## Release Process

1. Run `./scripts/release.sh` with the desired bump (example: `./scripts/release.sh minor`).
2. Review `CHANGELOG.md` and adjust the entry.
3. Push commits and tags.
4. GitHub Actions builds a draft release with updater artifacts.
5. Publish the draft release.

## Auto Updates

The app uses the Tauri updater plugin and `latest.json` from GitHub Releases. When a new release is published, the app can download and install it from within the UI.
