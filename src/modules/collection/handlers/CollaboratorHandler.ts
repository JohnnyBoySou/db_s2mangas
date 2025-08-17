import { CollaboratorRole } from '@prisma/client';
import prisma from '@/prisma/client';

export const addCollaborator = async (data: {
  collectionId: string;
  userId: string;
  role: CollaboratorRole;
}) => {
  const { collectionId, userId, role } = data;

  // Verificar se a coleção existe
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw new Error('Coleção não encontrada.');
  }

  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  // Verificar se já é colaborador
  const existingCollaborator = await prisma.collectionCollaborator.findUnique({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
  });

  if (existingCollaborator) {
    throw new Error('Usuário já é colaborador desta coleção.');
  }

  // Verificar se não é o próprio dono da coleção
  if (collection.userId === userId) {
    throw new Error('O dono da coleção não pode ser adicionado como colaborador.');
  }

  return await prisma.collectionCollaborator.create({
    data: {
      userId,
      collectionId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
};

export const removeCollaborator = async (data: {
  collectionId: string;
  userId: string;
}) => {
  const { collectionId, userId } = data;

  const collaborator = await prisma.collectionCollaborator.findUnique({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
  });

  if (!collaborator) {
    throw new Error('Colaborador não encontrado.');
  }

  // Remover todos os mangás adicionados por este colaborador
  await prisma.collectionManga.deleteMany({
    where: {
      collectionId,
      addedBy: userId,
    },
  });

  // Remover o colaborador
  await prisma.collectionCollaborator.delete({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
  });

  return { message: 'Colaborador removido com sucesso.' };
};

export const updateCollaboratorRole = async (data: {
  collectionId: string;
  userId: string;
  role: CollaboratorRole;
}) => {
  const { collectionId, userId, role } = data;

  const collaborator = await prisma.collectionCollaborator.findUnique({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
  });

  if (!collaborator) {
    throw new Error('Colaborador não encontrado.');
  }

  return await prisma.collectionCollaborator.update({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
};

export const listCollaborators = async (collectionId: string) => {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw new Error('Coleção não encontrada.');
  }

  return await prisma.collectionCollaborator.findMany({
    where: { collectionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const checkUserPermission = async (collectionId: string, userId: string) => {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    return { hasPermission: false, isOwner: false, role: null };
  }

  // Verificar se é o dono da coleção
  if (collection.userId === userId) {
    return { hasPermission: true, isOwner: true, role: 'OWNER' };
  }

  // Verificar se é colaborador
  const collaborator = await prisma.collectionCollaborator.findUnique({
    where: {
      userId_collectionId: {
        userId,
        collectionId,
      },
    },
  });

  if (!collaborator) {
    return { hasPermission: false, isOwner: false, role: null };
  }

  return {
    hasPermission: true,
    isOwner: false,
    role: collaborator.role,
  };
};

export const checkUserCanEdit = async (collectionId: string, userId: string) => {
  const permission = await checkUserPermission(collectionId, userId);
  
  if (!permission.hasPermission) {
    throw new Error('Você não tem permissão para modificar esta coleção.');
  }

  return permission;
};

export const checkUserCanView = async (collectionId: string, userId: string) => {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
  });

  if (!collection) {
    throw new Error('Coleção não encontrada.');
  }

  // Se a coleção é pública, qualquer um pode ver
  if (collection.status === 'PUBLIC') {
    return { hasPermission: true, isOwner: false, role: 'VIEWER' };
  }

  // Verificar permissões
  const permission = await checkUserPermission(collectionId, userId);
  
  if (!permission.hasPermission) {
    throw new Error('Você não tem permissão para visualizar esta coleção.');
  }

  return permission;
};
