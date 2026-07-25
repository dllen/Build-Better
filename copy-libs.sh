#!/usr/bin/env bash
set -euo pipefail

BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Copying external libraries ==="
echo ""

# pdfcraft
echo "[1/2] Copying pdfcraft..."
PDFCRAFT_OUT=""
if [ -d "/Users/shichaopeng/Work/self-dir/my-code/pdfcraft/out" ]; then
    PDFCRAFT_OUT="/Users/shichaopeng/Work/self-dir/my-code/pdfcraft/out"
elif [ -d "/Users/shichaopeng/Work/self-dir/my-code/pdfcraft/.next" ]; then
    PDFCRAFT_OUT="/Users/shichaopeng/Work/self-dir/my-code/pdfcraft/.next/static"
fi

if [ -n "$PDFCRAFT_OUT" ]; then
    mkdir -p "$BUILD_DIR/public/pdf-tools"
    cp -r "$PDFCRAFT_OUT"/* "$BUILD_DIR/public/pdf-tools/" 2>/dev/null || true
    echo "  Copied from $PDFCRAFT_OUT"
else
    echo "  No build output found. Run: cd /Users/shichaopeng/Work/self-dir/my-code/pdfcraft && cnpm install && npm run build"
fi

# office-website
echo ""
echo "[2/2] Copying office-website..."
OFFICE_OUT=""
if [ -d "/Users/shichaopeng/Work/self-dir/my-code/office-website/out" ]; then
    OFFICE_OUT="/Users/shichaopeng/Work/self-dir/my-code/office-website/out"
fi

if [ -n "$OFFICE_OUT" ]; then
    mkdir -p "$BUILD_DIR/public/office"
    cp -r "$OFFICE_OUT"/* "$BUILD_DIR/public/office/" 2>/dev/null || true
    echo "  Copied from $OFFICE_OUT"
else
    echo "  No build output found. Run: cd /Users/shichaopeng/Work/self-dir/my-code/office-website && cnpm install && npm run build"
fi

echo ""
echo "=== Done ==="
