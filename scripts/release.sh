#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CARGO_TOML="${ROOT_DIR}/src-tauri/Cargo.toml"
CHANGELOG="${ROOT_DIR}/CHANGELOG.md"

RUN_NPM=1
RUN_LINT=1
DO_COMMIT=1
DO_TAG=1
ALLOW_DIRTY=0
VERSION_INPUT=""

usage() {
  cat <<'USAGE'
Usage: scripts/release.sh [options] <major|minor|patch|x.y.z>

Options:
  --no-npm         Skip npm lockfile update
  --no-lint        Skip npm lint
  --no-commit      Skip git commit
  --no-tag         Skip git tag
  --allow-dirty    Allow running with uncommitted changes
  -h, --help       Show help
USAGE
}

fail() {
  echo "[release] $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-npm)
      RUN_NPM=0
      ;;
    --no-lint)
      RUN_LINT=0
      ;;
    --no-commit)
      DO_COMMIT=0
      ;;
    --no-tag)
      DO_TAG=0
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

IN_GIT=0
if command -v git >/dev/null 2>&1; then
  if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    IN_GIT=1
    if [[ "$ALLOW_DIRTY" -eq 0 ]]; then
      if [[ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]]; then
        fail "Working tree not clean. Commit/stash changes or use --allow-dirty."
      fi
    fi
  fi
fi

"$ROOT_DIR/scripts/version.sh" "$VERSION_INPUT"

new_version="$(awk -F '\"' '/^version =/ { print $2; exit }' "$CARGO_TOML")"
if [[ -z "$new_version" ]]; then
  fail "Unable to read version from ${CARGO_TOML}."
fi

python3 - "$CHANGELOG" "$new_version" <<'PY'
import datetime
import os
import sys

path = sys.argv[1]
version = sys.argv[2]
date = datetime.date.today().isoformat()

if os.path.exists(path):
    content = open(path, "r", encoding="utf-8").read()
else:
    content = "# Changelog\n\n"

if f"## [{version}]" in content:
    sys.exit(0)

lines = content.splitlines()
out = []
inserted = False
for line in lines:
    out.append(line)
    if not inserted and line.startswith("# Changelog"):
        out.append("")
        out.append(f"## [{version}] - {date}")
        out.append("### Added")
        out.append("- TBD")
        out.append("")
        inserted = True

if not inserted:
    out = ["# Changelog", "", f"## [{version}] - {date}", "### Added", "- TBD", ""]
    out.extend(lines)

with open(path, "w", encoding="utf-8") as handle:
    handle.write("\n".join(out).rstrip() + "\n")
PY

if [[ "$RUN_NPM" -eq 1 ]]; then
  (cd "$ROOT_DIR" && npm install --package-lock-only --ignore-scripts --no-audit --fund=false)
fi

if [[ "$RUN_LINT" -eq 1 ]]; then
  (cd "$ROOT_DIR" && npm run lint)
fi

if [[ "$IN_GIT" -eq 1 ]]; then
  if [[ "$DO_COMMIT" -eq 1 ]]; then
    git -C "$ROOT_DIR" add -A
    if ! git -C "$ROOT_DIR" diff --cached --quiet; then
      git -C "$ROOT_DIR" commit -m "chore: release v${new_version}"
    else
      echo "[release] No changes to commit."
    fi
  fi

  if [[ "$DO_TAG" -eq 1 ]]; then
    git -C "$ROOT_DIR" tag "v${new_version}"
  fi
else
  echo "[release] Git repo not detected; skipping commit/tag."
fi

echo "[release] Ready to push: git push && git push --tags"
