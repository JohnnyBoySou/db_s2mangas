#!/usr/bin/env ts-node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function railwayTroubleshoot() {
  console.log('🔧 Troubleshooting Railway - S2Mangas');
  console.log('=====================================\n');

  // 1. Verificar ambiente Railway
  console.log('1. Verificando ambiente Railway...');
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT;
  const railwayProjectId = process.env.RAILWAY_PROJECT_ID;
  const railwayServiceId = process.env.RAILWAY_SERVICE_ID;
  
  console.log(`   Ambiente: ${railwayEnv || 'não definido'}`);
  console.log(`   Project ID: ${railwayProjectId || 'não definido'}`);
  console.log(`   Service ID: ${railwayServiceId || 'não definido'}`);

  if (!railwayEnv) {
    console.log('⚠️  Não parece estar rodando no Railway');
  } else {
    console.log('✅ Ambiente Railway detectado');
  }

  // 2. Verificar variáveis de ambiente críticas
  console.log('\n2. Verificando variáveis críticas...');
  const criticalVars = [
    'DATABASE_URL',
    'NODE_ENV',
    'PORT',
    'JWT_SECRET'
  ];

  for (const varName of criticalVars) {
    const value = process.env[varName];
    if (value) {
      if (varName === 'DATABASE_URL') {
        const masked = value.replace(/:([^:@]+)@/, ':****@');
        console.log(`   ✅ ${varName}: ${masked}`);
      } else {
        console.log(`   ✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`   ❌ ${varName}: não definida`);
    }
  }

  // 3. Verificar conectividade de rede
  console.log('\n3. Verificando conectividade...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    // Extrair host da URL
    const hostMatch = databaseUrl.match(/@([^:]+):/);
    if (hostMatch) {
      const host = hostMatch[1];
      console.log(`   Testando conectividade com: ${host}`);
      
      try {
        // Teste básico de conectividade
        const { stdout: _stdout } = await execAsync(`ping -c 1 -W 3 ${host}`);
        console.log(`   ✅ Host ${host} está acessível`);
      } catch {
        console.log(`   ❌ Host ${host} não está acessível`);
        console.log(`   💡 Isso pode indicar que o serviço PostgreSQL não está rodando`);
      }
    }
  }

  // 4. Verificar arquivos de build
  console.log('\n4. Verificando arquivos de build...');
  
  const buildFiles = [
    'dist/server.js',
    'node_modules/@prisma/client',
    'src/prisma/schema.prisma'
  ];

  for (const file of buildFiles) {
    try {
      await execAsync(`test -f ${file} || test -d ${file}`);
      console.log(`   ✅ ${file} existe`);
    } catch {
      console.log(`   ❌ ${file} não encontrado`);
    }
  }

  // 5. Verificar logs do sistema
  console.log('\n5. Verificando logs do sistema...');
  
  try {
    const { stdout } = await execAsync('tail -n 20 logs/combined.log 2>/dev/null || echo "Logs não encontrados"');
    console.log('   📋 Últimas linhas do log:');
    console.log(stdout);
  } catch {
    console.log('   📋 Logs não disponíveis');
  }

  // 6. Recomendações específicas
  console.log('\n6. Recomendações para resolver o problema P1001:');
  console.log('\n🔧 Passos para resolver:');
  console.log('   1. Acesse o dashboard do Railway');
  console.log('   2. Verifique se o serviço PostgreSQL está ativo');
  console.log('   3. Confirme se a DATABASE_URL está correta');
  console.log('   4. Verifique se o serviço está na mesma rede');
  console.log('   5. Tente reiniciar o serviço PostgreSQL');
  
  console.log('\n📋 Comandos úteis no Railway:');
  console.log('   • Ver logs: railway logs');
  console.log('   • Conectar ao banco: railway connect');
  console.log('   • Ver variáveis: railway variables');
  
  console.log('\n🔍 Verificações adicionais:');
  console.log('   1. O serviço PostgreSQL está na mesma rede?');
  console.log('   2. A URL usa o hostname correto?');
  console.log('   3. As credenciais estão corretas?');
  console.log('   4. O banco de dados existe?');
  
  console.log('\n💡 Soluções alternativas:');
  console.log('   1. Use DATABASE_URL externa (se disponível)');
  console.log('   2. Configure um novo serviço PostgreSQL');
  console.log('   3. Verifique se há problemas de rede no Railway');
  console.log('   4. Entre em contato com o suporte do Railway');

  // 7. Teste de conexão direta
  console.log('\n7. Teste de conexão direta...');
  
  if (databaseUrl) {
    try {
      const { stdout } = await execAsync(`psql "${databaseUrl}" -c "SELECT version();" -t 2>/dev/null || echo "psql não disponível"`);
      if (stdout.includes('PostgreSQL')) {
        console.log('   ✅ Conexão direta bem-sucedida!');
        console.log(`   📋 Versão: ${stdout.trim()}`);
      } else {
        console.log('   ❌ Conexão direta falhou');
      }
    } catch {
      console.log('   ❌ Cliente PostgreSQL não disponível');
    }
  }

  console.log('\n✅ Troubleshooting concluído');
  console.log('\n🎯 Próximos passos:');
  console.log('1. Verifique o dashboard do Railway');
  console.log('2. Confirme a configuração do PostgreSQL');
  console.log('3. Teste com o novo script de inicialização');
  console.log('4. Se persistir, considere usar um banco externo');
}

// Executar troubleshooting
railwayTroubleshoot()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante troubleshooting:', error);
    process.exit(1);
  });

