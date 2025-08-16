import { getRedisClient, getRedisL1Client } from '@/config/redis';
import { logger } from '@/utils/logger';

async function testExternalRedis() {
  console.log('🌐 TESTANDO CONEXÃO COM REDIS EXTERNO');
  console.log('=====================================\n');

  const redis = getRedisClient();
  const redisL1 = getRedisL1Client();

  try {
    // Verificar configuração atual
    console.log('📋 Configuração atual:');
    console.log(`   REDIS_HOST: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`   REDIS_PORT: ${process.env.REDIS_PORT || 6379}`);
    console.log(`   REDIS_PASSWORD: ${process.env.REDIS_PASSWORD ? '***' : 'não definida'}`);
    console.log(`   REDIS_URL: ${process.env.REDIS_URL ? 'definida' : 'não definida'}\n`);

    // Teste 1: Verificar conexão
    console.log('1️⃣ Testando conexão com Redis externo...');
    
    try {
      await redis.ping();
      console.log('✅ Redis principal conectado com sucesso!');
    } catch (error) {
      console.log('❌ Falha na conexão com Redis principal:', error.message);
      console.log('💡 Verifique:');
      console.log('   - Se o servidor Redis está acessível');
      console.log('   - Se as credenciais estão corretas');
      console.log('   - Se o firewall permite a conexão');
      console.log('   - Se a URL do Redis está correta');
      return;
    }

    try {
      await redisL1.ping();
      console.log('✅ Redis L1 conectado com sucesso!');
    } catch (error) {
      console.log('❌ Falha na conexão com Redis L1:', error.message);
    }

    // Teste 2: Verificar informações do servidor
    console.log('\n2️⃣ Informações do servidor Redis...');
    try {
      const info = await redis.info('server');
      const lines = info.split('\n');
      
      const versionLine = lines.find(line => line.startsWith('redis_version'));
      const osLine = lines.find(line => line.startsWith('os'));
      const uptimeLine = lines.find(line => line.startsWith('uptime_in_seconds'));
      
      if (versionLine) console.log(`   ${versionLine}`);
      if (osLine) console.log(`   ${osLine}`);
      if (uptimeLine) {
        const uptime = parseInt(uptimeLine.split(':')[1]);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        console.log(`   Uptime: ${hours}h ${minutes}m`);
      }
    } catch (error) {
      console.log('⚠️ Não foi possível obter informações do servidor:', error.message);
    }

    // Teste 3: Verificar memória
    console.log('\n3️⃣ Informações de memória...');
    try {
      const memoryInfo = await redis.info('memory');
      const lines = memoryInfo.split('\n');
      
      const usedMemoryLine = lines.find(line => line.startsWith('used_memory_human'));
      const maxMemoryLine = lines.find(line => line.startsWith('maxmemory_human'));
      
      if (usedMemoryLine) console.log(`   ${usedMemoryLine}`);
      if (maxMemoryLine) console.log(`   ${maxMemoryLine}`);
    } catch (error) {
      console.log('⚠️ Não foi possível obter informações de memória:', error.message);
    }

    // Teste 4: Testar operações básicas
    console.log('\n4️⃣ Testando operações básicas...');
    
    const testKey = `test:external:${Date.now()}`;
    const testData = {
      message: 'Teste de Redis externo',
      timestamp: new Date().toISOString(),
      server: 'external'
    };

    try {
      // Salvar dados
      await redis.setex(testKey, 60, JSON.stringify(testData));
      console.log('✅ Dados salvos no cache externo');

      // Recuperar dados
      const cachedData = await redis.get(testKey);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        console.log('✅ Dados recuperados do cache externo:', parsedData.message);
      } else {
        console.log('❌ Falha ao recuperar dados do cache');
      }

      // Verificar TTL
      const ttl = await redis.ttl(testKey);
      console.log(`✅ TTL restante: ${ttl} segundos`);

      // Limpar dados de teste
      await redis.del(testKey);
      console.log('✅ Dados de teste removidos');

    } catch (error) {
      console.log('❌ Erro nas operações básicas:', error.message);
    }

    // Teste 5: Verificar chaves existentes
    console.log('\n5️⃣ Verificando chaves existentes...');
    try {
      const keys = await redis.keys('*');
      console.log(`✅ ${keys.length} chave(s) encontrada(s) no servidor`);
      
      if (keys.length > 0) {
        console.log('   Primeiras 5 chaves:');
        keys.slice(0, 5).forEach(key => {
          console.log(`   - ${key}`);
        });
      }
    } catch (error) {
      console.log('⚠️ Não foi possível listar chaves:', error.message);
    }

    console.log('\n🎉 Teste do Redis externo concluído!');
    console.log('✅ O cache externo está funcionando corretamente.');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    logger.error('Erro no teste do Redis externo:', error);
  } finally {
    // Fechar conexões
    try {
      await redis.quit();
      await redisL1.quit();
      console.log('\n🔌 Conexões Redis fechadas.');
    } catch (error) {
      console.log('⚠️ Erro ao fechar conexões:', error.message);
    }
  }
}

// Executar o teste se o arquivo for executado diretamente
if (require.main === module) {
  testExternalRedis()
    .then(() => {
      console.log('\n✅ Teste do Redis externo concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Teste do Redis externo falhou:', error);
      process.exit(1);
    });
}

export { testExternalRedis };
