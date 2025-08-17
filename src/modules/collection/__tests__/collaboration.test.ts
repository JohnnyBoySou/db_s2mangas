import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prismaMock } from '../../../test/mocks/prisma';

// Mock do módulo prisma/client
jest.mock('@/prisma/client', () => ({
  __esModule: true,
  default: prismaMock
}));

import {
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  listCollaborators,
  checkUserPermission,
  checkUserCanEdit,
  checkUserCanView,
} from '../handlers/CollaboratorHandler';

describe('Sistema de Colaboração em Collections', () => {
  const ownerId = 'owner-id-123';
  const collaboratorId = 'collaborator-id-456';
  const collectionId = 'collection-id-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Adicionar Colaborador', () => {
    it('deve adicionar um colaborador com sucesso', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCollaborator = {
        id: collaboratorId,
        name: 'Colaborador',
        email: 'collaborator@test.com',
        username: 'collaborator',
        password: 'password123',
      };

      const mockCreatedCollaborator = {
        id: 'collab-id-123',
        userId: collaboratorId,
        collectionId,
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockCollaborator,
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.user.findUnique as any).mockResolvedValue(mockCollaborator);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(null);
      (prismaMock.collectionCollaborator.create as any).mockResolvedValue(mockCreatedCollaborator);

      const result = await addCollaborator({
        collectionId,
        userId: collaboratorId,
        role: 'EDITOR',
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe(collaboratorId);
      expect(result.collectionId).toBe(collectionId);
      expect(result.role).toBe('EDITOR');
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(collaboratorId);
    });

    it('deve falhar ao adicionar o dono como colaborador', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);

      await expect(
        addCollaborator({
          collectionId,
          userId: ownerId,
          role: 'EDITOR',
        })
      ).rejects.toThrow('O dono da coleção não pode ser adicionado como colaborador.');
    });

    it('deve falhar ao adicionar o mesmo colaborador duas vezes', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCollaborator = {
        id: collaboratorId,
        name: 'Colaborador',
        email: 'collaborator@test.com',
        username: 'collaborator',
        password: 'password123',
      };

      const existingCollaborator = {
        id: 'existing-collab',
        userId: collaboratorId,
        collectionId,
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.user.findUnique as any).mockResolvedValue(mockCollaborator);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(existingCollaborator);

      await expect(
        addCollaborator({
          collectionId,
          userId: collaboratorId,
          role: 'ADMIN',
        })
      ).rejects.toThrow('Usuário já é colaborador desta coleção.');
    });
  });

  describe('Verificar Permissões', () => {
    it('deve retornar permissão de dono para o criador da collection', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);

      const permission = await checkUserPermission(collectionId, ownerId);

      expect(permission.hasPermission).toBe(true);
      expect(permission.isOwner).toBe(true);
      expect(permission.role).toBe('OWNER');
    });

    it('deve retornar permissão de colaborador para usuário adicionado', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCollaborator = {
        id: 'collab-id-123',
        userId: collaboratorId,
        collectionId,
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(mockCollaborator);

      const permission = await checkUserPermission(collectionId, collaboratorId);

      expect(permission.hasPermission).toBe(true);
      expect(permission.isOwner).toBe(false);
      expect(permission.role).toBe('EDITOR');
    });

    it('deve retornar sem permissão para usuário não relacionado', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherUserId = 'other-user-id';

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(null);

      const permission = await checkUserPermission(collectionId, otherUserId);

      expect(permission.hasPermission).toBe(false);
      expect(permission.isOwner).toBe(false);
      expect(permission.role).toBe(null);
    });
  });

  describe('Atualizar Papel do Colaborador', () => {
    it('deve atualizar o papel do colaborador', async () => {
      const mockCollaborator = {
        id: 'collab-id-123',
        userId: collaboratorId,
        collectionId,
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedCollaborator = {
        ...mockCollaborator,
        role: 'ADMIN',
        user: {
          id: collaboratorId,
          name: 'Colaborador',
          username: 'collaborator',
          avatar: null,
        },
      };

      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(mockCollaborator);
      (prismaMock.collectionCollaborator.update as any).mockResolvedValue(mockUpdatedCollaborator);

      const result = await updateCollaboratorRole({
        collectionId,
        userId: collaboratorId,
        role: 'ADMIN',
      });

      expect(result.role).toBe('ADMIN');
    });

    it('deve falhar ao atualizar colaborador inexistente', async () => {
      const otherUserId = 'other-user-id';

      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(null);

      await expect(
        updateCollaboratorRole({
          collectionId,
          userId: otherUserId,
          role: 'ADMIN',
        })
      ).rejects.toThrow('Colaborador não encontrado.');
    });
  });

  describe('Listar Colaboradores', () => {
    it('deve listar colaboradores da collection', async () => {
      const mockCollaborators = [
        {
          id: 'collab-id-123',
          userId: collaboratorId,
          collectionId,
          role: 'EDITOR',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: collaboratorId,
            name: 'Colaborador',
            username: 'collaborator',
            avatar: null,
          },
        },
      ];

      (prismaMock.collection.findUnique as any).mockResolvedValue({
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prismaMock.collectionCollaborator.findMany as any).mockResolvedValue(mockCollaborators);

      const collaborators = await listCollaborators(collectionId);

      expect(collaborators).toHaveLength(1);
      expect(collaborators[0].userId).toBe(collaboratorId);
      expect(collaborators[0].role).toBe('EDITOR');
      expect(collaborators[0].user).toBeDefined();
    });

    it('deve retornar lista vazia para collection sem colaboradores', async () => {
      (prismaMock.collection.findUnique as any).mockResolvedValue({
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prismaMock.collectionCollaborator.findMany as any).mockResolvedValue([]);

      const collaborators = await listCollaborators(collectionId);

      expect(collaborators).toHaveLength(0);
    });
  });

  describe('Remover Colaborador', () => {
    it('deve remover colaborador com sucesso', async () => {
      const mockCollaborator = {
        id: 'collab-id-123',
        userId: collaboratorId,
        collectionId,
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(mockCollaborator);
      (prismaMock.collectionCollaborator.delete as any).mockResolvedValue(mockCollaborator);

      const result = await removeCollaborator({
        collectionId,
        userId: collaboratorId,
      });

      expect(result.message).toBe('Colaborador removido com sucesso.');
    });

    it('deve falhar ao remover colaborador inexistente', async () => {
      const otherUserId = 'other-user-id';

      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(null);

      await expect(
        removeCollaborator({
          collectionId,
          userId: otherUserId,
        })
      ).rejects.toThrow('Colaborador não encontrado.');
    });
  });

  describe('Verificação de Permissões de Edição', () => {
    it('deve permitir edição para dono da collection', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);

      const permission = await checkUserCanEdit(collectionId, ownerId);

      expect(permission.hasPermission).toBe(true);
      expect(permission.isOwner).toBe(true);
    });

    it('deve permitir edição para colaborador', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCollaborator = {
        id: 'collab-id-123',
        userId: collaboratorId,
        collectionId,
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(mockCollaborator);

      const permission = await checkUserCanEdit(collectionId, collaboratorId);

      expect(permission.hasPermission).toBe(true);
      expect(permission.isOwner).toBe(false);
    });

    it('deve negar edição para usuário sem permissão', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherUserId = 'other-user-id';

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(null);

      await expect(
        checkUserCanEdit(collectionId, otherUserId)
      ).rejects.toThrow('Você não tem permissão para modificar esta coleção.');
    });
  });

  describe('Verificação de Permissões de Visualização', () => {
    it('deve permitir visualização para dono da collection privada', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);

      const permission = await checkUserCanView(collectionId, ownerId);

      expect(permission.hasPermission).toBe(true);
      expect(permission.isOwner).toBe(true);
    });

    it('deve permitir visualização para colaborador de collection privada', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCollaborator = {
        id: 'collab-id-123',
        userId: collaboratorId,
        collectionId,
        role: 'EDITOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(mockCollaborator);

      const permission = await checkUserCanView(collectionId, collaboratorId);

      expect(permission.hasPermission).toBe(true);
      expect(permission.isOwner).toBe(false);
    });

    it('deve negar visualização para usuário sem permissão em collection privada', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PRIVATE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherUserId = 'other-user-id';

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);
      (prismaMock.collectionCollaborator.findUnique as any).mockResolvedValue(null);

      await expect(
        checkUserCanView(collectionId, otherUserId)
      ).rejects.toThrow('Você não tem permissão para visualizar esta coleção.');
    });

    it('deve permitir visualização para qualquer usuário em collection pública', async () => {
      const mockCollection = {
        id: collectionId,
        userId: ownerId,
        name: 'Collection de Teste',
        cover: 'https://example.com/cover.jpg',
        description: 'Collection para testes',
        status: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherUserId = 'other-user-id';

      (prismaMock.collection.findUnique as any).mockResolvedValue(mockCollection);

      const permission = await checkUserCanView(collectionId, otherUserId);

      expect(permission.hasPermission).toBe(true);
      expect(permission.isOwner).toBe(false);
      expect(permission.role).toBe('VIEWER');
    });
  });
});
