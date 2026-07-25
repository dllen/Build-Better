#!/usr/bin/env bash
set -euo pipefail

BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"

# Install cnpm if not exists
if ! command -v cnpm &> /dev/null; then
    echo "Installing cnpm..."
    npm install -g cnpm --registry=https://registry.npmmirror.com
fi

echo "=== Building external libraries ==="
echo ""

# pdfcraft
echo "[1/2] Building pdfcraft..."
cd /Users/shichaopeng/Work/self-dir/my-code/pdfcraft
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    cnpm install
fi
echo "  Running build..."
npm run build
echo "  Copying to public/pdf-tools..."
mkdir -p "$BUILD_DIR/public/pdf-tools"
cp -r out/* "$BUILD_DIR/public/pdf-tools/" 2>/dev/null || cp -r .next/static "$BUILD_DIR/public/pdf-tools/" 2>/dev/null || true
echo "  Done!"

# office-website
echo ""
echo "[2/2] Building office-website..."
cd /Users/shichaopeng/Work/self-dir/my-code/office-website
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    cnpm install
fi
echo "  Running build..."
npm run build
echo "  Copying to public/office..."
mkdir -p "$BUILD_DIR/public/office"
cp -r out/* "$BUILD_DIR/public/office/" 2>/dev/null || true
echo "  Done!"

echo ""
echo "=== All builds complete! ==="
cd "$BUILD_DIR"
