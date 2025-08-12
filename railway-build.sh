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
npm install --production --no-audit --no-fund --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🏗️ Building TypeScript..."
npm run build

echo "✅ Build completed successfully!"