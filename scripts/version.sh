#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CARGO_TOML="${ROOT_DIR}/src-tauri/Cargo.toml"
PACKAGE_JSON="${ROOT_DIR}/package.json"

usage() {
  echo "Usage: $(basename "$0") [major|minor|patch|x.y.z]"
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

current_version="$(awk -F '\"' '/^version =/ { print $2; exit }' "$CARGO_TOML")"
if [[ -z "$current_version" ]]; then
  echo "Unable to read version from ${CARGO_TOML}" >&2
  exit 1
fi

input="$1"
if [[ "$input" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  new_version="$input"
else
  IFS='.' read -r major minor patch <<< "$current_version"
  case "$input" in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      usage
      exit 1
      ;;
  esac
  new_version="${major}.${minor}.${patch}"
fi

perl -0pi -e "s/^version = \".*?\"/version = \"${new_version}\"/m" "$CARGO_TOML"
perl -0pi -e "s/\"version\":\\s*\"[^\"]*\"/\"version\": \"${new_version}\"/" "$PACKAGE_JSON"

echo "Version bumped: ${current_version} -> ${new_version}"
