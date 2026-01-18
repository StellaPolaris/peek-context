#!/usr/bin/env bash
set -euo pipefail

REPO="StellaPolaris/peek-context"
APP_NAME="Claude Tools Viewer"
INSTALL_DIR="/Applications"

log() {
  echo "[installer] $*"
}

fail() {
  echo "[installer] $*" >&2
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

get_platform_url() {
  local json_path="$1"
  local arch="$2"
  python3 - "$json_path" "$arch" <<'PY'
import json
import sys

path = sys.argv[1]
arch = sys.argv[2]

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

platforms = data.get("platforms") or {}
arch_keys = ["aarch64", "arm64"] if arch == "aarch64" else ["x86_64", "x64", "amd64"]

for key, value in platforms.items():
    if "darwin" in key and any(k in key for k in arch_keys):
        url = value.get("url")
        if url:
            print(url)
            sys.exit(0)

sys.exit(1)
PY
}

main() {
  require_command curl
  require_command tar
  require_command python3

  local os_name
  os_name="$(uname -s)"
  if [[ "$os_name" != "Darwin" ]]; then
    fail "Unsupported OS: ${os_name}. Only macOS is supported."
  fi

  local arch_raw arch
  arch_raw="$(uname -m)"
  case "$arch_raw" in
    arm64|aarch64)
      arch="aarch64"
      ;;
    *)
      fail "Unsupported architecture: ${arch_raw}. Apple Silicon only."
      ;;
  esac

  local release_base
  if [[ -n "${VERSION:-}" ]]; then
    local version="${VERSION#v}"
    release_base="https://github.com/${REPO}/releases/download/v${version}"
  else
    release_base="https://github.com/${REPO}/releases/latest/download"
  fi

  local tmp_dir
  tmp_dir="$(mktemp -d)"
  TMP_DIR="$tmp_dir"
  trap 'rm -rf "${TMP_DIR:-}"' EXIT

  local latest_json="${tmp_dir}/latest.json"
  log "Fetching release metadata..."
  curl -fsSL "${release_base}/latest.json" -o "$latest_json"

  local asset_url
  asset_url="$(get_platform_url "$latest_json" "$arch")"
  if [[ -z "$asset_url" ]]; then
    fail "Unable to locate a download for this platform in latest.json."
  fi

  local asset_name asset_path checksum_url checksum_path
  asset_name="$(basename "$asset_url")"
  asset_path="${tmp_dir}/${asset_name}"
  checksum_url="${asset_url}.sha256"
  checksum_path="${tmp_dir}/${asset_name}.sha256"

  log "Downloading ${asset_name}..."
  curl -fsSL "$asset_url" -o "$asset_path"

  log "Verifying checksum..."
  curl -fsSL "$checksum_url" -o "$checksum_path"
  local expected actual
  expected="$(awk '{print $1}' "$checksum_path")"
  actual="$(sha256_file "$asset_path")"
  if [[ "$expected" != "$actual" ]]; then
    fail "Checksum mismatch. Expected ${expected}, got ${actual}."
  fi

  log "Extracting archive..."
  tar -xzf "$asset_path" -C "$tmp_dir"

  local app_path
  app_path="$(find "$tmp_dir" -maxdepth 2 -name '*.app' -print -quit)"
  if [[ -z "$app_path" ]]; then
    fail "Unable to locate .app bundle in archive."
  fi

  local install_dir="$INSTALL_DIR"
  if [[ ! -w "$install_dir" ]]; then
    install_dir="${HOME}/Applications"
    log "System Applications not writable, installing to ${install_dir} instead."
  fi
  mkdir -p "$install_dir"
  local install_path="${install_dir}/${APP_NAME}.app"
  if [[ -d "$install_path" ]]; then
    log "Replacing existing install at ${install_path}"
    rm -rf "$install_path"
  fi

  log "Installing to ${install_path}..."
  if command -v ditto >/dev/null 2>&1; then
    ditto "$app_path" "$install_path"
  else
    cp -R "$app_path" "$install_path"
  fi

  log "Removing quarantine attribute..."
  xattr -dr com.apple.quarantine "$install_path" >/dev/null 2>&1 || true

  log "Install complete. Launch ${APP_NAME} from Applications."
}

main "$@"
