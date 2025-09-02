import axios from 'axios';
import prisma from "@/prisma/client";

interface ChapterListParams {
    id: string;
    lg: string;
    order: string;
    page: number;
    limit: number;
    offset: number;
}

interface ChapterListResponse {
    current_page: number;
    data: any[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

const transformChapterData = (chapters: any[], total: number, limit: number, page: number, offset: number, lg: string) => {
    const transformedChapters = chapters
        .map(chapter => {
            const attributes = chapter.attributes || {};
            const pages = attributes.pages || 0;

            if (pages === 0) return null;

            const publishDate = new Date(attributes.publishAt || new Date())
                .toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

            return {
                id: chapter.id || null,
                title: attributes.title || `Capítulo ${attributes.chapter || 0}`,
                chapter: attributes.chapter ? parseFloat(attributes.chapter) : 0,
                volume: attributes.volume ? parseFloat(attributes.volume) : null,
                language: [attributes.translatedLanguage || ''],
                publish_date: publishDate,
                pages
            };
        })
        .filter(Boolean);

    return {
        total,
        limit,
        page,
        offset,
        lg,
        chapters: transformedChapters
    };
};

export const listChapters = async ({ id, lg, order, page, limit, offset }: ChapterListParams): Promise<ChapterListResponse> => {
    const response = await axios.get(`https://api.mangadex.org/manga/${id}/feed`, {
        params: {
            includeEmptyPages: 0,
            includeFuturePublishAt: 0,
            includeExternalUrl: 0,
            limit,
            offset,
            translatedLanguage: [lg],
            contentRating: ['safe', 'suggestive', 'erotica', 'pornographic'],
            order: {
                chapter: order
            }
        }
    });

    if (response.status !== 200) {
        throw new Error('Failed to fetch chapters');
    }

    const { data, total } = response.data;
    const transformed = transformChapterData(data, total, limit, page, offset, lg);
    const chapters = transformed.chapters;

    const lastPage = Math.ceil(total / limit);
    const from = offset + 1;
    const to = Math.min(offset + limit, total);

    return {
        current_page: page,
        data: chapters,
        first_page_url: `?page=1&limit=${limit}&lang=${lg}&order=${order}`,
        from,
        last_page: lastPage,
        last_page_url: `?page=${lastPage}&limit=${limit}&lang=${lg}&order=${order}`,
        next_page_url: page < lastPage ? `?page=${page + 1}&limit=${limit}&lang=${lg}&order=${order}` : null,
        path: '',
        per_page: limit,
        prev_page_url: page > 1 ? `?page=${page - 1}&limit=${limit}&lang=${lg}&order=${order}` : null,
        to,
        total
    };
};

const transformPage = (chapterHash: string, pageData: string[], baseUrl = "https://uploads.mangadex.org") => {
    if (!chapterHash || !pageData.length) {
        throw new Error("Invalid chapter data");
    }

    return pageData.map(page => `${baseUrl}/data/${chapterHash}/${page}`);
};

export const getChapterPages = async (chapterID: string) => {
    const baseUrl = 'https://api.mangadex.org';
    const chapterResponse = await axios.get(`${baseUrl}/at-home/server/${chapterID}`);

    if (chapterResponse.status !== 200) {
        throw new Error('Failed to fetch chapter');
    }

    const chapterData = chapterResponse.data.chapter;

    if (!chapterData || !chapterData.hash || !chapterData.data) {
        throw new Error('Invalid chapter data');
    }

    const pages = transformPage(chapterData.hash, chapterData.data);

    return {
        pages,
        total: pages.length,
        chapter_id: chapterID
    };
};

// Função melhorada do MangaHandler
export const getMangaChapters = async (id: string, lg: string, order: string, page: number, limit: number) => {
    const manga = await prisma.manga.findUnique({
        where: { id },
        select: { manga_uuid: true }
    });

    if (!manga?.manga_uuid) {
        throw new Error('Mangá não encontrado ou UUID não disponível');
    }

    // Primeiro, vamos buscar o total de capítulos para validar a página
    const totalResponse = await axios.get(`https://api.mangadex.org/manga/${manga.manga_uuid}/feed?limit=1&translatedLanguage[]=${lg}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includeFutureUpdates=1`);
    
    if (totalResponse.status !== 200) {
        throw new Error('Failed to fetch chapters');
    }

    const { total } = totalResponse.data;
    const lastPage = Math.ceil(total / limit);
    
    // Validar se a página solicitada é válida
    if (page > lastPage && lastPage > 0) {
        throw new Error(`Página ${page} não existe. Total de páginas: ${lastPage}`);
    }
    
    // Se não há dados, retornar página 1
    if (total === 0) {
        return {
            current_page: 1,
            data: [],
            from: 0,
            last_page: 1,
            next: false,
            per_page: limit,
            prev: false,
            to: 0,
            total: 0
        };
    }
    
    // Ajustar página para o máximo se exceder o total
    const adjustedPage = Math.min(page, lastPage);
    const offset = (adjustedPage - 1) * limit;
    
    const apiUrl = `https://api.mangadex.org/manga/${manga.manga_uuid}/feed?limit=${limit}&offset=${offset}&translatedLanguage[]=${lg}&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&includeFutureUpdates=1&order[createdAt]=${order}&order[updatedAt]=${order}&order[publishAt]=${order}&order[readableAt]=${order}&order[volume]=${order}&order[chapter]=${order}`;

    const response = await axios.get(apiUrl, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    if (response.status !== 200) {
        throw new Error('Failed to fetch chapters');
    }

    const { data } = response.data;

    if (!data || data.length === 0) {
        return {
            current_page: adjustedPage,
            data: [],
            from: 0,
            last_page: lastPage,
            next: false,
            per_page: limit,
            prev: false,
            to: 0,
            total: 0
        };
    }

    const transformed = transformChapterDataEnhanced(data, total, limit, adjustedPage, offset, lg);
    const chapters = transformed.chapters;

    const from = offset + 1;
    const to = Math.min(offset + limit, total);

    return {
        current_page: adjustedPage,
        data: chapters,
        from,
        last_page: lastPage,
        next: adjustedPage < lastPage,
        per_page: limit,
        prev: adjustedPage > 1,
        to,
        total
    };
};

// Função melhorada para buscar páginas de capítulo
export const getChapterPagesEnhanced = async (chapterID: string, quality: string = 'high') => {
    const baseUrl = 'https://api.mangadex.org';
    const chapterResponse = await axios.get(`${baseUrl}/at-home/server/${chapterID}?forcePort443=false`, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (chapterResponse.status !== 200) {
        throw new Error('Failed to fetch chapter');
    }

    const chapterData = chapterResponse.data.chapter;
    const baseUrlImages = chapterResponse.data.baseUrl;

    if (!chapterData?.hash || (!chapterData?.data && !chapterData?.dataSaver)) {
        throw new Error('Invalid chapter data');
    }

    const imageData = quality === 'low' ? chapterData.dataSaver : chapterData.data;

    if (!imageData || imageData.length === 0) {
        throw new Error('No images found for this chapter');
    }

    const pages = imageData.map((image: string) => `${baseUrlImages}/data/${chapterData.hash}/${image}`);

    return {
        pages,
        total: pages.length,
        chapter_id: chapterID,
        base_url: baseUrlImages,
        quality,
        hash: chapterData.hash
    };
};

const transformChapterDataEnhanced = (chapters: any[], total: number, limit: number, page: number, offset: number, lg: string) => {
    const transformedChapters = chapters
        .map(chapter => {
            const attributes = chapter.attributes ?? {};
            const pages = attributes.pages ?? 0;
            const externalUrl = attributes.externalUrl ?? null;

            const publishDate = new Date(attributes.publishAt ?? new Date())
                .toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

            return {
                id: chapter.id ?? null,
                title: attributes.title ?? `Capítulo ${attributes.chapter ?? 0}`,
                chapter: attributes.chapter ? parseFloat(attributes.chapter) : 0,
                volume: attributes.volume ? parseFloat(attributes.volume) : null,
                language: [attributes.translatedLanguage ?? ''],
                publish_date: publishDate,
                pages,
                external_url: externalUrl,
                is_external: !!externalUrl
            };
        })
        .filter(Boolean);

    return {
        total,
        limit,
        page,
        offset,
        lg,
        chapters: transformedChapters
    };
};
