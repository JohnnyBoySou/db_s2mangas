import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { getPaginationParams } from '@/utils/pagination';
import { Request } from 'express';
import axios from 'axios';

const prisma = new PrismaClient();

const wallpaperSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    cover: z.string().url('URL da capa inválida'),
    images: z.array(z.object({
        url: z.string().url('URL da imagem inválida')
    })).min(1, 'Pelo menos uma imagem é necessária')
});

const updateWallpaperSchema = wallpaperSchema.partial();

export const getWallpapers = async (req: Request) => {
    try {
        const { skip, take, page } = getPaginationParams(req);
        
        const [wallpapers, total] = await Promise.all([
            prisma.wallpaper.findMany({
                skip,
                take,
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    _count: {
                        select: {
                            images: true
                        }
                    }
                }
            }),
            prisma.wallpaper.count()
        ]);
        
        const totalPages = Math.ceil(total / take);
        
        return {
            data: wallpapers.map(wallpaper => ({
                ...wallpaper,
                totalImages: wallpaper._count.images
            })),
            pagination: {
                total,
                page,
                limit: take,
                totalPages,
                next: page < totalPages,
                prev: page > 1
            }
        };
    } catch (error) {
        console.error("Erro em getWallpapers:", error);
        throw error;
    }
};

export const getWallpaperById = async (id: string, req: Request) => {
    const { skip, take, page } = getPaginationParams(req);
    
    const wallpaper = await prisma.wallpaper.findUnique({
        where: { id },
        include: {
            images: {
                skip,
                take
            },
            _count: {
                select: {
                    images: true
                }
            }
        }
    });

    if (!wallpaper) {
        throw new Error('Wallpaper não encontrado');
    }

    const totalPages = Math.ceil(wallpaper._count.images / take);

    return {
        data: {
            ...wallpaper,
            totalImages: wallpaper._count.images
        },
        pagination: {
            total: wallpaper._count.images,
            page,
            limit: take,
            totalPages,
            next: page < totalPages,
            prev: page > 1
        }
    };
};

export const createWallpaper = async (data: z.infer<typeof wallpaperSchema>) => {
    return prisma.wallpaper.create({
        data: {
            name: data.name,
            cover: data.cover,
            images: {
                create: data.images.map(image => ({
                    url: image.url
                }))
            }
        },
        include: {
            images: true
        }
    });
};

export const updateWallpaper = async (id: string, data: z.infer<typeof updateWallpaperSchema>) => {
    return prisma.wallpaper.update({
        where: { id },
        data: {
            name: data.name,
            cover: data.cover,
            ...(data.images && {
                images: {
                    deleteMany: {},
                    create: data.images.map(image => ({
                        url: image.url
                    }))
                }
            })
        },
        include: {
            images: true
        }
    });
};

export const deleteWallpaper = async (id: string) => {
    const existing = await prisma.wallpaper.findUnique({ where: { id } });
    
    if (!existing) {
        throw new Error("Wallpaper não encontrado");
    }

    // Primeiro deleta todas as imagens associadas
    await prisma.wallpaperImage.deleteMany({
        where: { wallpaperId: id }
    });

    // Depois deleta o wallpaper
    await prisma.wallpaper.delete({ where: { id } });
    return { message: "Wallpaper deletado com sucesso" };
};

