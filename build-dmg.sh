#!/bin/bash

# Build script for UberNotes DMG
set -e

echo "Building UberNotes DMG..."

# Clean previous builds
rm -rf dist/

# Build the application
npm run build

echo "DMG build completed successfully!"
echo "You can find the DMG in the dist/ directory"
echo ""
echo "Installation instructions for users:"
echo "1. Download the DMG file"
echo "2. Double-click to mount it"
echo "3. Drag UberNotes to Applications folder"
echo "4. Launch UberNotes from Applications"
echo "5. Create your first widget with Cmd+N or Cmd+Shift+N"
