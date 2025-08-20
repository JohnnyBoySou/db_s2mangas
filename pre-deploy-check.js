#!/usr/bin/env node

/**
 * Script de verificação pré-deploy para Railway
 * Verifica se todas as configurações estão corretas antes do deploy
 */

const fs = require('fs');

console.log('🔍 Iniciando verificação pré-deploy...');

let hasErrors = false;
let hasWarnings = false;

// Função para log de erro
function logError(message) {
  console.error(`❌ ERRO: ${message}`);
  hasErrors = true;
}

// Função para log de warning
function logWarning(message) {
  console.warn(`⚠️  AVISO: ${message}`);
  hasWarnings = true;
}

// Função para log de sucesso
function logSuccess(message) {
  console.log(`✅ ${message}`);
}

// 1. Verificar package.json
console.log('\n📦 Verificando package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Verificar engines
  if (!packageJson.engines) {
    logError('Campo "engines" não encontrado no package.json');
  } else {
    if (!packageJson.engines.node) {
      logError('Versão do Node.js não especificada em engines');
    } else {
      logSuccess(`Node.js version: ${packageJson.engines.node}`);
    }
  }
  
  // Verificar scripts necessários
  const requiredScripts = ['build', 'start', 'railway:build'];
  const optionalScripts = ['railway:start']; // Optional scripts
  
  requiredScripts.forEach(script => {
    if (!packageJson.scripts[script]) {
      logError(`Script "${script}" não encontrado`);
    } else {
      logSuccess(`Script "${script}" configurado`);
    }
  });
  
  optionalScripts.forEach(script => {
    if (!packageJson.scripts[script]) {
      logWarning(`Script "${script}" não encontrado (opcional)`);
    } else {
      logSuccess(`Script "${script}" configurado`);
    }
  });
  
  // Verificar postinstall
  if (!packageJson.scripts.postinstall) {
    logWarning('Script "postinstall" não encontrado - Prisma pode não ser gerado automaticamente');
  } else {
    logSuccess('Script "postinstall" configurado');
  }
  
} catch (error) {
  logError(`Erro ao ler package.json: ${error.message}`);
}

// 2. Verificar arquivos essenciais
console.log('\n📁 Verificando arquivos essenciais...');
const essentialFiles = [
  'src/server.ts',
  'src/prisma/schema.prisma',
  'tsconfig.json',
  '.nvmrc'
];

essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    logSuccess(`Arquivo ${file} encontrado`);
  } else {
    logError(`Arquivo ${file} não encontrado`);
  }
});

// 3. Verificar Prisma schema
console.log('\n🗄️  Verificando Prisma schema...');
try {
  const schemaPath = 'src/prisma/schema.prisma';
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (schema.includes('postgresql')) {
      logSuccess('Database provider: PostgreSQL');
    } else {
      logWarning('Database provider não é PostgreSQL');
    }
    
    if (schema.includes('env("DATABASE_URL")')) {
      logSuccess('DATABASE_URL configurada no schema');
    } else {
      logError('DATABASE_URL não encontrada no schema');
    }
  }
} catch (error) {
  logError(`Erro ao verificar Prisma schema: ${error.message}`);
}

// 4. Verificar TypeScript config
console.log('\n⚙️  Verificando TypeScript config...');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  if (tsconfig.compilerOptions && tsconfig.compilerOptions.outDir) {
    logSuccess(`Output directory: ${tsconfig.compilerOptions.outDir}`);
  } else {
    logWarning('Output directory não especificado no tsconfig.json');
  }
  
} catch (error) {
  logError(`Erro ao ler tsconfig.json: ${error.message}`);
}

// 5. Verificar dependências críticas
console.log('\n📚 Verificando dependências críticas...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const criticalDeps = [
    '@prisma/client',
    'express',
    'typescript',
    'prisma'
  ];
  
  criticalDeps.forEach(dep => {
    const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
    const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
    
    if (inDeps || inDevDeps) {
      logSuccess(`Dependência ${dep} encontrada`);
    } else {
      logError(`Dependência crítica ${dep} não encontrada`);
    }
  });
  
} catch (error) {
  logError(`Erro ao verificar dependências: ${error.message}`);
}

// 6. Verificar arquivos de configuração Railway
console.log('\n🚂 Verificando configuração Railway...');
const railwayFiles = [
  '.nvmrc',
  'railway.json',
  '.railwayignore',
  'railway-build.sh'
];

railwayFiles.forEach(file => {
  if (fs.existsSync(file)) {
    logSuccess(`Arquivo Railway ${file} encontrado`);
  } else {
    logWarning(`Arquivo Railway ${file} não encontrado`);
  }
});

// 7. Verificar se railway-build.sh é executável
if (fs.existsSync('railway-build.sh')) {
  try {
    const stats = fs.statSync('railway-build.sh');
    if (stats.mode & parseInt('111', 8)) {
      logSuccess('railway-build.sh é executável');
    } else {
      logWarning('railway-build.sh não é executável - execute: chmod +x railway-build.sh');
    }
  } catch (error) {
    logWarning(`Erro ao verificar permissões do railway-build.sh: ${error.message}`);
  }
}

// Resumo final
console.log('\n📊 Resumo da verificação:');
if (hasErrors) {
  console.error('❌ ERROS ENCONTRADOS - Corrija os erros antes do deploy');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  AVISOS ENCONTRADOS - Recomenda-se revisar antes do deploy');
  process.exit(0);
} else {
  console.log('✅ Todas as verificações passaram! Pronto para deploy no Railway.');
  process.exit(0);
}