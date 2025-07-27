import prisma from '@/prisma/client';

const defaultTags = [
  { name: 'lofi', color: '#8B5CF6' },
  { name: 'rock', color: '#EF4444' },
  { name: 'rap', color: '#F59E0B' },
  { name: 'pop', color: '#EC4899' },
  { name: 'jazz', color: '#10B981' },
  { name: 'classical', color: '#6366F1' },
  { name: 'electronic', color: '#06B6D4' },
  { name: 'indie', color: '#84CC16' },
  { name: 'metal', color: '#64748B' },
  { name: 'reggae', color: '#22C55E' },
  { name: 'blues', color: '#3B82F6' },
  { name: 'country', color: '#F97316' },
  { name: 'funk', color: '#A855F7' },
  { name: 'soul', color: '#DC2626' },
  { name: 'r&b', color: '#DB2777' },
  { name: 'ambient', color: '#059669' },
  { name: 'chill', color: '#0EA5E9' },
  { name: 'upbeat', color: '#FBBF24' },
  { name: 'relaxing', color: '#34D399' },
  { name: 'energetic', color: '#F87171' }
];

export async function seedPlaylistTags() {
  console.log('🌱 Seeding playlist tags...');
  
  try {
    for (const tagData of defaultTags) {
      await prisma.tag.upsert({
        where: { name: tagData.name },
        update: { color: tagData.color },
        create: tagData
      });
    }
    
    console.log(`✅ Successfully seeded ${defaultTags.length} playlist tags`);
  } catch (error) {
    console.error('❌ Error seeding playlist tags:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedPlaylistTags()
    .then(() => {
      console.log('🎉 Playlist tags seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Playlist tags seeding failed:', error);
      process.exit(1);
    });
}