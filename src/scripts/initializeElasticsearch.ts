import SmartSearchHandler from '../modules/search/handlers/SmartSearchHandler';
import prisma from '../prisma/client';

async function initializeElasticsearch() {
  console.log('🔍 Initializing Elasticsearch for S2Mangas...');
  
  const smartSearchHandler = new SmartSearchHandler();
  
  try {
    // Check if Elasticsearch is available
    const health = await smartSearchHandler.getSearchHealth();
    console.log('📊 Search Health Status:', health);
    
    if (!health.elasticsearch) {
      console.log('⚠️  Elasticsearch is not available. Skipping initialization.');
      console.log('💡 To enable Elasticsearch, ensure it\'s running and ELASTICSEARCH_URL is set.');
      return;
    }
    
    // Initialize the index
    console.log('🏗️  Creating Elasticsearch index...');
    await smartSearchHandler.initializeIndex();
    
    // Get total manga count
    const totalMangas = await prisma.manga.count();
    console.log(`📚 Found ${totalMangas} mangas to index`);
    
    if (totalMangas > 0) {
      console.log('🔄 Starting bulk indexing process...');
      
      const batchSize = 100;
      let processed = 0;
      
      for (let skip = 0; skip < totalMangas; skip += batchSize) {
        const mangas = await prisma.manga.findMany({
          skip,
          take: batchSize,
          include: {
            translations: {
              select: {
                language: true,
                name: true,
                description: true
              }
            },
            categories: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                views: true,
                likes: true,
                chapters: true,
                comments: true
              }
            }
          }
        });
        
        if (mangas.length > 0) {
          await smartSearchHandler.bulkIndexMangas(mangas as any);
          processed += mangas.length;
          
          const percentage = Math.round((processed / totalMangas) * 100);
          console.log(`📈 Progress: ${processed}/${totalMangas} (${percentage}%)`);
        }
      }
      
      console.log('✅ Bulk indexing completed successfully!');
    } else {
      console.log('ℹ️  No mangas found to index.');
    }
    
    console.log('🎉 Elasticsearch initialization completed!');
    
  } catch (error) {
    console.error('❌ Error during Elasticsearch initialization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initializeElasticsearch()
    .then(() => {
      console.log('🏁 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { initializeElasticsearch };