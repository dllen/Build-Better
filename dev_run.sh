#!/usr/bin/env bash
set -euo pipefail

echo "=== Build-Better Local Development ==="
echo ""

# Install cnpm if not exists
if ! command -v cnpm &> /dev/null; then
    echo "Installing cnpm..."
    npm install -g cnpm --registry=https://registry.npmmirror.com
fi

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    cnpm install
fi

# Copy external libs if available
echo "Copying external libs..."
if [ -d "../pdfcraft/out" ]; then
    mkdir -p public/pdf-tools
    cp -r ../pdfcraft/out/* public/pdf-tools/
    echo "  pdfcraft copied"
fi

if [ -d "../office-website/out" ]; then
    mkdir -p public/office
    cp -r ../office-website/out/* public/office/
    echo "  office-website copied"
fi

# Start dev server
echo ""
echo "Starting dev server at http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""
npm run dev
