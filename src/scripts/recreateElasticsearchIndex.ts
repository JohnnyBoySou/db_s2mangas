import 'dotenv/config';
import { Client } from '@elastic/elasticsearch';

const INDEX_NAME = 'manga_index';

async function recreateElasticsearchIndex() {
  console.log('🔍 Recriando índice Elasticsearch...\n');
  
  const elasticUrl = process.env.ELASTIC_INTERNAL_URL || process.env.ELASTIC_URL || 'http://localhost:9200';
  const hasUsername = !!process.env.ELASTIC_USERNAME;
  const hasPassword = !!process.env.ELASTIC_PASSWORD;
  
  const client = new Client({
    node: elasticUrl,
    auth: hasUsername && hasPassword ? {
      username: process.env.ELASTIC_USERNAME!,
      password: process.env.ELASTIC_PASSWORD!
    } : undefined,
    requestTimeout: 10000,
    maxRetries: 3,
    tls: { rejectUnauthorized: false },
    compression: false,
    sniffOnStart: false,
    sniffInterval: false,
  });
  
  try {
    // 1. Verificar se o índice existe e deletá-lo
    console.log('1️⃣ Verificando índice existente...');
    const indexExists = await client.indices.exists({ index: INDEX_NAME });
    
    if (indexExists) {
      console.log('   Índice existe. Deletando...');
      await client.indices.delete({ index: INDEX_NAME });
      console.log('   ✅ Índice deletado\n');
    } else {
      console.log('   Índice não existe\n');
    }
    
    // 2. Criar novo índice com configuração completa
    console.log('2️⃣ Criando novo índice...');
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
                  analyzer: 'manga_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: { type: 'completion' },
                    ngram: { type: 'text', analyzer: 'ngram_analyzer' }
                  }
                },
                description: {
                  type: 'text',
                  analyzer: 'manga_analyzer'
                }
              }
            },
            categories: {
              type: 'nested',
              properties: {
                id: { type: 'keyword' },
                name: {
                  type: 'text',
                  analyzer: 'category_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                }
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
        },
        settings: {
          analysis: {
            analyzer: {
              manga_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: [
                  'lowercase',
                  'stop_words_filter',
                  'synonym_filter'
                ]
              },
              ngram_analyzer: {
                type: 'custom',
                tokenizer: 'ngram_tokenizer',
                filter: ['lowercase']
              },
              category_analyzer: {
                type: 'custom',
                tokenizer: 'keyword',
                filter: ['lowercase']
              }
            },
            tokenizer: {
              ngram_tokenizer: {
                type: 'ngram',
                min_gram: 2,
                max_gram: 3,
                token_chars: ['letter', 'digit']
              }
            },
            filter: {
              stop_words_filter: {
                type: 'stop',
                stopwords: ['o', 'a', 'de', 'da', 'do', 'em', 'na', 'no']
              },
              synonym_filter: {
                type: 'synonym',
                synonyms: [
                  'manga,manhwa,manhua',
                  'shounen,shonen',
                  'shoujo,shojo',
                  'romance,amor',
                  'ação,action,luta'
                ]
              }
            }
          }
        }
      }
    });
    
    console.log('   ✅ Índice criado com configuração completa\n');
    
    // 3. Aguardar um pouco para o índice estar pronto
    console.log('3️⃣ Aguardando índice estar pronto...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Verificar se o índice foi criado corretamente
    console.log('4️⃣ Verificando configuração...');
    const mappingResponse = await client.indices.getMapping({ index: INDEX_NAME });
    const mappings = mappingResponse[INDEX_NAME].mappings as any;
    
    console.log('   Campos configurados:');
    console.log(`   - translations.name: ${mappings?.properties?.translations?.properties?.name ? '✅' : '❌'}`);
    console.log(`   - translations.name.ngram: ${mappings?.properties?.translations?.properties?.name?.fields?.ngram ? '✅' : '❌'}`);
    console.log(`   - translations.name.suggest: ${mappings?.properties?.translations?.properties?.name?.fields?.suggest ? '✅' : '❌'}`);
    console.log(`   - translations.description: ${mappings?.properties?.translations?.properties?.description ? '✅' : '❌'}`);
    console.log(`   - categories.name: ${mappings?.properties?.categories?.properties?.name ? '✅' : '❌'}`);
    console.log();
    
    console.log('🎉 Índice recriado com sucesso!');
    console.log('💡 Execute o script de inicialização para reindexar os dados.');
    
  } catch (error: any) {
    console.error('❌ Erro durante recriação:');
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Status: ${error.meta?.statusCode}`);
    if (error.meta?.body?.error) {
      console.error(`   Erro Elasticsearch: ${JSON.stringify(error.meta.body.error, null, 2)}`);
    }
  }
}

recreateElasticsearchIndex()
  .then(() => {
    console.log('🏁 Script concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script falhou:', error);
    process.exit(1);
  });
