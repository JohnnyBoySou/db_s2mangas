import { RequestHandler } from 'express';
import { MangaListRepository } from '../repositories/MangaListRepository';
import { MangaListItemRepository } from '../repositories/MangaListItemRepository';
import { MangaListValidationRepository } from '../repositories/MangaListValidationRepository';
import { MangaListService } from '../services/MangaListService';
import { MangaListUseCase } from '../useCases/MangaListUseCase';
import { 
  MangaListNotFoundError, 
  MangaNotFoundError, 
  MangaListItemNotFoundError, 
  MangaAlreadyInListError, 
  InvalidMangaListDataError 
} from '../interfaces/service';
import { 
  createMangaListSchema,
  updateMangaListSchema,
  addMangaToListSchema,
  updateMangaListItemSchema,
  reorderMangaListItemsSchema,
  bulkAddToMangaListSchema,
  mangaListParamsSchema,
  mangaListItemParamsSchema
} from '../validators/MangalistSchema';

// Instâncias dos repositórios e serviços
const mangaListRepository = new MangaListRepository();
const mangaListItemRepository = new MangaListItemRepository();
const mangaListValidationRepository = new MangaListValidationRepository();
const mangaListService = new MangaListService();

// Instância do UseCase
const mangaListUseCase = new MangaListUseCase(
  mangaListRepository,
  mangaListItemRepository,
  mangaListValidationRepository,
  mangaListService
);

