#!/bin/bash

# Auto-upload script setup
echo "Setting up auto-upload script..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install

# Make the script executable
chmod +x auto-upload.js

# Create the source folders if they don't exist
NOTES_FOLDER="/Users/rohan/Documents/notes"
PYQS_FOLDER="/Users/rohan/Documents/pyqs"

echo "Checking source folders..."

if [ ! -d "$NOTES_FOLDER" ]; then
    echo "Creating notes folder: $NOTES_FOLDER"
    mkdir -p "$NOTES_FOLDER"
else
    echo "✅ Notes folder already exists: $NOTES_FOLDER"
fi

if [ ! -d "$PYQS_FOLDER" ]; then
    echo "Creating PYQs folder: $PYQS_FOLDER"
    mkdir -p "$PYQS_FOLDER"
else
    echo "✅ PYQs folder already exists: $PYQS_FOLDER"
fi

# Create uploaded folders for processed files
NOTES_UPLOADED_FOLDER="$NOTES_FOLDER/uploaded"
PYQS_UPLOADED_FOLDER="$PYQS_FOLDER/uploaded"

if [ ! -d "$NOTES_UPLOADED_FOLDER" ]; then
    echo "Creating notes uploaded folder: $NOTES_UPLOADED_FOLDER"
    mkdir -p "$NOTES_UPLOADED_FOLDER"
fi

if [ ! -d "$PYQS_UPLOADED_FOLDER" ]; then
    echo "Creating PYQs uploaded folder: $PYQS_UPLOADED_FOLDER"
    mkdir -p "$PYQS_UPLOADED_FOLDER"
fi

# Get the full path to the script
SCRIPT_PATH="$SCRIPT_DIR/auto-upload.js"

# Create cron job entry (runs daily at 9 AM)
CRON_JOB="0 9 * * * cd $SCRIPT_DIR && node $SCRIPT_PATH >> $SCRIPT_DIR/cron.log 2>&1"

echo "Setting up cron job..."
echo "Current cron jobs:"
crontab -l 2>/dev/null || echo "No existing cron jobs"

echo ""
echo "Adding new cron job..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ Setup completed!"
echo ""
echo "📁 Notes folder: $NOTES_FOLDER"
echo "📁 PYQs folder: $PYQS_FOLDER"
echo "📁 Notes uploaded folder: $NOTES_UPLOADED_FOLDER"
echo "📁 PYQs uploaded folder: $PYQS_UPLOADED_FOLDER"
echo "⏰ Cron job: Runs daily at 9:00 AM"
echo "📝 Log file: $SCRIPT_DIR/auto-upload.log"
echo ""
echo "📋 How to use:"
echo "   • Drop study notes in: $NOTES_FOLDER"
echo "   • Drop previous year questions in: $PYQS_FOLDER"
echo "   • Script will automatically detect the type and upload accordingly"
echo ""
echo "To test the script manually, run:"
echo "  cd $SCRIPT_DIR && node auto-upload.js"
echo ""
echo "To view cron jobs:"
echo "  crontab -l"
echo ""
echo "To remove cron job:"
echo "  crontab -e"
echo ""
echo "⚠️  IMPORTANT: Update the CONFIG in auto-upload.js with your settings!" 