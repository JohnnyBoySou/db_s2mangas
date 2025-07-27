import { RequestHandler } from 'express';
import { DiscoverUseCase } from '../useCases/DiscoverUseCase';
import { DiscoverRepository } from '../repositories/DiscoverRepository';
import { DiscoverService } from '../services/DiscoverService';

// Instâncias dos serviços (poderia ser injetado por DI container)
const discoverRepository = new DiscoverRepository();
const discoverService = new DiscoverService();
const discoverUseCase = new DiscoverUseCase(discoverRepository, discoverService);

export class DiscoverController {
  /**
   * GET /discover/recents
   * Retorna mangás recentes
   */
  static getRecent: RequestHandler = async (req, res) => {
    try {
      const { page, take, language } = discoverUseCase.processPaginationFromQuery(req.query);
      
      const result = await discoverUseCase.getRecentMangas(language, page, take);
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/views
   * Retorna mangás mais vistos
   */
  static getMostViewed: RequestHandler = async (req, res) => {
    try {
      const { page, take, language } = discoverUseCase.processPaginationFromQuery(req.query);
      
      const result = await discoverUseCase.getMostViewedMangas(language, page, take);
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/likes
   * Retorna mangás mais curtidos
   */
  static getMostLiked: RequestHandler = async (req, res) => {
    try {
      const { page, take, language } = discoverUseCase.processPaginationFromQuery(req.query);
      
      const result = await discoverUseCase.getMostLikedMangas(language, page, take);
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/feed
   * Retorna feed personalizado baseado nas categorias favoritas do usuário
   */
  static getFeed: RequestHandler = async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
      }

      const { page, take, language } = discoverUseCase.processPaginationFromQuery(req.query);
      
      const result = await discoverUseCase.getFeedForUser(userId, language, page, take);
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/ia
   * Retorna recomendações baseadas em IA
   */
  static getIA: RequestHandler = async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Não autenticado.' });
        return;
      }

      const { page, take, language } = discoverUseCase.processPaginationFromQuery(req.query);
      
      const result = await discoverUseCase.getIARecommendations(userId, language, page, take);
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/categories/:categoryIds
   * Retorna mangás de categorias específicas
   */
  static getMangasByCategories: RequestHandler = async (req, res) => {
    try {
      const categoryIds = req.params.categoryIds?.split(',') || [];
      
      if (categoryIds.length === 0) {
        res.status(400).json({ error: 'IDs de categorias são obrigatórios' });
        return;
      }

      const { page, take, language } = discoverUseCase.processPaginationFromQuery(req.query);
      
      const result = await discoverUseCase.getMangasByCategories(categoryIds, language, page, take);
      
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(400).json({ error: message });
    }
  };

  /**
   * GET /discover/stats
   * Retorna estatísticas de discover (admin only)
   */
  static getStats: RequestHandler = async (req, res) => {
    try {
      const language = req.query.lg as string || 'en';
      
      const stats = await discoverUseCase.getDiscoverStats(language);
      
      res.status(200).json(stats);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /discover/health
   * Health check endpoint
   */
  static healthCheck: RequestHandler = async (req, res) => {
    try {
      // Pode incluir checks de conectividade com banco, etc.
      res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'discover'
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'discover'
      });
    }
  };
}

// Exports nomeados para compatibilidade com o router atual
export const getRecent = DiscoverController.getRecent;
export const getMostViewed = DiscoverController.getMostViewed;
export const getMostLiked = DiscoverController.getMostLiked;
export const getFeed = DiscoverController.getFeed;
export const getIA = DiscoverController.getIA;
export const getMangasByCategories = DiscoverController.getMangasByCategories;
export const getStats = DiscoverController.getStats;
export const healthCheck = DiscoverController.healthCheck; 