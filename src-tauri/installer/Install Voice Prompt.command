#!/bin/bash

# Voice Prompt Installer
# This script installs Voice Prompt and removes macOS quarantine

APP_NAME="Voice Prompt.app"
SOURCE="/Volumes/Voice Prompt/$APP_NAME"
DEST="/Applications/$APP_NAME"

echo "================================"
echo "  Voice Prompt Installer"
echo "================================"
echo ""

# Check if source exists
if [ ! -d "$SOURCE" ]; then
    echo "Error: Could not find Voice Prompt.app"
    echo "Please make sure the DMG is mounted."
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

# Remove old version if exists
if [ -d "$DEST" ]; then
    echo "Removing old version..."
    rm -rf "$DEST"
fi

# Copy to Applications
echo "Installing Voice Prompt..."
cp -R "$SOURCE" "$DEST"

# Remove quarantine attribute
echo "Configuring permissions..."
xattr -cr "$DEST"

echo ""
echo "Installation complete!"
echo ""

# Ask to open
read -p "Open Voice Prompt now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "$DEST"
fi

echo ""
echo "You can close this window now."
