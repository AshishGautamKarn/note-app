#!/bin/bash

echo "🔧 Fixing Note App setup issues..."

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "uvicorn app.main:app" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Clean up backend
echo "🧹 Cleaning backend..."
cd backend
rm -rf venv 2>/dev/null || true
rm -rf __pycache__ 2>/dev/null || true
rm -rf .pytest_cache 2>/dev/null || true

# Clean up frontend
echo "🧹 Cleaning frontend..."
cd ../frontend
rm -rf node_modules 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Reinstall backend
echo "📦 Reinstalling backend dependencies..."
cd ../backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Reinstall frontend
echo "🎨 Reinstalling frontend dependencies..."
cd ../frontend
npm install

echo "✅ Setup complete! Now starting the application..."
cd ..
./start.sh