export const importFromJson = async () => {
    try {
        // Define o caminho do arquivo no servidor
        const filePath = path.join(process.cwd(), 'src', 'import', 'wallpapers.json');
        console.log('Caminho do arquivo:', filePath);
        
        // Lê o arquivo JSON
        console.log('Tentando ler o arquivo...');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        console.log('Arquivo lido com sucesso');
        
        const wallpapersData = JSON.parse(fileContent);
        console.log('JSON parseado com sucesso');
        console.log('Quantidade de wallpapers encontrados:', wallpapersData.length);
        
        // Processa cada wallpaper
        for (const wallpaper of wallpapersData) {
            console.log('Processando wallpaper:', wallpaper.name);
            
            try {
                // Remove aspas extras e escapa caracteres corretamente
                const cleanData = wallpaper.data.replace(/^"|"$/g, '').replace(/\\/g, '');
                const imagesData = JSON.parse(cleanData);
                console.log('Quantidade de imagens:', imagesData.length);
                
                // Cria o wallpaper com suas imagens
                await prisma.wallpaper.create({
                    data: {
                        name: wallpaper.name,
                        cover: wallpaper.capa,
                        images: {
                            create: imagesData.map((img: any) => ({
                                url: img.img
                            }))
                        }
                    }
                });
                console.log('Wallpaper criado com sucesso:', wallpaper.name);
            } catch (wallpaperError) {
                console.error('Erro ao processar wallpaper:', wallpaper.name, wallpaperError);
                throw wallpaperError;
            }
        }

        return { success: true, message: 'Importação concluída com sucesso' };
    } catch (error: any) {
        console.error('Erro detalhado na importação:', error);
        throw new Error(`Erro ao importar dados do JSON: ${error.message}`);
    }
};

export const toggleWallpaperImage = async (wallpaperId: string, imageUrl: string) => {
    // Verifica se o wallpaper existe
    const wallpaper = await prisma.wallpaper.findUnique({
        where: { id: wallpaperId },
        include: {
            images: true
        }
    });

    if (!wallpaper) {
        throw new Error('Wallpaper não encontrado');
    }

    // Verifica se a imagem já existe
    const existingImage = wallpaper.images.find(img => img.url === imageUrl);

    if (existingImage) {
        // Se a imagem existe, remove ela
        await prisma.wallpaperImage.delete({
            where: { id: existingImage.id }
        });
        return { action: 'removed', message: 'Imagem removida com sucesso' };
    } else {
        // Se a imagem não existe, adiciona ela
        await prisma.wallpaperImage.create({
            data: {
                url: imageUrl,
                wallpaperId
            }
        });
        return { action: 'added', message: 'Imagem adicionada com sucesso' };
    }
};

export const importFromPinterest = async (pinterestUrl: string) => {
    try {
        // Extrai o username e o nome do board da URL
        const urlParts = pinterestUrl.split('/');
        const username = urlParts[3];
        const boardName = urlParts[4];

        // Constrói a URL da API do Pinterest
        const apiUrl = `https://api.pinterest.com/v3/pidgets/boards/${username}/${boardName}/pins/`;

        // Faz a requisição para a API
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Verifica se temos dados válidos
        if (!data?.data?.pins) {
            throw new Error('Formato de resposta inválido da API do Pinterest');
        }

        // Extrai as URLs das imagens dos pins
        const pins = data.data.pins;
        const imageUrls = pins.map((pin: any) => {
            if (!pin.images) return null;

            // Pega a maior imagem disponível
            const sizes = ['564x', '237x', '236x'];
            for (const size of sizes) {
                if (pin.images[size]?.url) {
                    return pin.images[size].url;
                }
            }
            return null;
        }).filter(Boolean);

        if (imageUrls.length === 0) {
            throw new Error('Nenhuma imagem encontrada no board');
        }

        // Cria um novo wallpaper com as imagens encontradas
        const wallpaper = await prisma.wallpaper.create({
            data: {
                name: `Importado do Pinterest - ${boardName}`,
                cover: imageUrls[0], // Usa a primeira imagem como capa
                images: {
                    create: imageUrls.map((url: string) => ({
                        url: url
                    }))
                }
            },
            include: {
                images: true
            }
        });

        return {
            success: true,
            message: `Wallpaper criado com sucesso com ${imageUrls.length} imagens`,
            wallpaper
        };
    } catch (error: any) {
        console.error('Erro ao importar do Pinterest:', error);
        throw new Error(`Erro ao importar do Pinterest: ${error.message}`);
    }
};

