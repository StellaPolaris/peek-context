#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="aarch64-apple-darwin"
REPO="StellaPolaris/peek-context"

PUSH=1
DRAFT=0
RUN_LINT=1
ALLOW_DIRTY=0
VERSION_INPUT=""

usage() {
  cat <<'USAGE'
Usage: scripts/release-local.sh [options] <major|minor|patch|x.y.z>

Options:
  --draft         Create a draft GitHub release (default: publish)
  --no-push       Skip git push (commit and tag remain local)
  --no-lint       Skip npm run lint
  --allow-dirty   Allow uncommitted changes before starting
  -h, --help      Show help
USAGE
}

fail() {
  echo "[release-local] $*" >&2
  exit 1
}

require_command() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || fail "Missing required command: ${cmd}"
}

sha256_file() {
  local file="$1"
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file" | awk '{print $1}'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file" | awk '{print $1}'
    return
  fi
  fail "Missing sha256 tool (shasum or sha256sum)."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --draft)
      DRAFT=1
      ;;
    --no-push)
      PUSH=0
      ;;
    --no-lint)
      RUN_LINT=0
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$VERSION_INPUT" ]]; then
        VERSION_INPUT="$1"
      else
        usage
        exit 1
      fi
      ;;
  esac
  shift
done

if [[ -z "$VERSION_INPUT" ]]; then
  usage
  exit 1
fi

require_command git
require_command npm
require_command gh

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "Not in a git repository."
fi

if [[ "$ALLOW_DIRTY" -eq 0 ]]; then
  if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
    fail "Working tree not clean. Commit/stash changes or use --allow-dirty."
  fi
fi

"$ROOT_DIR/scripts/version.sh" "$VERSION_INPUT"

new_version="$(awk -F '\"' '/^version =/ { print $2; exit }' "$ROOT_DIR/src-tauri/Cargo.toml")"
if [[ -z "$new_version" ]]; then
  fail "Unable to read version from Cargo.toml."
fi
tag="v${new_version}"

(cd "$ROOT_DIR" && npm install --package-lock-only --ignore-scripts --no-audit --fund=false)

if [[ "$RUN_LINT" -eq 1 ]]; then
  (cd "$ROOT_DIR" && npm run lint)
fi

git -C "$ROOT_DIR" add -A
if ! git -C "$ROOT_DIR" diff --cached --quiet; then
  git -C "$ROOT_DIR" commit -m "chore: release ${tag}"
fi

git -C "$ROOT_DIR" tag "$tag"

if [[ "$PUSH" -eq 1 ]]; then
  git -C "$ROOT_DIR" push
  git -C "$ROOT_DIR" push --tags
fi

key_path="${TAURI_SIGNING_PRIVATE_KEY:-$HOME/.tauri/claude-tools-viewer.key}"
if [[ ! -f "$key_path" ]]; then
  fail "Signing key not found: ${key_path}"
fi

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ]]; then
  read -r -s -p "TAURI_SIGNING_PRIVATE_KEY_PASSWORD: " TAURI_SIGNING_PRIVATE_KEY_PASSWORD
  echo ""
fi

export TAURI_SIGNING_PRIVATE_KEY="$key_path"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD

(cd "$ROOT_DIR" && npm run tauri:build -- --target "$TARGET")

bundle_dir="$ROOT_DIR/src-tauri/target/${TARGET}/release/bundle"
if [[ ! -d "$bundle_dir" ]]; then
  fail "Bundle directory not found: ${bundle_dir}"
fi

mapfile -t assets < <(find "$bundle_dir" -type f \( -name "*.app.tar.gz" -o -name "*.app.tar.gz.sig" -o -name "*.dmg" -o -name "latest.json" \))

if [[ ${#assets[@]} -eq 0 ]]; then
  fail "No release assets found in ${bundle_dir}"
fi

for file in "${assets[@]}"; do
  case "$file" in
    *.app.tar.gz|*.dmg)
      checksum_path="${file}.sha256"
      sha256_file "$file" > "$checksum_path"
      assets+=("$checksum_path")
      ;;
  esac
done

release_args=(--repo "$REPO" --title "$tag")
if [[ "$DRAFT" -eq 1 ]]; then
  release_args+=(--draft)
fi

if gh release view "$tag" --repo "$REPO" >/dev/null 2>&1; then
  gh release upload "$tag" --repo "$REPO" --clobber "${assets[@]}"
else
  gh release create "$tag" "${assets[@]}" "${release_args[@]}"
fi

echo "[release-local] Done. Release ${tag} created with ${#assets[@]} assets."
