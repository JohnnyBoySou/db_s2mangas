#!/bin/bash

# Railway build script for S2Mangas Backend
set -e

echo "🚀 Starting Railway build process..."

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Remove existing node_modules and lock file
echo "🗑️ Removing existing dependencies..."
rm -rf node_modules
rm -f package-lock.json

# Install dependencies with specific flags for Railway
echo "📦 Installing dependencies..."
npm install --no-audit --no-fund --legacy-peer-deps --production=false

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🔨 Building application..."
npm run build

# Copy email templates to dist directory
echo "📧 Copying email templates..."
mkdir -p dist/templates/email
cp -r src/templates/email/* dist/templates/email/

# Verify build output
echo "🔍 Verifying build output..."
if [ ! -f "dist/server.js" ]; then
    echo "❌ Build failed: dist/server.js not found"
    exit 1
fi

echo "✅ Build completed successfully!"