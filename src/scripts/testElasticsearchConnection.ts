import 'dotenv/config';
import { Client } from '@elastic/elasticsearch';

const INDEX_NAME = 'manga_index';

async function testElasticsearchConnection() {
  console.log('🔍 Testando conexão com Elasticsearch...\n');
  
  // Configurar cliente com as mesmas configurações do serviço
  let elasticUrl = process.env.ELASTIC_INTERNAL_URL || process.env.ELASTIC_URL || 'http://localhost:9200';
  
  // Se for URL do Railway e não tiver protocolo HTTPS, adicionar
  if (elasticUrl.includes('railway.app') && !elasticUrl.startsWith('https://')) {
    elasticUrl = elasticUrl.replace('http://', 'https://');
  }
  
  // Para Railway, remover porta 9200 se estiver usando HTTPS
  if (elasticUrl.includes('railway.app') && elasticUrl.includes(':9200')) {
    elasticUrl = elasticUrl.replace(':9200', '');
  }
  
  const hasUsername = !!process.env.ELASTIC_USERNAME;
  const hasPassword = !!process.env.ELASTIC_PASSWORD;
  
  console.log('📋 Configuração:');
  console.log(`   URL: ${elasticUrl}`);
  console.log(`   Username: ${process.env.ELASTIC_USERNAME || 'Não configurado'}`);
  console.log(`   Password: ${hasPassword ? 'Configurado' : 'Não configurado'}`);
  console.log(`   Auth habilitada: ${hasUsername && hasPassword ? '✅' : '❌'}\n`);
  
  const client = new Client({
    node: elasticUrl,
    auth: hasUsername && hasPassword ? {
      username: process.env.ELASTIC_USERNAME!,
      password: process.env.ELASTIC_PASSWORD!
    } : undefined,
    requestTimeout: 10000,
    maxRetries: 3,
    tls: {
      rejectUnauthorized: false,
    },
    compression: false,
    sniffOnStart: false,
    sniffInterval: false,
  });
  
  try {
    // Testar ping
    console.log('🏓 Testando ping...');
    const pingResponse = await client.ping({}, { requestTimeout: 5000 });
    console.log(`   Ping response: ${pingResponse ? '✅ Sucesso' : '❌ Falha'}\n`);
    
    // Verificar se o índice existe
    console.log('📚 Verificando se o índice existe...');
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    console.log(`   Índice ${INDEX_NAME} existe: ${indexExists ? '✅' : '❌'}\n`);
    
    if (!indexExists) {
      console.log('🏗️  Criando índice...');
      
      // Criar índice com configuração simplificada primeiro
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              manga_uuid: { type: 'keyword' },
              status: { type: 'keyword' },
              type: { type: 'keyword' },
              release_date: { type: 'date' },
              created_at: { type: 'date' },
              popularity_score: { type: 'float' },
              translations: {
                type: 'nested',
                properties: {
                  language: { type: 'keyword' },
                  name: {
                    type: 'text',
                    fields: {
                      keyword: { type: 'keyword' },
                      suggest: { type: 'completion' }
                    }
                  },
                  description: { type: 'text' }
                }
              },
              categories: {
                type: 'nested',
                properties: {
                  id: { type: 'keyword' },
                  name: { type: 'text' }
                }
              },
              stats: {
                properties: {
                  views_count: { type: 'integer' },
                  likes_count: { type: 'integer' },
                  chapters_count: { type: 'integer' },
                  comments_count: { type: 'integer' },
                  avg_rating: { type: 'float' }
                }
              }
            }
          }
        }
      });
      
      console.log('✅ Índice criado com sucesso!\n');
    }
    
    // Testar uma busca simples
    console.log('🔍 Testando busca...');
    const searchResponse = await client.search({
      index: INDEX_NAME,
      body: {
        query: {
          match_all: {}
        },
        size: 1
      }
    });
    
    console.log(`   Busca executada: ✅`);
    const total = typeof searchResponse.hits.total === 'object' ? searchResponse.hits.total.value : searchResponse.hits.total;
    console.log(`   Total de documentos: ${total || 0}\n`);
    
    console.log('🎉 Todos os testes passaram!');
    
  } catch (error: any) {
    console.error('❌ Erro durante o teste:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Código: ${error.code}`);
    console.error(`   Status: ${error.meta?.statusCode}`);
    
    if (error.meta?.body?.error) {
      console.error(`   Erro Elasticsearch: ${JSON.stringify(error.meta.body.error, null, 2)}`);
    }
  }
}

testElasticsearchConnection()
  .then(() => {
    console.log('🏁 Script concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falhou:', error);
    process.exit(1);
  });