export class MangaListController {
  /**
   * POST /mangalist
   * Cria uma nova lista de mangás
   */
  static create: RequestHandler = async (req, res) => {
    try {
      const parsed = createMangaListSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ 
          error: 'Dados inválidos', 
          details: parsed.error.issues 
        });
        return;
      }

      const mangaList = await mangaListUseCase.createMangaList(parsed.data);
      res.status(201).json(mangaList);
    } catch (error) {
      if (error instanceof InvalidMangaListDataError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /mangalist
   * Lista mangás com filtros e paginação
   */
  static list: RequestHandler = async (req, res) => {
    try {
      const { page, limit, filters } = mangaListUseCase.processPaginationFromQuery(req.query);
      
      const result = await mangaListUseCase.getMangaLists(filters);
      
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidMangaListDataError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /mangalist/public
   * Lista apenas listas públicas
   */
  static listPublic: RequestHandler = async (req, res) => {
    try {
      const { page, limit, filters } = mangaListUseCase.processPaginationFromQuery(req.query);
      
      const result = await mangaListUseCase.getPublicMangaLists(filters);
      
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidMangaListDataError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /mangalist/:id
   * Busca uma lista específica
   */
  static get: RequestHandler = async (req, res) => {
    try {
      const parsed = mangaListParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: parsed.error.issues 
        });
        return;
      }

      const mangaList = await mangaListUseCase.getMangaListById(parsed.data.id);
      res.status(200).json(mangaList);
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * PUT /mangalist/:id
   * Atualiza uma lista de mangás
   */
  static update: RequestHandler = async (req, res) => {
    try {
      const paramsValidation = mangaListParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: paramsValidation.error.issues 
        });
        return;
      }

      const bodyValidation = updateMangaListSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({ 
          error: 'Dados inválidos', 
          details: bodyValidation.error.issues 
        });
        return;
      }

      const mangaList = await mangaListUseCase.updateMangaList(
        paramsValidation.data.id, 
        bodyValidation.data
      );
      
      res.status(200).json(mangaList);
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error instanceof InvalidMangaListDataError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * DELETE /mangalist/:id
   * Remove uma lista de mangás
   */
  static remove: RequestHandler = async (req, res) => {
    try {
      const parsed = mangaListParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: parsed.error.issues 
        });
        return;
      }

      await mangaListUseCase.deleteMangaList(parsed.data.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * POST /mangalist/:id/manga
   * Adiciona um mangá à lista
   */
  static addManga: RequestHandler = async (req, res) => {
    try {
      const paramsValidation = mangaListParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: paramsValidation.error.issues 
        });
        return;
      }

      const bodyValidation = addMangaToListSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({ 
          error: 'Dados inválidos', 
          details: bodyValidation.error.issues 
        });
        return;
      }

      const addedItem = await mangaListUseCase.addMangaToList(
        paramsValidation.data.id, 
        bodyValidation.data
      );
      
      res.status(201).json(addedItem);
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error instanceof MangaNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error instanceof MangaAlreadyInListError) {
        res.status(409).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * DELETE /mangalist/:listId/manga/:itemId
   * Remove um mangá da lista
   */
  static removeManga: RequestHandler = async (req, res) => {
    try {
      const parsed = mangaListItemParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: parsed.error.issues 
        });
        return;
      }

      await mangaListUseCase.removeMangaFromList(
        parsed.data.listId, 
        parsed.data.itemId
      );
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error instanceof MangaListItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * PUT /mangalist/:listId/manga/:itemId
   * Atualiza um item da lista
   */
  static updateMangaItem: RequestHandler = async (req, res) => {
    try {
      const paramsValidation = mangaListItemParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: paramsValidation.error.issues 
        });
        return;
      }

      const bodyValidation = updateMangaListItemSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({ 
          error: 'Dados inválidos', 
          details: bodyValidation.error.issues 
        });
        return;
      }

      const updatedItem = await mangaListUseCase.updateMangaListItem(
        paramsValidation.data.listId, 
        paramsValidation.data.itemId, 
        bodyValidation.data
      );
      
      res.status(200).json(updatedItem);
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error instanceof MangaListItemNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * POST /mangalist/:id/reorder
   * Reordena itens da lista
   */
  static reorderItems: RequestHandler = async (req, res) => {
    try {
      const paramsValidation = mangaListParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: paramsValidation.error.issues 
        });
        return;
      }

      const bodyValidation = reorderMangaListItemsSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({ 
          error: 'Dados inválidos', 
          details: bodyValidation.error.issues 
        });
        return;
      }

      await mangaListUseCase.reorderMangaListItems(
        paramsValidation.data.id, 
        bodyValidation.data.items
      );
      
      res.status(200).json({ message: 'Itens reordenados com sucesso' });
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error instanceof InvalidMangaListDataError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * POST /mangalist/:id/bulk-add
   * Adiciona múltiplos mangás à lista
   */
  static bulkAddMangas: RequestHandler = async (req, res) => {
    try {
      const paramsValidation = mangaListParamsSchema.safeParse(req.params);
      if (!paramsValidation.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: paramsValidation.error.issues 
        });
        return;
      }

      const bodyValidation = bulkAddToMangaListSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        res.status(400).json({ 
          error: 'Dados inválidos', 
          details: bodyValidation.error.issues 
        });
        return;
      }

      const result = await mangaListUseCase.bulkAddMangasToList(
        paramsValidation.data.id, 
        bodyValidation.data
      );
      
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error instanceof InvalidMangaListDataError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /mangalist/:id/stats
   * Busca estatísticas da lista
   */
  static getStats: RequestHandler = async (req, res) => {
    try {
      const parsed = mangaListParamsSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(400).json({ 
          error: 'Parâmetros inválidos', 
          details: parsed.error.issues 
        });
        return;
      }

      const stats = await mangaListUseCase.getMangaListStats(parsed.data.id);
      res.status(200).json(stats);
    } catch (error) {
      if (error instanceof MangaListNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /mangalist/mood/:mood
   * Busca listas por mood
   */
  static getByMood: RequestHandler = async (req, res) => {
    try {
      const { mood } = req.params;
      const { page, limit, filters } = mangaListUseCase.processPaginationFromQuery(req.query);
      
      const result = await mangaListUseCase.getMangaListsByMood(mood, filters);
      
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidMangaListDataError) {
        res.status(400).json({ error: error.message });
        return;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };

  /**
   * GET /mangalist/healthcheck
   * Verifica se o serviço está funcionando
   */
  static healthCheck: RequestHandler = async (req, res) => {
    try {
      res.status(200).json({ 
        message: 'Serviço MangaList funcionando', 
        timestamp: new Date().toISOString() 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro interno do servidor';
      res.status(500).json({ error: message });
    }
  };
}

