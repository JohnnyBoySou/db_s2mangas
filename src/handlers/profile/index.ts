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
  // Buscar dados do usuário base
  const baseUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      categories: {
        select: { id: true }
      },
      languages: {
        select: { id: true }
      },
      libraryEntries: {
        select: {
          manga: {
            select: {
              categories: {
                select: { id: true }
              }
            }
          }
        },
        take: 100 // Limitar para performance
      },
      following: {
        select: { targetId: true }
      }
    }
  });

  if (!baseUser) {
    throw new Error('Usuário não encontrado');
  }

  // Extrair IDs das categorias e idiomas preferidos
  const preferredCategoryIds = baseUser.categories.map(c => c.id);
  const preferredLanguageIds = baseUser.languages.map(l => l.id);
  
  // Extrair categorias dos mangás lidos
  const readMangaCategoryIds = new Set<string>();
  baseUser.libraryEntries.forEach(entry => {
    entry.manga.categories.forEach(category => {
      readMangaCategoryIds.add(category.id);
    });
  });

  // IDs dos usuários que o usuário base já segue (para excluir das sugestões)
  const followingIds = baseUser.following.map(f => f.targetId);
  followingIds.push(userId); // Excluir o próprio usuário

  // Buscar usuários similares baseado em:
  // 1. Categorias preferidas em comum
  // 2. Idiomas em comum
  // 3. Categorias de mangás lidos em comum
  const similarUsers = await prisma.user.findMany({
    where: {
      AND: [
        {
          id: {
            notIn: followingIds
          }
        },
        {
          OR: [
            // Usuários com categorias preferidas similares
            {
              categories: {
                some: {
                  id: {
                    in: preferredCategoryIds
                  }
                }
              }
            },
            // Usuários com idiomas similares
            {
              languages: {
                some: {
                  id: {
                    in: preferredLanguageIds
                  }
                }
              }
            },
            // Usuários que leram mangás de categorias similares
            {
              libraryEntries: {
                some: {
                  manga: {
                    categories: {
                      some: {
                        id: {
                          in: Array.from(readMangaCategoryIds)
                        }
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      bio: true,
      createdAt: true,
      categories: {
        select: { id: true }
      },
      languages: {
        select: { id: true }
      },
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
    take: limit * 2 // Buscar mais para poder calcular similaridade e filtrar
  });

  // Calcular score de similaridade para cada usuário
  const usersWithSimilarity = similarUsers.map(user => {
    let similarityScore = 0;
    
    // Pontos por categorias em comum
    const commonCategories = user.categories.filter(c => 
      preferredCategoryIds.includes(c.id)
    ).length;
    similarityScore += commonCategories * 3;
    
    // Pontos por idiomas em comum
    const commonLanguages = user.languages.filter(l => 
      preferredLanguageIds.includes(l.id)
    ).length;
    similarityScore += commonLanguages * 2;
    
    // Pontos por popularidade (seguidores)
    similarityScore += Math.min(user._count.followers / 10, 5);
    
    // Pontos por atividade (entradas na biblioteca)
    similarityScore += Math.min(user._count.libraryEntries / 20, 3);

    return {
      ...user,
      similarityScore
    };
  });

  // Ordenar por score de similaridade e pegar os melhores
  const topSimilarUsers = usersWithSimilarity
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  // Se há usuário autenticado, verificar relacionamentos
  let profilesWithRelationships = topSimilarUsers;
  if (authenticatedUserId) {
    const profileIds = topSimilarUsers.map(p => p.id);
    
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

    profilesWithRelationships = topSimilarUsers.map(profile => {
      const { similarityScore, categories, languages, ...profileData } = profile;
      return {
        ...profileData,
        _count: {
          ...profile._count,
          likes: profile._count.profileLikedBy
        },
        isFollowing: followingIds.has(profile.id),
        isLiked: likedIds.has(profile.id),
        similarityScore
      };
    });
  } else {
    profilesWithRelationships = topSimilarUsers.map(profile => {
      const { similarityScore, categories, languages, ...profileData } = profile;
      return {
        ...profileData,
        _count: {
          ...profile._count,
          likes: profile._count.profileLikedBy
        },
        isFollowing: false,
        isLiked: false,
        similarityScore
      };
    });
  }

  return profilesWithRelationships;
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