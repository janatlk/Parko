#!/usr/bin/env bash
set -o errexit

echo "=== Building Parko for Render ==="

# Build frontend
echo "→ Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Prepare backend
echo "→ Preparing backend..."
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy frontend build to static files directory for WhiteNoise
mkdir -p staticfiles
cp -r ../frontend/dist/* staticfiles/ 2>/dev/null || true

# Run migrations
python manage.py migrate --settings=config.settings.render

# Collect static files
python manage.py collectstatic --no-input --settings=config.settings.render

echo "=== Build complete ==="
