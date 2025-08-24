#!/bin/bash

set -e

echo "🔨 Starting build process..."

# Compilar TypeScript
echo "📝 Compiling TypeScript..."
npx tsc

# Processar aliases
echo "🔗 Processing TypeScript aliases..."
npx tsc-alias

# Criar diretório de templates e copiar arquivos
echo "📧 Setting up email templates..."
mkdir -p dist/templates/email
cp -r src/templates/email/* dist/templates/email/

# Tentar fazer upload dos sourcemaps para o Sentry (opcional)
echo "📤 Attempting Sentry sourcemaps upload..."
if npm run sentry:sourcemaps; then
    echo "✅ Sentry sourcemaps uploaded successfully"
else
    echo "⚠️  Sentry upload failed, but build continues..."
    echo "   This is normal in CI environments without Sentry configuration"
fi

echo "🎉 Build completed successfully!"
echo "📁 Build output: dist/"
