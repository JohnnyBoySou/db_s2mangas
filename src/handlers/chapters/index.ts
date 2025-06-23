import axios from 'axios';

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
