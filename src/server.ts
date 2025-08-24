import 'dotenv/config';

import { initSentry, sentryErrorHandler } from '@/sentry';

import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { warmupCache } from '@/middlewares/smartCache';
import { startInteractiveTerminal } from '@/utils/interactiveTerminal';
import { specs } from '@/config/swagger';

// ✅ Middlewares
import { initScalarDocs } from '@/middlewares/scalarDocs';
import { observabilityMiddleware, errorObservabilityMiddleware } from '@/middlewares/observability';

import { usernameBloomFilter } from '@/services/UsernameBloomFilter';

// ✅ Modulos
import { MetricsRouter } from '@/modules/metrics/MetricsRouter';
import { DiscoverRouter } from '@/modules/discover/routes/DiscoverRouter';
import { PlaylistRouter, AdminPlaylistRouter } from '@/modules/playlists/routes/PlaylistRouter';
import { AuthRouter } from '@/modules/auth/routes/AuthRouter'
import { ForgotPasswordRouter } from '@/modules/auth/routes/ForgotPasswordRouter';
import { AdminMangaListRouter } from '@/modules/mangalist/routes/AdminMangaListRouter';
import { MangaListRouter } from '@/modules/mangalist/routes/MangaListRouter';
import { AdminAnalyticsRouter } from '@/modules/analytics/routes/AnalyticsRouter';
import { LibraryRouter } from '@/modules/library/routes/LibraryRouter';
import { CoinsRouter } from '@/modules/coins/routes/CoinsRouter';
import { CommentRouter } from '@/modules/comment/routes/CommentRouter';
import { CollectionRouter } from '@/modules/collection/routers/CollectionRouter';
import { ReviewRouter } from '@/modules/review/routes/ReviewRouter';
import { CategoriesRouter, AdminCategoriesRouter } from '@/modules/categories/routes/CategoriesRouter';
import { NotificationsRouter, AdminNotificationsRouter } from '@/modules/notifications/routes/NotificationsRouter';
import { SearchRouter } from '@/modules/search/routes/SearchRouter';
import { AdminUsersRouter } from '@/modules/users/routes/UsersRouter';
import { WallpaperRouter, AdminWallpaperRouter } from '@/modules/wallpapers/routes/WallpaperRouter';
import { MangaRouter, AdminMangaRouter } from '@/modules/manga/routes/MangaRouter';
import { ProfileRouter } from '@/modules/profile/routes/ProfileRouter';
import { ChaptersRouter } from '@/modules/chapters/routes/ChaptersRouter';
import { FileRouter, AdminFileRouter } from '@/modules/files/routes/FilesRouter';
import { SummaryRouter } from '@/modules/summary/routes/SummaryRouter';
import { HealthRouter } from '@/modules/health/HealthRouter';

const uploadsDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.UPLOAD_DIR || "/data/uploads";

const app = express()

app.use(observabilityMiddleware);
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
app.use('/collection', CollectionRouter)
app.use('/discover', DiscoverRouter)
app.use('/library', LibraryRouter)
app.use('/search', SearchRouter)
app.use('/comment', CommentRouter)
app.use('/chapter', ChaptersRouter)
app.use('/notifications', NotificationsRouter)
app.use('/wallpapers', WallpaperRouter)
app.use('/playlists', PlaylistRouter)
app.use('/file', FileRouter)
app.use('/profile', ProfileRouter)
app.use('/coins', CoinsRouter)
app.use('/review', ReviewRouter)
app.use('/moods', MangaListRouter)
app.use('/summary', SummaryRouter)
app.use("/uploads", express.static(uploadsDir, { maxAge: "7d", immutable: true, }));

//ADMIN
app.use('/admin/analytics', AdminAnalyticsRouter)
app.use('/admin/moods', AdminMangaListRouter)
app.use('/admin/users', AdminUsersRouter)
app.use('/admin/mangas', AdminMangaRouter)
app.use('/admin/wallpapers', AdminWallpaperRouter)
app.use('/admin/categories', AdminCategoriesRouter)
app.use('/admin/notifications', AdminNotificationsRouter)
app.use('/admin/playlists', AdminPlaylistRouter)
app.use('/admin/file', AdminFileRouter)
//app.use('/cache', cacheRouter)

app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'S2Mangas API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  }
}));

app.use('/metrics', MetricsRouter);
app.use('/health', HealthRouter);
app.use(sentryErrorHandler());
app.use(errorObservabilityMiddleware);

async function startServer() {
  try {
    await initScalarDocs(app);
    console.log('✅ Scalar docs configurado com sucesso');
  } catch (error) {
    console.warn('⚠️ Erro ao configurar Scalar docs:', error);
  }

  try {
    initSentry();
    console.log('✅ Sentry configurado com sucesso');
  } catch (error) {
    console.warn('⚠️ Erro ao configurar Sentry:', error);
  }

  app.listen(process.env.PORT || 3000, async () => {
    const port = process.env.PORT || 3000;
    console.log(`✅ Servidor inciado com sucesso! \n✅ Rodando em http://localhost:${port}`)

    try {
      await warmupCache();
      console.log('✅ Cache warming concluído');
    } catch (error) {
      console.error('Erro no cache warming:', error);
    }

    try {
      await usernameBloomFilter.initialize();
      console.log('✅ Username Bloom Filter inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Username Bloom Filter:', error);
    }
  })
}

// Iniciar servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}

export default app;
