import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tags padrão
const defaultTags = [
  { name: 'Rock', color: '#E53E3E' },
  { name: 'Pop', color: '#3182CE' },
  { name: 'Jazz', color: '#805AD5' },
  { name: 'Classical', color: '#38A169' },
  { name: 'Electronic', color: '#00B5D8' },
  { name: 'Hip Hop', color: '#D69E2E' },
  { name: 'Country', color: '#DD6B20' },
  { name: 'R&B', color: '#9F7AEA' },
  { name: 'Reggae', color: '#48BB78' },
  { name: 'Blues', color: '#4299E1' },
  { name: 'Folk', color: '#ED8936' },
  { name: 'Punk', color: '#F56565' },
  { name: 'Metal', color: '#718096' },
  { name: 'Indie', color: '#ECC94B' },
  { name: 'Alternative', color: '#68D391' },
  { name: 'Chill', color: '#81E6D9' },
  { name: 'Energetic', color: '#FBB6CE' },
  { name: 'Romantic', color: '#F687B3' },
  { name: 'Melancholic', color: '#A0AEC0' },
  { name: 'Upbeat', color: '#FED7D7' }
];

// Playlists de exemplo
const samplePlaylists = [
  {
    name: 'Rock Classics',
    cover: 'https://example.com/covers/rock-classics.jpg',
    link: 'https://spotify.com/playlist/rock-classics',
    description: 'The best rock songs of all time',
    tags: ['Rock', 'Classic']
  },
  {
    name: 'Chill Vibes',
    cover: 'https://example.com/covers/chill-vibes.jpg',
    link: 'https://spotify.com/playlist/chill-vibes',
    description: 'Perfect for relaxing and unwinding',
    tags: ['Chill', 'Electronic', 'Indie']
  },
  {
    name: 'Pop Hits 2024',
    cover: 'https://example.com/covers/pop-hits.jpg',
    link: 'https://spotify.com/playlist/pop-hits-2024',
    description: 'The biggest pop songs of the year',
    tags: ['Pop', 'Upbeat', 'Energetic']
  },
  {
    name: 'Jazz Café',
    cover: 'https://example.com/covers/jazz-cafe.jpg',
    link: 'https://spotify.com/playlist/jazz-cafe',
    description: 'Smooth jazz for coffee time',
    tags: ['Jazz', 'Chill']
  },
  {
    name: 'Hip Hop Essentials',
    cover: 'https://example.com/covers/hiphop-essentials.jpg',
    link: 'https://spotify.com/playlist/hiphop-essentials',
    description: 'Must-have hip hop tracks',
    tags: ['Hip Hop', 'Energetic']
  },
  {
    name: 'Romantic Evening',
    cover: 'https://example.com/covers/romantic-evening.jpg',
    link: 'https://spotify.com/playlist/romantic-evening',
    description: 'Perfect songs for a romantic night',
    tags: ['Romantic', 'R&B', 'Pop']
  },
  {
    name: 'Metal Mayhem',
    cover: 'https://example.com/covers/metal-mayhem.jpg',
    link: 'https://spotify.com/playlist/metal-mayhem',
    description: 'Heavy metal at its finest',
    tags: ['Metal', 'Energetic', 'Rock']
  },
  {
    name: 'Indie Discovery',
    cover: 'https://example.com/covers/indie-discovery.jpg',
    link: 'https://spotify.com/playlist/indie-discovery',
    description: 'Discover new indie artists',
    tags: ['Indie', 'Alternative', 'Chill']
  },
  {
    name: 'Country Roads',
    cover: 'https://example.com/covers/country-roads.jpg',
    link: 'https://spotify.com/playlist/country-roads',
    description: 'Classic and modern country hits',
    tags: ['Country', 'Folk']
  },
  {
    name: 'Electronic Dreams',
    cover: 'https://example.com/covers/electronic-dreams.jpg',
    link: 'https://spotify.com/playlist/electronic-dreams',
    description: 'Journey through electronic soundscapes',
    tags: ['Electronic', 'Chill', 'Energetic']
  }
];

async function seedTags() {
  console.log('🏷️  Seeding tags...');
  
  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: { color: tag.color },
      create: {
        name: tag.name,
        color: tag.color,
      },
    });
  }
  
  console.log(`✅ Successfully seeded ${defaultTags.length} tags`);
}

async function seedPlaylists() {
  console.log('🎵 Seeding playlists...');
  
  for (const playlistData of samplePlaylists) {
    // Verificar se a playlist já existe
    let playlist = await prisma.playlist.findFirst({
      where: { name: playlistData.name }
    });

    if (playlist) {
      // Atualizar playlist existente
      playlist = await prisma.playlist.update({
        where: { id: playlist.id },
        data: {
          cover: playlistData.cover,
          link: playlistData.link,
          description: playlistData.description,
        },
      });
    } else {
      // Criar nova playlist
      playlist = await prisma.playlist.create({
        data: {
          name: playlistData.name,
          cover: playlistData.cover,
          link: playlistData.link,
          description: playlistData.description,
        },
      });
    }

    // Buscar as tags que queremos associar
    const tags = await prisma.tag.findMany({
      where: {
        name: {
          in: playlistData.tags
        }
      }
    });

    // Criar os relacionamentos playlist-tag
    for (const tag of tags) {
      await prisma.playlistTag.upsert({
        where: {
          playlistId_tagId: {
            playlistId: playlist.id,
            tagId: tag.id
          }
        },
        update: {},
        create: {
          playlistId: playlist.id,
          tagId: tag.id
        }
      });
    }

    console.log(`✅ Created playlist "${playlist.name}" with ${tags.length} tags`);
  }
  
  console.log(`✅ Successfully seeded ${samplePlaylists.length} playlists`);
}

async function seedCompletePlaylistData() {
  try {
    console.log('🚀 Starting complete playlist seeding...');
    
    await seedTags();
    await seedPlaylists();
    
    console.log('🎉 Complete playlist seeding completed!');
    
    // Mostrar estatísticas finais
    const tagCount = await prisma.tag.count();
    const playlistCount = await prisma.playlist.count();
    const relationshipCount = await prisma.playlistTag.count();
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Tags: ${tagCount}`);
    console.log(`   Playlists: ${playlistCount}`);
    console.log(`   Playlist-Tag relationships: ${relationshipCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding playlist data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o seed se o arquivo for chamado diretamente
if (require.main === module) {
  seedCompletePlaylistData();
}

export { seedCompletePlaylistData };