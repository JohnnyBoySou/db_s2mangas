import prisma from '@/prisma/client';
import { createFollowNotification } from '@/handlers/notifications';

interface SearchProfilesParams {
  query: string;
  page?: number;
  limit?: number;
  authenticatedUserId?: string;
}

interface SimilarProfilesParams {
  userId: string;
  authenticatedUserId?: string;
  limit?: number;
}

interface FollowersParams {
  userId: string;
  page?: number;
  limit?: number;
  authenticatedUserId?: string;
}

interface FollowingParams {
  userId: string;
  page?: number;
  limit?: number;
  authenticatedUserId?: string;
}

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

  // Buscar dados do usuário que está seguindo para a notificação
  const follower = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true }
  });

  const follow = await prisma.profileFollow.create({
    data: {
      userId,
      targetId: target.id
    }
  });

  // Criar notificação para o usuário que foi seguido
  if (follower) {
    try {
      await createFollowNotification(userId, target.id, follower.name || follower.username);
    } catch (error) {
      console.error('Erro ao criar notificação de follow:', error);
      // Não falha a operação de follow se a notificação falhar
    }
  }

  return follow;
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
    // Buscar dados do usuário que está seguindo para a notificação
    const follower = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, username: true }
    });

    await prisma.profileFollow.create({
      data: {
        userId,
        targetId: target.id
      }
    });

    // Criar notificação para o usuário que foi seguido
    if (follower) {
      try {
        await createFollowNotification(userId, target.id, follower.name || follower.username);
      } catch (error) {
        console.error('Erro ao criar notificação de follow:', error);
        // Não falha a operação de follow se a notificação falhar
      }
    }

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

export const searchProfiles = async ({
  query,
  page = 1,
  limit = 10,
  authenticatedUserId
}: SearchProfilesParams) => {
  const skip = (page - 1) * limit;
  const searchTerms = query.toLowerCase().trim().split(' ').filter(term => term.length > 0);

  if (searchTerms.length === 0) {
    return {
      profiles: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    };
  }

  // Construir condições de busca
  const searchConditions = {
    OR: [
      // Busca por username (exato e parcial)
      {
        username: {
          contains: query,
          mode: 'insensitive' as const
        }
      },
      // Busca por nome (exato e parcial)
      {
        name: {
          contains: query,
          mode: 'insensitive' as const
        }
      },
      // Busca por termos individuais no username
      ...searchTerms.map(term => ({
        username: {
          contains: term,
          mode: 'insensitive' as const
        }
      })),
      // Busca por termos individuais no nome
      ...searchTerms.map(term => ({
        name: {
          contains: term,
          mode: 'insensitive' as const
        }
      }))
    ]
  };

  const [profiles, total] = await Promise.all([
    prisma.user.findMany({
      where: searchConditions,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            profileLikedBy: true,
            followers: true,
            following: true,
            libraryEntries: true,
            collections: {
              where: {
                status: 'PUBLIC'
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: [
         // Por popularidade (número de seguidores)
         {
           followers: {
             _count: 'desc'
           }
         },
         // Por atividade (entradas na biblioteca)
         {
           libraryEntries: {
             _count: 'desc'
           }
         },
         // Por data de criação (mais recentes primeiro)
         {
           createdAt: 'desc'
         }
       ]
    }),
    prisma.user.count({
      where: searchConditions
    })
  ]);

  // Se há usuário autenticado, verificar relacionamentos
  let profilesWithRelationships = profiles;
  if (authenticatedUserId) {
    const profileIds = profiles.map(p => p.id);
    
    const [followings, likes] = await Promise.all([
      prisma.profileFollow.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: profileIds }
        },
        select: { targetId: true }
      }),
      prisma.profileLike.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: profileIds }
        },
        select: { targetId: true }
      })
    ]);

    const followingIds = new Set(followings.map(f => f.targetId));
    const likedIds = new Set(likes.map(l => l.targetId));

    profilesWithRelationships = profiles.map(profile => ({
      ...profile,
      _count: {
        ...profile._count,
        likes: profile._count.profileLikedBy
      },
      isFollowing: followingIds.has(profile.id),
      isLiked: likedIds.has(profile.id)
    }));
  } else {
    profilesWithRelationships = profiles.map(profile => ({
      ...profile,
      _count: {
        ...profile._count,
        likes: profile._count.profileLikedBy
      },
      isFollowing: false,
      isLiked: false
    }));
  }

  const totalPages = Math.ceil(total / limit);

  return {
    profiles: profilesWithRelationships,
    total,
    page,
    limit,
    totalPages
  };
};

