import type { RequestHandler } from "express";
import axios from 'axios';

export const list: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const lg = req.query.lang as string || 'pt-br';
    const order = req.query.order as string || 'desc';
    const page = Math.max(1, parseInt(req.query.page as string || '1'));
    const limit = parseInt(req.query.limit as string || '20');
    const offset = (page - 1) * limit;
    const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;

    try {
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
            res.status(500).json({ error: 'Failed to fetch chapters' });
            return;
        }

        const { data, total } = response.data;
        const transformed = transformChapterData(data, total, limit, page, offset, lg);
        const chapters = transformed.chapters;

        const lastPage = Math.ceil(total / limit);
        const from = offset + 1;
        const to = Math.min(offset + limit, total);

        res.json({
            current_page: page,
            data: chapters,
            first_page_url: `${baseUrl}?page=1&limit=${limit}&lang=${lg}&order=${order}`,
            from,
            last_page: lastPage,
            last_page_url: `${baseUrl}?page=${lastPage}&limit=${limit}&lang=${lg}&order=${order}`,
            next_page_url: page < lastPage ? `${baseUrl}?page=${page + 1}&limit=${limit}&lang=${lg}&order=${order}` : null,
            path: baseUrl,
            per_page: limit,
            prev_page_url: page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}&lang=${lg}&order=${order}` : null,
            to,
            total
        });
    } catch (error) {
        console.error('Erro ao buscar capítulos:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
};

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

export const getPages: RequestHandler = async (req, res) => {
    const { chapterID } = req.params;
    const mangaID = req.query.manga_id as string;

    try {
        const baseUrl = 'https://api.mangadex.org';
        const chapterResponse = await axios.get(`${baseUrl}/at-home/server/${chapterID}`);

        if (chapterResponse.status !== 200) {
            res.status(500).json({ error: 'Failed to fetch chapter' });
            return;
        }

        const chapterData = chapterResponse.data.chapter;

        if (!chapterData || !chapterData.hash || !chapterData.data) {
            res.status(500).json({ error: 'Invalid chapter data' });
            return;
        }

        const pages = transformPage(chapterData.hash, chapterData.data);

        res.json({
            pages,
            total: pages.length,
            chapter_id: chapterID
        });
    } catch (error) {
        console.error('Erro ao buscar páginas:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
};

const transformPage = (chapterHash: string, pageData: string[], baseUrl = "https://uploads.mangadex.org") => {
    if (!chapterHash || !pageData.length) {
        throw new Error("Invalid chapter data");
    }

    return pageData.map(page => `${baseUrl}/data/${chapterHash}/${page}`);
}; 