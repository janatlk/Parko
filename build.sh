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

# Copy frontend build to static directory for collectstatic
mkdir -p static
cp -r ../frontend/dist/* static/ 2>/dev/null || true

# Run migrations
python manage.py migrate --settings=config.settings.render

# Collect static files
python manage.py collectstatic --no-input --clear --settings=config.settings.render

echo "=== Build complete ==="
