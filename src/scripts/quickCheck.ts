#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

async function quickCheck() {
  console.log('⚡ Verificação Rápida - Conexão com Banco');
  console.log('==========================================\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não está definida!');
    process.exit(1);
  }

  console.log('🔍 Testando conexão...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  });

  try {
    // Teste de conexão
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');

    // Teste de query
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log('✅ Query executada com sucesso');
    console.log(`📋 Versão do PostgreSQL: ${(result as any)[0]?.version}`);

    // Verificar tabelas
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`📊 Tabelas no banco: ${(tables as any)[0]?.count}`);

    console.log('\n🎉 Tudo funcionando perfeitamente!');

  } catch (error: any) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('P1001')) {
      console.log('\n💡 Solução rápida:');
      console.log('1. Verifique se o PostgreSQL está rodando no Railway');
      console.log('2. Confirme se a DATABASE_URL está correta');
      console.log('3. Execute: npm run railway:troubleshoot');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });

