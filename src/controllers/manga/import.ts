import type { RequestHandler } from "express";
import prisma from "@/prisma/client";
import { createMangaSchema } from "@/schemas/mangaSchemas";
import { handleZodError } from "@/utils/zodError";
import { z } from "zod";
import axios from "axios";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text) return '';

    if (targetLang === 'en') return text; // não traduz inglês pra inglês

    try {
        const res = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
            {
                q: text,
                target: targetLang,
                format: 'text',
                source: 'en',
            }
        );

        const translated = res.data?.data?.translations?.[0]?.translatedText;
        return translated ?? '';
    } catch (error) {
        console.error('Erro na tradução:', error);
        return '';
    }
}



interface Translation {
    language: string;
    name: string;
    description?: string;
}

function uniqueTranslations(translations: Translation[]) {
    const seen = new Set<string>();
    return translations.filter(t => {
        if (seen.has(t.language)) return false;
        seen.add(t.language);
        return true;
    });
}

async function findOrCreate(
    table: 'language' | 'category',
    codes: string[]
): Promise<{ id: string }[]> {
    let existing: { id: string; code?: string; name?: string }[] = [];

    if (table === 'language') {
        // Languages são buscadas pelo code
        existing = await prisma.language.findMany({
            where: { code: { in: codes } },
            select: { id: true, code: true },
        });
    } else {
        // Categories são buscadas pelo name
        existing = await prisma.category.findMany({
            where: { name: { in: codes } },
            select: { id: true, name: true },
        });
    }

    // Códigos existentes para comparar
    const existingCodes = table === 'language'
        ? existing.map(e => e.code!)
        : existing.map(e => e.name!);

    // Filtra os que faltam criar
    const missingCodes = codes.filter(code => !existingCodes.includes(code));

    if (missingCodes.length > 0) {
        const createPromises = missingCodes.map(code => {
            if (table === 'language') {
                return prisma.language.create({
                    data: { code, name: code },
                });
            } else {
                return prisma.category.create({
                    data: { name: code },
                });
            }
        });
        await Promise.all(createPromises);
    }

    // Retorna todos existentes (criados ou não)
    if (table === 'language') {
        return prisma.language.findMany({
            where: { code: { in: codes } },
            select: { id: true },
        });
    } else {
        return prisma.category.findMany({
            where: { name: { in: codes } },
            select: { id: true },
        });
    }
}

export function transformExternalManga(data: any): z.infer<typeof createMangaSchema> {
    const attributes = data.attributes;
    console.log(data)

    const translations = [
        {
            language: 'en',
            name: attributes.title?.en ?? '',
            description: attributes.description?.en ?? '',
        },
        ...(attributes.altTitles ?? []).map((alt: any) => {
            const lang = Object.keys(alt)[0];
            return {
                language: lang,
                name: alt[lang],
                description: attributes.description?.[lang] ?? '',
            };
        }),
    ];
    const coverArt = data.relationships.find((r: any) => r.type === 'cover_art');

    const coverUrl = coverArt?.attributes?.fileName
        ? `https://uploads.mangadex.org/covers/${data.id}/${coverArt.attributes.fileName}`
        : "";


    return {
        cover: coverUrl,
        status: attributes.status ?? null,
        type: data.type ?? null,
        releaseDate: attributes.year ? new Date(`${attributes.year}-01-01`) : undefined,
        languageIds: [attributes.originalLanguage, ...(attributes.availableTranslatedLanguages ?? [])],
        categoryIds: attributes.tags.map((t: any) => t.attributes.name.en),
        translations,
    };
}

