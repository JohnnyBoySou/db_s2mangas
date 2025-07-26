import express from 'express'
import cors from 'cors'
import { AdminUsersRouter } from '@/routes/users';
//import { cacheRouter } from './routes/cache';
import { warmupCache } from '@/middlewares/smartCache';
import { logger } from '@/utils/logger';

import collectionRouter from '@/routes/collection';
import CoinsRouter from '@/routes/coins';
import ReviewRouter from '@/routes/review';

import { DiscoverRouter } from '@/modules/discover/routes/DiscoverRouter';
import { PlaylistRouter, AdminPlaylistRouter } from '@/modules/playlists/routes/PlaylistRouter';
import { AuthRouter } from '@/modules/auth/routes/AuthRouter'
import { ForgotPasswordRouter } from '@/modules/auth/routes/ForgotPasswordRouter';
import { AdminMangaListRouter } from '@/modules/mangalist/routes/AdminMangaListRouter';
import { MangaListRouter } from '@/modules/mangalist/routes/MangaListRouter';

import libraryRouter from '@/routes/library';
import searchRouter from '@/routes/search';
import commentRouter from '@/routes/comment';
import chaptersRouter from '@/routes/chapters';


import { MangaRouter, AdminMangaRouter } from '@/routes/manga';
import { NotificationsRouter, AdminNotificationsRouter } from '@/routes/notifications';
import { WallpaperRouter, AdminWallpaperRouter} from '@/routes/wallpapers';
import { CategoriesRouter, AdminCategoriesRouter } from '@/routes/categories';
import { FileRouter, AdminFileRouter } from '@/routes/files';
import { ProfileRouter } from '@/routes/profile';


import AdminAnalyticsRouter from '@/routes/analytics';

const app = express()

// Aumenta o limite para 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use('/auth', AuthRouter)
app.use('/forgot-password', ForgotPasswordRouter)

app.use('/manga/', MangaRouter)
app.use('/categories', CategoriesRouter)
app.use('/collection', collectionRouter)
app.use('/discover', DiscoverRouter)
app.use('/library', libraryRouter)
app.use('/search', searchRouter)
app.use('/comment', commentRouter)
app.use('/chapter', chaptersRouter)
app.use('/notifications', NotificationsRouter)
app.use('/wallpapers', WallpaperRouter)
app.use('/playlists', PlaylistRouter)
app.use('/file', FileRouter)
app.use('/uploads', express.static('uploads'));
app.use('/profile', ProfileRouter)
app.use('/coins', CoinsRouter)
app.use('/review', ReviewRouter)
app.use('/moods', MangaListRouter)


//ADMIN
app.use('/admin/analytics', AdminAnalyticsRouter)
app.use('/admin/moods', AdminMangaListRouter)
app.use('/admin/users', AdminUsersRouter )
app.use('/admin/mangas', AdminMangaRouter )
app.use('/admin/wallpapers', AdminWallpaperRouter )
app.use('/admin/categories', AdminCategoriesRouter)
app.use('/admin/notifications', AdminNotificationsRouter)
app.use('/admin/playlists', AdminPlaylistRouter)
app.use('/admin/file', AdminFileRouter)
//app.use('/cache', cacheRouter)

// Middlewares de cache e CDN
//app.use('/static', staticCacheMiddleware());
//app.use('/images', imageOptimizationMiddleware());

// Configurar o proxy para a API do MangaDex
//app.use('/api/mangadx', mangaDexProxy);

app.listen(3000, async () => {
  console.log('✅ Servidor inciado com sucesso! \n✅ Rodando em http://localhost:3000')
  
  // Inicializar cache warming
  try {
    logger.info('Iniciando cache warming...');
    await warmupCache();
    logger.info('Cache warming concluído');
  } catch (error) {
    logger.error('Erro no cache warming:', error);
  }
})

export default app;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'S2Mangas API is running!',
    version: require('../package.json').version,
    endpoints: {
      health: '/health',
      auth: '/auth',
      manga: '/manga',
      categories: '/categories'
    }
  })
})
