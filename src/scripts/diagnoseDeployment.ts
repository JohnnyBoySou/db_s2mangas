#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔍 Diagnóstico de Deployment - S2Mangas Backend\n');

// Verificar arquivos essenciais
const essentialFiles = [
  'dist/server.js',
  'package.json',
  'src/prisma/schema.prisma',
  'node_modules/@prisma/client',
];

console.log('📁 Verificando arquivos essenciais:');
essentialFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) {
    console.log(`   ⚠️ Arquivo não encontrado: ${file}`);
  }
});

// Verificar variáveis de ambiente
console.log('\n🌍 Verificando variáveis de ambiente:');
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`${value ? '✅' : '❌'} ${envVar}: ${value ? '***' : 'não definida'}`);
});

// Verificar Node.js e npm
console.log('\n📦 Verificando versões:');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
  console.log(`✅ npm: ${npmVersion}`);
} catch (error) {
  console.log('❌ Erro ao verificar versões:', error);
}

// Verificar memória disponível
console.log('\n💾 Verificando memória:');
try {
  const memInfo = execSync('free -h', { encoding: 'utf8' });
  console.log('Memória do sistema:');
  console.log(memInfo);
} catch (error) {
  console.log('⚠️ Não foi possível verificar memória (pode ser Windows):');
  console.log('Memória do processo Node.js:', process.memoryUsage());
}

// Verificar se o build foi feito corretamente
console.log('\n🔨 Verificando build:');
try {
  const distFiles = fs.readdirSync('dist');
  console.log('Arquivos em dist/:', distFiles);
} catch (error) {
  console.log('❌ Erro ao ler diretório dist:', error);
}

// Verificar Prisma
console.log('\n🗄️ Verificando Prisma:');
try {
  const prismaVersion = execSync('npx prisma --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Prisma: ${prismaVersion}`);
} catch (error) {
  console.log('❌ Erro ao verificar Prisma:', error);
}

console.log('\n✅ Diagnóstico concluído!');
