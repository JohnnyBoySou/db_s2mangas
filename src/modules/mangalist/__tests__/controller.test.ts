import { Request, Response, NextFunction } from "express";
import { handleZodError } from "../../../utils/zodError";

// Mock dos handlers
jest.mock("../handlers/MangaListHandler", () => ({
  createMangaList: jest.fn(),
  getMangaLists: jest.fn(),
  getPublicMangaLists: jest.fn(),
  getMangaListById: jest.fn(),
  updateMangaList: jest.fn(),
  deleteMangaList: jest.fn(),
  addMangaToList: jest.fn(),
  removeMangaFromList: jest.fn(),
  updateMangaListItem: jest.fn(),
  reorderMangaListItems: jest.fn(),
  bulkAddMangasToList: jest.fn(),
  processPaginationFromQuery: jest.fn((query) => ({
    filters: {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 20,
      ...(query.status && { status: query.status }),
      ...(query.search && { search: query.search })
    }
  })),
  MangaListNotFoundError: class extends Error {
    constructor() {
      super("Lista de mangás não encontrada");
      this.name = "MangaListNotFoundError";
    }
  },
  MangaNotFoundError: class extends Error {
    constructor() {
      super("Mangá não encontrado");
      this.name = "MangaNotFoundError";
    }
  },
  MangaAlreadyInListError: class extends Error {
    constructor() {
      super("Mangá já está na lista");
      this.name = "MangaAlreadyInListError";
    }
  },
}));

jest.mock("../../../utils/zodError", () => ({
  handleZodError: jest.fn()
}));

// Mock dos validadores
jest.mock("../validators/MangalistValidators", () => ({
  createMangaListSchema: {
    parse: jest.fn((data) => data)
  },
  updateMangaListSchema: {
    parse: jest.fn((data) => data)
  },
  addMangaToListSchema: {
    parse: jest.fn((data) => data)
  },
  updateMangaListItemSchema: {
    parse: jest.fn((data) => data)
  },
  reorderMangaListItemsSchema: {
    parse: jest.fn((data) => data)
  },
  bulkAddToMangaListSchema: {
    parse: jest.fn((data) => data)
  },
  mangaListParamsSchema: {
    parse: jest.fn((data) => ({ id: data.id || data.listId }))
  },
  mangaListItemParamsSchema: {
    parse: jest.fn((data) => data)
  }
}));

const mockMangaListHandlers = require("../handlers/MangaListHandler");
const mockHandleZodError = handleZodError as jest.MockedFunction<
  typeof handleZodError
>;

import * as MangaListController from "../controllers/MangalistController";

