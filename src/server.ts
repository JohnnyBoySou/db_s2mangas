import express from 'express'
import cors from 'cors'
import authRouter from '@/routes/auth/index'

import { MangaRouter, AdminMangaRouter } from '@/routes/manga/index';
import { AdminUsersRouter } from './routes/users';
import { cacheRouter } from './routes/cache';
//import { staticCacheMiddleware, imageOptimizationMiddleware } from './config/cdn';
import { warmupCache } from './middlewares/smartCache';
import { logger } from './utils/logger';

import collectionRouter from '@/routes/collection';
import discoverRouter from '@/routes/discover';
import libraryRouter from '@/routes/library';
import searchRouter from '@/routes/search';
import commentRouter from '@/routes/comment';
import chaptersRouter from '@/routes/chapters';
import { NotificationsRouter, AdminNotificationsRouter } from '@/routes/notifications';
import { WallpaperRouter, AdminWallpaperRouter} from '@/routes/wallpapers';
import { AdminCategoriesRouter, CategoriesRouter } from '@/routes/categories';
import AdminAnalyticsRouter from '@/routes/analytics';
import { AdminPlaylistRouter, PlaylistRouter } from '@/routes/playlists';
import { FileRouter, AdminFileRouter } from '@/routes/files';
import { ProfileRouter } from '@/routes/profile';
import CoinsRouter from './routes/coins';
import ReviewRouter from './routes/review'; 

const app = express()

// Aumenta o limite para 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use('/auth', authRouter)
app.use('/manga/', MangaRouter)
app.use('/categories', CategoriesRouter)
app.use('/collection', collectionRouter)
app.use('/discover', discoverRouter)
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
//ADMIN
app.use('/admin/analytics', AdminAnalyticsRouter)
app.use('/admin/users', AdminUsersRouter )
app.use('/admin/mangas', AdminMangaRouter )
app.use('/admin/wallpapers', AdminWallpaperRouter )
app.use('/admin/categories', AdminCategoriesRouter)
app.use('/admin/notifications', AdminNotificationsRouter)
app.use('/admin/playlists', AdminPlaylistRouter)
app.use('/admin/file', AdminFileRouter)
app.use('/cache', cacheRouter)

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