export async function createMangaEntry(data: z.infer<typeof createMangaSchema>) {
    // Cria o mangá inicialmente
    const manga = await prisma.manga.create({
        data: {
            cover: data.cover,
            status: data.status,
            type: data.type,
            releaseDate: data.releaseDate,
            languages: {
                connect: data.languageIds.map(id => ({ id })),
            },
            categories: {
                connect: data.categoryIds?.map(id => ({ id })) ?? [],
            },
            translations: {
                create: uniqueTranslations(data.translations).map(t => ({
                    language: t.language,
                    name: t.name,
                    description: t.description ?? '',
                })),
            },
        },
        include: {
            categories: true,
            translations: true,
            languages: true,
        },
    });

    // Pega a tradução base em inglês
    const baseTranslation = manga.translations.find(t => t.language === 'en');
    if (!baseTranslation?.description) {
        return manga;
    }

    // Para cada idioma ligado ao mangá, menos inglês, traduz descrição se vazia
    for (const lang of manga.languages) {
        if (lang.code === 'en') continue;

        const translation = manga.translations.find(t => t.language === lang.code);

        if (!translation?.description) {
            // Traduz a descrição da base para o idioma atual
            const translatedDescription = await translateText(baseTranslation.description, lang.code);

            if (translation) {
                // Atualiza tradução existente com a descrição traduzida
                await prisma.mangaTranslation.update({
                    where: { id: translation.id },
                    data: { description: translatedDescription },
                });
            } else {
                // Cria nova tradução
                await prisma.mangaTranslation.create({
                    data: {
                        mangaId: manga.id,
                        language: lang.code,
                        name: baseTranslation.name,
                        description: translatedDescription,
                    },
                });
            }
        }
    }

    // Retorna o mangá atualizado com todas as traduções
    return prisma.manga.findUnique({
        where: { id: manga.id },
        include: {
            categories: true,
            translations: true,
            languages: true,
        },
    });
}

export const createManga: RequestHandler = async (req, res) => {
    try {
        const data = createMangaSchema.parse(req.body);

        // Garantir que languages e categories existam
        const ensuredLanguages = await findOrCreate('language', data.languageIds);
        const ensuredCategories = await findOrCreate('category', data.categoryIds ?? []);

        // Atualizar os arrays com os IDs existentes/criados
        data.languageIds = ensuredLanguages.map(({ id }) => id);
        data.categoryIds = ensuredCategories.map(({ id }) => id);

        const manga = await createMangaEntry(data);

        res.status(201).json(manga);
    } catch (error) {
        console.error(error);
        handleZodError(error, res);
    }
};

export const importFromExternalApi: RequestHandler = async (req, res) => {
    const filters = req.body;
  
    const baseUrl = 'https://api.mangadex.org/manga';
  
    try {
      const url = new URL(baseUrl);
  
      // Adiciona todos os filtros passados no body à URL
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
  
      // Garante que 'cover_art' está incluso
      const includes = url.searchParams.getAll('includes[]');
      if (!includes.includes('cover_art')) {
        url.searchParams.append('includes[]', 'cover_art');
      }
  
      const response = await axios.get(url.toString());
      const externalData = response.data?.data ?? [];
  
      const results = [];
  
      for (const item of externalData) {
        try {
          const transformed = transformExternalManga(item);
  
          // Garantir que languageIds e categoryIds são arrays (mesmo que vazios)
          const languageIds = Array.isArray(transformed.languageIds) ? transformed.languageIds : [];
          const categoryIds = Array.isArray(transformed.categoryIds) ? transformed.categoryIds : [];
  
          const [languages, categories] = await Promise.all([
            findOrCreate('language', languageIds),
            findOrCreate('category', categoryIds),
          ]);
  
          transformed.languageIds = languages.map(l => l.id);
          transformed.categoryIds = categories.map(c => c.id);
  
          const manga = await createMangaEntry(transformed);
          results.push(manga);
        } catch (err) {
          console.error(`Erro ao importar mangá: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
          results.push({ error: 'Falha na importação', details: err instanceof Error ? err.message : 'Erro desconhecido' });
        }
      }
  
      res.json({ message: 'Importação concluída', results });
    } catch (error) {
      console.error('Erro na importação:', error instanceof Error ? error.message : JSON.stringify(error));
      res.status(500).json({ error: 'Erro ao importar mangás', details: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  };
  