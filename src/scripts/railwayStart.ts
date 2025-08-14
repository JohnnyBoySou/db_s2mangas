import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

console.log('🚀 Iniciando aplicação no Railway...');

// Verificar e criar diretórios necessários
const uploadsDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), 'data', 'uploads');
const logsDir = path.join(process.cwd(), 'logs');

console.log(`📁 Verificando diretório de uploads: ${uploadsDir}`);
if (!existsSync(uploadsDir)) {
  console.log('📁 Criando diretório de uploads...');
  mkdirSync(uploadsDir, { recursive: true });
}

console.log(`📁 Verificando diretório de logs: ${logsDir}`);
if (!existsSync(logsDir)) {
  console.log('📁 Criando diretório de logs...');
  mkdirSync(logsDir, { recursive: true });
}

// Gerar cliente Prisma
console.log('🔧 Gerando cliente Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma gerado com sucesso');
} catch (error) {
  console.error('❌ Erro ao gerar cliente Prisma:', error);
  process.exit(1);
}

// Executar migrações se necessário
console.log('🔄 Verificando migrações do banco...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrações aplicadas com sucesso');
} catch (error) {
  console.error('❌ Erro ao aplicar migrações:', error);
  process.exit(1);
}

// Iniciar a aplicação
console.log('🚀 Iniciando servidor...');
try {
  execSync('npm run build:prod', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
}
