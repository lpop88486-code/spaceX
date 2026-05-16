#!/bin/bash

echo "=== Netlify Build Check ==="
echo "Running the same build Netlify uses before any push..."
echo ""

cd "$(dirname "$0")"

PNPM=/nix/store/61lr9izijvg30pcribjdxgjxvh3bysp4-pnpm-10.26.1/bin/pnpm

# Set env vars exactly as netlify.toml [build.environment] does
export PORT=3000
export BASE_PATH="/"

# Run the exact build command from netlify.toml
if $PNPM --filter @workspace/spacex-starlink build; then
  echo ""
  echo "✓ Build passed — safe to push to GitHub / Netlify."
  echo ""
  # Show output size
  if [ -d "artifacts/spacex-starlink/dist/public" ]; then
    SIZE=$(du -sh artifacts/spacex-starlink/dist/public 2>/dev/null | cut -f1)
    echo "  Output folder: artifacts/spacex-starlink/dist/public ($SIZE)"
  fi
else
  echo ""
  echo "✗ Build FAILED — fix the errors above before pushing."
  echo "  Do NOT run 'Push to GitHub' until this passes."
  exit 1
fi
