import express from 'express';
import * as analyticsController from '@/controllers/analytics';

const AdminAnalyticsRouter = express.Router();
AdminAnalyticsRouter.get('/ping', analyticsController.ping);

// Rotas de estatísticas gerais
AdminAnalyticsRouter.get('/stats/general', analyticsController.getGeneralStats);
AdminAnalyticsRouter.get('/stats/views', analyticsController.getViewsByPeriod);
AdminAnalyticsRouter.get('/stats/users', analyticsController.getUsersByPeriod);

// Rotas de mangás mais populares
AdminAnalyticsRouter.get('/manga/most-viewed', analyticsController.getMostViewedMangas);
AdminAnalyticsRouter.get('/manga/most-liked', analyticsController.getMostLikedMangas);
AdminAnalyticsRouter.get('/manga/most-commented', analyticsController.getMostCommentedMangas);

// Rotas de usuários mais ativos
AdminAnalyticsRouter.get('/users/most-active', analyticsController.getMostActiveUsers);

// Rotas de estatísticas por categoria
AdminAnalyticsRouter.get('/stats/categories', analyticsController.getCategoryStats);
AdminAnalyticsRouter.get('/stats/languages', analyticsController.getLanguageStats);
AdminAnalyticsRouter.get('/stats/manga-types', analyticsController.getMangaTypeStats);
AdminAnalyticsRouter.get('/stats/manga-status', analyticsController.getMangaStatusStats);

export default AdminAnalyticsRouter; 