export const getSimilarProfiles = async ({
  userId,
  authenticatedUserId,
  limit = 10
}: SimilarProfilesParams) => {
  // Buscar usuários que o usuário base já segue (para excluir)
  const following = await prisma.profileFollow.findMany({
    where: { userId },
    select: { targetId: true }
  });
  
  const excludeIds = [userId, ...following.map(f => f.targetId)];

  // Buscar usuários similares de forma mais simples
  const similarUsers = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      // Apenas usuários ativos (com pelo menos uma entrada na biblioteca)
      libraryEntries: {
        some: {}
      }
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          profileLikedBy: true,
          followers: true,
          following: true,
          libraryEntries: true
        }
      }
    },
    // Ordenar por popularidade e atividade
    orderBy: [
      { followers: { _count: 'desc' } },
      { libraryEntries: { _count: 'desc' } },
      { createdAt: 'desc' }
    ],
    take: limit
  });

  // Se há usuário autenticado, verificar relacionamentos
  if (authenticatedUserId) {
    const profileIds = similarUsers.map(p => p.id);
    
    const [followings, likes] = await Promise.all([
      prisma.profileFollow.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: profileIds }
        },
        select: { targetId: true }
      }),
      prisma.profileLike.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: profileIds }
        },
        select: { targetId: true }
      })
    ]);

    const followingSet = new Set(followings.map(f => f.targetId));
    const likedSet = new Set(likes.map(l => l.targetId));

    return similarUsers.map(profile => ({
      ...profile,
      _count: {
        ...profile._count,
        likes: profile._count.profileLikedBy
      },
      isFollowing: followingSet.has(profile.id),
      isLiked: likedSet.has(profile.id)
    }));
  }

  return similarUsers.map(profile => ({
    ...profile,
    _count: {
      ...profile._count,
      likes: profile._count.profileLikedBy
    },
    isFollowing: false,
    isLiked: false
  }));
};

export const listProfiles = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [profiles, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            profileLikedBy: true,
            followers: true,
            following: true,
            libraryEntries: true,
            collections: {
              where: {
                status: 'PUBLIC'
              }
            }
          }
        }
      },
      orderBy: [
        {
          followers: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ]
    }),
    prisma.user.count()
  ]);

  // Transformar profileLikedBy para likes para consistência
  const profilesWithLikes = profiles.map(profile => ({
    ...profile,
    _count: {
      ...profile._count,
      likes: profile._count.profileLikedBy
    }
  }));

  return {
    profiles: profilesWithLikes,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
};

export const getFollowers = async ({
  userId,
  page = 1,
  limit = 10,
  authenticatedUserId
}: FollowersParams) => {
  const skip = (page - 1) * limit;

  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const [followers, total] = await Promise.all([
    prisma.profileFollow.findMany({
      where: { targetId: userId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
            createdAt: true,
            _count: {
              select: {
                profileLikedBy: true,
                followers: true,
                following: true,
                libraryEntries: true
              }
            }
          }
        },
        createdAt: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.profileFollow.count({
      where: { targetId: userId }
    })
  ]);

  const followerProfiles = followers.map(f => f.user);

  // Se há usuário autenticado, verificar relacionamentos
  let followersWithRelationships = followerProfiles;
  if (authenticatedUserId) {
    const followerIds = followerProfiles.map(p => p.id);
    
    const [followings, likes] = await Promise.all([
      prisma.profileFollow.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: followerIds }
        },
        select: { targetId: true }
      }),
      prisma.profileLike.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: followerIds }
        },
        select: { targetId: true }
      })
    ]);

    const followingSet = new Set(followings.map(f => f.targetId));
    const likedSet = new Set(likes.map(l => l.targetId));

    followersWithRelationships = followerProfiles.map(profile => ({
      ...profile,
      _count: {
        ...profile._count,
        likes: profile._count.profileLikedBy
      },
      isFollowing: followingSet.has(profile.id),
      isLiked: likedSet.has(profile.id)
    }));
  } else {
    followersWithRelationships = followerProfiles.map(profile => ({
      ...profile,
      _count: {
        ...profile._count,
        likes: profile._count.profileLikedBy
      },
      isFollowing: false,
      isLiked: false
    }));
  }

  return {
    followers: followersWithRelationships,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
};

export const getFollowing = async ({
  userId,
  page = 1,
  limit = 10,
  authenticatedUserId
}: FollowingParams) => {
  const skip = (page - 1) * limit;

  // Verificar se o usuário existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const [following, total] = await Promise.all([
    prisma.profileFollow.findMany({
      where: { userId },
      select: {
        target: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
            createdAt: true,
            _count: {
              select: {
                profileLikedBy: true,
                followers: true,
                following: true,
                libraryEntries: true
              }
            }
          }
        },
        createdAt: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.profileFollow.count({
      where: { userId }
    })
  ]);

  const followingProfiles = following.map(f => f.target);

  // Se há usuário autenticado, verificar relacionamentos
  let followingWithRelationships = followingProfiles;
  if (authenticatedUserId) {
    const followingIds = followingProfiles.map(p => p.id);
    
    const [userFollowings, likes] = await Promise.all([
      prisma.profileFollow.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: followingIds }
        },
        select: { targetId: true }
      }),
      prisma.profileLike.findMany({
        where: {
          userId: authenticatedUserId,
          targetId: { in: followingIds }
        },
        select: { targetId: true }
      })
    ]);

    const userFollowingSet = new Set(userFollowings.map(f => f.targetId));
    const likedSet = new Set(likes.map(l => l.targetId));

    followingWithRelationships = followingProfiles.map(profile => ({
      ...profile,
      _count: {
        ...profile._count,
        likes: profile._count.profileLikedBy
      },
      isFollowing: userFollowingSet.has(profile.id),
      isLiked: likedSet.has(profile.id)
    }));
  } else {
    followingWithRelationships = followingProfiles.map(profile => ({
      ...profile,
      _count: {
        ...profile._count,
        likes: profile._count.profileLikedBy
      },
      isFollowing: false,
      isLiked: false
    }));
  }

  return {
    following: followingWithRelationships,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page
  };
};