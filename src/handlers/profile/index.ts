import prisma from '@/prisma/client';

export const getProfileData = async (username: string, authenticatedUserId: string) => {

  const profile = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      bio: true,
      cover: true,
      createdAt: true,
      collections: {
        where: {
          status: 'PUBLIC'
        },
        select: {
          id: true,
          name: true,
          cover: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              likes: true,
              mangas: true
            }
          }
        }
      },
      _count: {
        select: {
          libraryEntries: true,
          profileLikedBy: true,
          comments: true,
          followers: true,
          following: true
        }
      }
    }
  });

  if (!profile) {
    throw new Error('Perfil não encontrado');
  }

  // Verifica se o usuário autenticado está seguindo o perfil
  const isFollowing = await prisma.profileFollow.findUnique({
    where: {
      userId_targetId: {
        userId: authenticatedUserId,
        targetId: profile.id
      }
    }
  }) !== null;

  // Verifica se o usuário autenticado curtiu o perfil
  const isLiked = await prisma.profileLike.findUnique({
    where: {
      userId_targetId: {
        userId: authenticatedUserId,
        targetId: profile.id
      }
    }
  }) !== null;

  // Renomeia profileLikedBy para likes para manter consistência na API
  const { profileLikedBy, ...restCount } = profile._count;

  return {
    ...profile,
    _count: {
      ...restCount,
      likes: profileLikedBy
    },
    isFollowing,
    isLiked
  };
};

export const likeProfile = async (userId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername }
  });

  if (!target) {
    throw new Error('Perfil não encontrado');
  }

  if (userId === target.id) {
    throw new Error('Não é possível curtir seu próprio perfil');
  }

  const existingLike = await prisma.profileLike.findUnique({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });

  if (existingLike) {
    throw new Error('Você já curtiu este perfil');
  }

  return prisma.profileLike.create({
    data: {
      userId,
      targetId: target.id
    }
  });
};

export const unlikeProfile = async (userId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername }
  });

  if (!target) {
    throw new Error('Perfil não encontrado');
  }

  const like = await prisma.profileLike.findUnique({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });

  if (!like) {
    throw new Error('Você ainda não curtiu este perfil');
  }

  return prisma.profileLike.delete({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });
};

export const followProfile = async (userId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername }
  });

  if (!target) {
    throw new Error('Perfil não encontrado');
  }

  if (userId === target.id) {
    throw new Error('Não é possível seguir seu próprio perfil');
  }

  const existingFollow = await prisma.profileFollow.findUnique({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });

  if (existingFollow) {
    throw new Error('Você já segue este perfil');
  }

  return prisma.profileFollow.create({
    data: {
      userId,
      targetId: target.id
    }
  });
};

export const unfollowProfile = async (userId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername }
  });

  if (!target) {
    throw new Error('Perfil não encontrado');
  }

  const follow = await prisma.profileFollow.findUnique({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });

  if (!follow) {
    throw new Error('Você ainda não segue este perfil');
  }

  return prisma.profileFollow.delete({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });
};

export const toggleFollowProfile = async (userId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername }
  });

  if (!target) {
    throw new Error('Perfil não encontrado');
  }

  if (userId === target.id) {
    throw new Error('Não é possível seguir seu próprio perfil');
  }

  const existingFollow = await prisma.profileFollow.findUnique({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });

  if (existingFollow) {
    // Se já segue, remove o follow
    await prisma.profileFollow.delete({
      where: {
        userId_targetId: {
          userId,
          targetId: target.id
        }
      }
    });
    return { followed: false };
  } else {
    // Se não segue, adiciona o follow
    await prisma.profileFollow.create({
      data: {
        userId,
        targetId: target.id
      }
    });
    return { followed: true };
  }
};

export const toggleLikeProfile = async (userId: string, targetUsername: string) => {
  const target = await prisma.user.findUnique({
    where: { username: targetUsername }
  });

  if (!target) {
    throw new Error('Perfil não encontrado');
  }

  if (userId === target.id) {
    throw new Error('Não é possível curtir seu próprio perfil');
  }

  const existingLike = await prisma.profileLike.findUnique({
    where: {
      userId_targetId: {
        userId,
        targetId: target.id
      }
    }
  });

  if (existingLike) {
    // Se já curtiu, remove o like
    await prisma.profileLike.delete({
      where: {
        userId_targetId: {
          userId,
          targetId: target.id
        }
      }
    });
    return { liked: false };
  } else {
    // Se não curtiu, adiciona o like
    await prisma.profileLike.create({
      data: {
        userId,
        targetId: target.id
      }
    });
    return { liked: true };
  }
}; 