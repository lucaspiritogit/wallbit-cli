#!/usr/bin/env sh
set -eu

REPO="lucaspiritogit/wallbit-cli"
BIN_NAME="wallbit-cli"
INSTALL_DIR="/usr/local/bin"

fail() {
  printf "%s\n" "$1" >&2
  exit 1
}

if command -v curl >/dev/null 2>&1; then
  FETCH_TOOL="curl"
elif command -v wget >/dev/null 2>&1; then
  FETCH_TOOL="wget"
else
  fail "curl or wget is required"
fi

if ! command -v tar >/dev/null 2>&1; then
  fail "tar is required"
fi

sha256_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
    return
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
    return
  fi
  fail "sha256sum or shasum is required"
}

VERSION="${WALLBIT_CLI_VERSION:-}"
if [ -z "$VERSION" ]; then
  if [ "$FETCH_TOOL" = "curl" ]; then
    VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | awk -F '"' '/"tag_name":/ { print $4 }')"
  else
    VERSION="$(wget -qO- "https://api.github.com/repos/${REPO}/releases/latest" | awk -F '"' '/"tag_name":/ { print $4 }')"
  fi
fi
[ -n "$VERSION" ] || fail "Could not resolve wallbit-cli version"

UNAME_S="$(uname -s)"
UNAME_M="$(uname -m)"

case "$UNAME_S" in
  Linux) OS="Linux" ;;
  Darwin) OS="Darwin" ;;
  *) fail "Unsupported operating system: $UNAME_S" ;;
esac

case "$UNAME_M" in
  x86_64|amd64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) fail "Unsupported CPU architecture: $UNAME_M" ;;
esac

ASSET="${BIN_NAME}_${OS}_${ARCH}.tar.gz"
CHECKSUMS_ASSET="SHA256SUMS"
BASE_URL="https://github.com/${REPO}/releases/download/${VERSION}"
ASSET_URL="${BASE_URL}/${ASSET}"
CHECKSUMS_URL="${BASE_URL}/${CHECKSUMS_ASSET}"

TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t wallbit-cli)"
trap 'rm -rf "$TMP_DIR"' EXIT INT TERM

ARCHIVE_PATH="${TMP_DIR}/${ASSET}"
CHECKSUMS_PATH="${TMP_DIR}/${CHECKSUMS_ASSET}"

if [ "$FETCH_TOOL" = "curl" ]; then
  curl -fsSL "$ASSET_URL" -o "$ARCHIVE_PATH"
  curl -fsSL "$CHECKSUMS_URL" -o "$CHECKSUMS_PATH"
else
  wget -qO "$ARCHIVE_PATH" "$ASSET_URL"
  wget -qO "$CHECKSUMS_PATH" "$CHECKSUMS_URL"
fi

EXPECTED_HASH="$(awk -v asset="$ASSET" '$2 == asset { print $1 }' "$CHECKSUMS_PATH")"
[ -n "$EXPECTED_HASH" ] || fail "Could not find checksum for ${ASSET}"

ACTUAL_HASH="$(sha256_file "$ARCHIVE_PATH")"
[ "$ACTUAL_HASH" = "$EXPECTED_HASH" ] || fail "Checksum verification failed for ${ASSET}"

tar -xzf "$ARCHIVE_PATH" -C "$TMP_DIR"
[ -f "${TMP_DIR}/${BIN_NAME}" ] || fail "Archive did not contain ${BIN_NAME}"

if [ ! -d "$INSTALL_DIR" ]; then
  if [ -w "$(dirname "$INSTALL_DIR")" ]; then
    mkdir -p "$INSTALL_DIR"
  elif command -v sudo >/dev/null 2>&1; then
    sudo mkdir -p "$INSTALL_DIR"
  else
    fail "Cannot create ${INSTALL_DIR}. Run with sufficient permissions."
  fi
fi

TARGET_PATH="${INSTALL_DIR}/${BIN_NAME}"
if [ -w "$INSTALL_DIR" ]; then
  mv "${TMP_DIR}/${BIN_NAME}" "$TARGET_PATH"
  chmod +x "$TARGET_PATH"
elif command -v sudo >/dev/null 2>&1; then
  sudo mv "${TMP_DIR}/${BIN_NAME}" "$TARGET_PATH"
  sudo chmod +x "$TARGET_PATH"
else
  fail "No write access to ${INSTALL_DIR} and sudo is unavailable."
fi

printf "Installed %s %s to %s\n" "$BIN_NAME" "$VERSION" "$TARGET_PATH"