describe("Controllers MangaList", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: "user-123" },
    } as any;

    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    mockNext = jest.fn();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    } as any;

    jest.clearAllMocks();
  });

  const mockMangaListData = {
    id: "list-123",
    name: "Minha Lista",
    cover: "https://example.com/cover.jpg",
    mood: "Ação",
    description: "Lista de ação",
    status: "PUBLIC",
    isDefault: false,
    _count: {
      items: 5,
      likes: 10,
    },
  };

  const mockMangaListItem = {
    id: "item-123",
    listId: "list-123",
    mangaId: "manga-123",
    order: 0,
    note: "Ótimo mangá",
    manga: {
      id: "manga-123",
      title: "Manga Teste",
      cover: "https://example.com/manga-cover.jpg",
      status: "ongoing",
    },
  };

  describe("createMangaList", () => {
    it("deve criar lista de mangás com sucesso", async () => {
      mockReq.body = {
        name: "Nova Lista",
        cover: "https://example.com/cover.jpg",
        mood: "Aventura",
        description: "Lista de aventuras",
      };

      mockMangaListHandlers.createMangaList.mockResolvedValue(
        mockMangaListData,
      );

      await MangaListController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.createMangaList).toHaveBeenCalledWith(
        mockReq.body,
      );
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(mockMangaListData);
    });

    it("deve tratar erro de validação", async () => {
      const zodError = new Error("Validation error");
      zodError.name = "ZodError";

      mockHandleZodError.mockImplementation((error, res) => {
        return res.status(400).json({ message: "Erro de validação" });
      });

      mockMangaListHandlers.createMangaList.mockRejectedValue(zodError);

      await MangaListController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockHandleZodError).toHaveBeenCalledWith(zodError, mockRes);
      expect(statusSpy).toHaveBeenCalledWith(400);
    });

    it("deve tratar erro interno do servidor", async () => {
      const error = new Error("Database error");
      
      mockHandleZodError.mockImplementation((error, res) => {
        return res.status(500).json({
          success: false,
          message: "Erro interno do servidor",
        });
      });
      
      mockMangaListHandlers.createMangaList.mockRejectedValue(error);

      await MangaListController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
      });
    });
  });

  describe("getMangaLists", () => {
    it("deve listar listas de mangás com filtros", async () => {
      mockReq.query = {
        status: "PUBLIC",
        search: "ação",
        page: "1",
        limit: "20",
      };

      const mockResponse = {
        lists: [mockMangaListData],
        total: 1,
        totalPages: 1,
        currentPage: 1,
      };

      mockMangaListHandlers.getMangaLists.mockResolvedValue(mockResponse);

      await MangaListController.list(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.getMangaLists).toHaveBeenCalledWith({
        status: "PUBLIC",
        search: "ação",
        page: 1,
        limit: 20,
      });

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(mockResponse);
    });

    it("deve usar valores padrão para parâmetros opcionais", async () => {
      mockReq.query = {};

      const mockResponse = {
        lists: [],
        total: 0,
        totalPages: 0,
        currentPage: 1,
      };

      mockMangaListHandlers.getMangaLists.mockResolvedValue(mockResponse);

      await MangaListController.list(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.getMangaLists).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
    });
  });

  describe("getPublicMangaLists", () => {
    it("deve retornar apenas listas públicas", async () => {
      mockReq.query = {
        page: "1",
        limit: "10",
      };

      const mockResponse = {
        lists: [mockMangaListData],
        total: 1,
        totalPages: 1,
        currentPage: 1,
      };

      mockMangaListHandlers.getPublicMangaLists.mockResolvedValue(mockResponse);

      await MangaListController.listPublic(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.getPublicMangaLists).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe("getMangaListById", () => {
    it("deve retornar lista por ID", async () => {
      mockReq.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      const mockListWithItems = {
        ...mockMangaListData,
        items: [mockMangaListItem],
      };

      mockMangaListHandlers.getMangaListById.mockResolvedValue(
        mockListWithItems,
      );

      await MangaListController.get(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.getMangaListById).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(mockListWithItems);
    });

    it("deve tratar lista não encontrada", async () => {
      mockReq.params = { id: "invalid-id" };

      const error = new mockMangaListHandlers.MangaListNotFoundError();
      mockMangaListHandlers.getMangaListById.mockRejectedValue(error);
      
      mockHandleZodError.mockImplementation((error, res) => {
        return res.status(404).json({
          success: false,
          message: "Lista de mangás não encontrada",
        });
      });

      await MangaListController.get(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: "Lista de mangás não encontrada",
      });
    });
  });

  describe("updateMangaList", () => {
    it("deve atualizar lista com sucesso", async () => {
      mockReq.params = { id: "550e8400-e29b-41d4-a716-446655440000" };
      mockReq.body = {
        name: "Lista Atualizada",
        description: "Nova descrição",
      };

      const updatedList = {
        ...mockMangaListData,
        name: "Lista Atualizada",
        description: "Nova descrição",
      };

      mockMangaListHandlers.updateMangaList.mockResolvedValue(updatedList);

      await MangaListController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.updateMangaList).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        mockReq.body,
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(updatedList);
    });

    it("deve tratar lista não encontrada", async () => {
      mockReq.params = { id: "invalid-id" };
      mockReq.body = { name: "Teste" };

      const error = new mockMangaListHandlers.MangaListNotFoundError();
      mockMangaListHandlers.updateMangaList.mockRejectedValue(error);
      
      mockHandleZodError.mockImplementation((error, res) => {
        return res.status(404).json({
          success: false,
          message: "Lista de mangás não encontrada",
        });
      });

      await MangaListController.update(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: "Lista de mangás não encontrada",
      });
    });
  });

  describe("deleteMangaList", () => {
    it("deve deletar lista com sucesso", async () => {
      mockReq.params = { id: "550e8400-e29b-41d4-a716-446655440000" };

      const deleteResponse = {
        message: "Lista deletada com sucesso",
      };

      mockMangaListHandlers.deleteMangaList.mockResolvedValue(deleteResponse);

      await MangaListController.remove(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.deleteMangaList).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
      );
      expect(statusSpy).toHaveBeenCalledWith(204);
    });

    it("deve tratar lista não encontrada", async () => {
      mockReq.params = { id: "invalid-id" };

      const error = new mockMangaListHandlers.MangaListNotFoundError();
      mockMangaListHandlers.deleteMangaList.mockRejectedValue(error);
      
      mockHandleZodError.mockImplementation((error, res) => {
        return res.status(404).json({
          success: false,
          message: "Lista de mangás não encontrada",
        });
      });

      await MangaListController.remove(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(404);
    });
  });

  describe("addMangaToList", () => {
    it("deve adicionar mangá à lista com sucesso", async () => {
      mockReq.params = { listId: "550e8400-e29b-41d4-a716-446655440000" };
      mockReq.body = {
        mangaId: "550e8400-e29b-41d4-a716-446655440005",
        note: "Ótimo mangá",
      };

      mockMangaListHandlers.addMangaToList.mockResolvedValue(mockMangaListItem);

      await MangaListController.addManga(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.addMangaToList).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        mockReq.body,
      );
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(mockMangaListItem);
    });

    it("deve tratar mangá já na lista", async () => {
      mockReq.params = { listId: "550e8400-e29b-41d4-a716-446655440000" };
      mockReq.body = { mangaId: "550e8400-e29b-41d4-a716-446655440005" };

      const error = new mockMangaListHandlers.MangaAlreadyInListError();
      mockMangaListHandlers.addMangaToList.mockRejectedValue(error);
      
      mockHandleZodError.mockImplementation((error, res) => {
         return res.status(409).json({
           success: false,
           message: "Mangá já está na lista",
         });
       });

      await MangaListController.addManga(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(409);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: "Mangá já está na lista",
      });
    });

    it("deve tratar mangá não encontrado", async () => {
      mockReq.params = { listId: "550e8400-e29b-41d4-a716-446655440000" };
      mockReq.body = { mangaId: "invalid-manga" };

      const error = new mockMangaListHandlers.MangaNotFoundError();
      mockMangaListHandlers.addMangaToList.mockRejectedValue(error);
      
      mockHandleZodError.mockImplementation((error, res) => {
         return res.status(404).json({
           success: false,
           message: "Mangá não encontrado",
         });
       });

      await MangaListController.addManga(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(404);
    });
  });

  describe("removeMangaFromList", () => {
    it("deve remover mangá da lista com sucesso", async () => {
      mockReq.params = { listId: "550e8400-e29b-41d4-a716-446655440000", itemId: "550e8400-e29b-41d4-a716-446655440006" };

      const removeResponse = {
        message: "Mangá removido da lista com sucesso",
      };

      mockMangaListHandlers.removeMangaFromList.mockResolvedValue(
        removeResponse,
      );

      await MangaListController.removeManga(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.removeMangaFromList).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440006",
      );
      expect(statusSpy).toHaveBeenCalledWith(204);
    });
  });

  describe("updateMangaListItem", () => {
    it("deve atualizar item da lista com sucesso", async () => {
      mockReq.params = { listId: "550e8400-e29b-41d4-a716-446655440000", itemId: "550e8400-e29b-41d4-a716-446655440006" };
      mockReq.body = {
        order: 5,
        note: "Nova nota",
      };

      const updatedItem = {
        ...mockMangaListItem,
        order: 5,
        note: "Nova nota",
      };

      mockMangaListHandlers.updateMangaListItem.mockResolvedValue(updatedItem);

      await MangaListController.updateMangaItem(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.updateMangaListItem).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        "550e8400-e29b-41d4-a716-446655440006",
        mockReq.body,
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(updatedItem);
    });
  });

  describe("reorderMangaListItems", () => {
    it("deve reordenar itens da lista com sucesso", async () => {
      mockReq.params = { listId: "550e8400-e29b-41d4-a716-446655440000" };
      mockReq.body = {
        items: [
          { id: "550e8400-e29b-41d4-a716-446655440001", order: 0 },
          { id: "550e8400-e29b-41d4-a716-446655440002", order: 1 },
        ],
      };

      const reorderResponse = {
        message: "Itens reordenados com sucesso",
        updatedItems: 2,
      };

      mockMangaListHandlers.reorderMangaListItems.mockResolvedValue(
        reorderResponse,
      );

      await MangaListController.reorderItems(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.reorderMangaListItems).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        mockReq.body,
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: 'Itens reordenados com sucesso'
      });
    });
  });

  describe("bulkAddMangasToList", () => {
    it("deve adicionar mangás em lote com sucesso", async () => {
      mockReq.params = { listId: "550e8400-e29b-41d4-a716-446655440000" };
      mockReq.body = {
        mangaIds: ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"],
        notes: {
          "550e8400-e29b-41d4-a716-446655440003": "Nota do primeiro",
          "550e8400-e29b-41d4-a716-446655440004": "Nota do segundo",
        },
      };

      const bulkResponse = {
        added: 2,
        skipped: 0,
        errors: [],
      };

      mockMangaListHandlers.bulkAddMangasToList.mockResolvedValue(bulkResponse);

      await MangaListController.bulkAddMangas(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockMangaListHandlers.bulkAddMangasToList).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440000",
        mockReq.body,
      );
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(bulkResponse);
    });
  });

  describe("Error Handling", () => {
    it("deve tratar ZodError em qualquer endpoint", async () => {
      const zodError = new Error("Invalid data");
      zodError.name = "ZodError";

      mockMangaListHandlers.createMangaList.mockRejectedValue(zodError);
      mockHandleZodError.mockImplementation((error, res) => {
        res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: ["Campo obrigatório"]
        });
        return res;
      });

      await MangaListController.create(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: "Dados inválidos",
        errors: ["Campo obrigatório"],
      });
    });

    it("deve tratar erros genéricos", async () => {
      const genericError = new Error("Unexpected error");
      mockMangaListHandlers.getMangaLists.mockRejectedValue(genericError);

      mockHandleZodError.mockImplementation((error, res) => {
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor"
        });
        return res;
      });

      await MangaListController.list(
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        message: "Erro interno do servidor",
      });
    });
  });
});
