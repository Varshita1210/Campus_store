#!/bin/bash
# QUICK START SCRIPT FOR COLLEGE MERCHANDISE STORE

echo "╔════════════════════════════════════════════╗"
echo "║   College Merchandise Store - Quick Start   ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "📥 Download from: https://nodejs.org (LTS version)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"
echo ""

# Navigate to backend
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║        Starting Server (localhost:5000)    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "✅ Open in browser: http://localhost:5000"
echo "✅ Student: Login with name + email"
echo "✅ Admin: Click 'Go to Admin Panel'"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server
npm start
