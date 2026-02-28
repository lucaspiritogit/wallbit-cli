#!/usr/bin/env sh
set -eu

REPO="${WALLBIT_CLI_REPO:-lucaspiritogit/wallbit-cli}"
VERSION="latest"
INSTALL_DIR="${WALLBIT_CLI_INSTALL_DIR:-$HOME/.local/bin}"
BINARY_NAME="wallbit-cli"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      REPO="$2"
      shift 2
      ;;
    --version)
      VERSION="$2"
      shift 2
      ;;
    --install-dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux) OS_PART="linux" ;;
  Darwin) OS_PART="darwin" ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64) ARCH_PART="x64" ;;
  arm64|aarch64) ARCH_PART="arm64" ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

ASSET="wallbit-cli-${OS_PART}-${ARCH_PART}"
API_URL="https://api.github.com/repos/${REPO}/releases"

if [ "$VERSION" = "latest" ]; then
  RELEASE_URL="${API_URL}/latest"
else
  RELEASE_URL="${API_URL}/tags/${VERSION}"
fi

echo "Fetching release metadata from ${REPO}..."
ASSET_URL="$(curl -fsSL "$RELEASE_URL" | awk -v asset="$ASSET" -F '"' '$4=="browser_download_url" && $6 ~ asset"$" {print $6; exit}')"

if [ -z "$ASSET_URL" ]; then
  echo "Could not find asset: $ASSET"
  echo "Try setting --repo OWNER/REPO or --version vX.Y.Z"
  exit 1
fi

mkdir -p "$INSTALL_DIR"
TMP_FILE="$(mktemp)"

echo "Downloading $ASSET..."
curl -fL "$ASSET_URL" -o "$TMP_FILE"

chmod +x "$TMP_FILE"
mv "$TMP_FILE" "$INSTALL_DIR/$BINARY_NAME"

echo "Installed to: $INSTALL_DIR/$BINARY_NAME"
echo "Make sure $INSTALL_DIR is in your PATH"
