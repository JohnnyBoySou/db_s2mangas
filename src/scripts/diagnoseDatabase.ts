#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function diagnoseDatabase() {
  console.log('🔍 Diagnóstico de Conexão com Banco de Dados');
  console.log('============================================\n');

  // 1. Verificar variáveis de ambiente
  console.log('1. Verificando variáveis de ambiente...');
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não está definida!');
    console.log('💡 Solução: Configure a variável DATABASE_URL no Railway');
    return;
  }

  console.log('✅ DATABASE_URL está definida');
  
  // Mascarar a senha na URL para segurança
  const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`📋 URL do banco: ${maskedUrl}\n`);

  // 2. Verificar se o Prisma Client está gerado
  console.log('2. Verificando Prisma Client...');
  try {
    const { stdout } = await execAsync('npx prisma generate');
    console.log('✅ Prisma Client gerado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao gerar Prisma Client:', error);
    return;
  }

  // 3. Testar conexão com o banco
  console.log('\n3. Testando conexão com o banco...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    // Teste simples de conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco estabelecida com sucesso');

    // Teste de query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste executada com sucesso:', result);

    // Verificar se as tabelas existem
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📊 Tabelas encontradas:', (tables as any[]).length);

  } catch (error: any) {
    console.error('❌ Erro na conexão com o banco:', error.message);
    
    // Análise específica do erro
    if (error.message.includes('P1001')) {
      console.log('\n🔧 Análise do erro P1001:');
      console.log('   - O servidor PostgreSQL não está acessível');
      console.log('   - Possíveis causas:');
      console.log('     • Serviço PostgreSQL não está rodando no Railway');
      console.log('     • URL do banco incorreta');
      console.log('     • Firewall ou configuração de rede');
      console.log('     • Credenciais incorretas');
      
      console.log('\n💡 Soluções sugeridas:');
      console.log('   1. Verifique se o serviço PostgreSQL está ativo no Railway');
      console.log('   2. Confirme se a DATABASE_URL está correta');
      console.log('   3. Teste a conexão manualmente com psql ou outro cliente');
      console.log('   4. Verifique os logs do serviço PostgreSQL no Railway');
    }
    
    if (error.message.includes('P1017')) {
      console.log('\n🔧 Análise do erro P1017:');
      console.log('   - Servidor rejeitou a conexão');
      console.log('   - Possíveis causas:');
      console.log('     • Credenciais incorretas');
      console.log('     • Banco de dados não existe');
      console.log('     • Usuário sem permissões');
    }
    
    if (error.message.includes('P2002')) {
      console.log('\n🔧 Análise do erro P2002:');
      console.log('   - Violação de constraint único');
      console.log('   - Isso indica que a conexão funciona, mas há dados duplicados');
    }
  } finally {
    await prisma.$disconnect();
  }

  // 4. Verificar migrações
  console.log('\n4. Verificando migrações...');
  try {
    const { stdout } = await execAsync('npx prisma migrate status');
    console.log('📋 Status das migrações:');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Erro ao verificar migrações:', error);
  }

  // 5. Verificar configuração do Railway
  console.log('\n5. Verificando configuração do Railway...');
  console.log('📋 Variáveis de ambiente importantes:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
  console.log(`   PORT: ${process.env.PORT || 'não definido'}`);
  console.log(`   RAILWAY_PUBLIC_DOMAIN: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'não definido'}`);

  console.log('\n🎯 Recomendações:');
  console.log('1. Verifique se o serviço PostgreSQL está ativo no Railway');
  console.log('2. Confirme se a DATABASE_URL está correta');
  console.log('3. Execute: npx prisma migrate deploy');
  console.log('4. Verifique os logs do Railway para mais detalhes');
  console.log('5. Teste a conexão com um cliente PostgreSQL externo');
}

// Executar o diagnóstico
diagnoseDatabase()
  .then(() => {
    console.log('\n✅ Diagnóstico concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro durante o diagnóstico:', error);
    process.exit(1);
  }); 