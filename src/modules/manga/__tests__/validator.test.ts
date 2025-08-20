import { ZodError } from 'zod';
import {
    createMangaSchema,
    updateMangaSchema,
    patchMangaSchema,
    CreateMangaInput,
    PatchMangaInput
} from '../validators/MangaValidator';

describe('Manga Validators', () => {
    describe('createMangaSchema', () => {
        const validCreateData = {
            cover: 'https://example.com/cover.jpg',
            status: 'ongoing',
            type: 'manga',
            releaseDate: new Date('2023-01-01'),
            manga_uuid: 'uuid-123',
            languageIds: ['lang-123', 'lang-456'],
            categoryIds: ['cat-123'],
            translations: [
                {
                    language: 'pt',
                    name: 'Manga Teste',
                    description: 'Descrição do manga'
                },
                {
                    language: 'en',
                    name: 'Test Manga'
                }
            ]
        };

        it('deve validar dados corretos', () => {
            const result = createMangaSchema.parse(validCreateData);
            expect(result).toEqual(validCreateData);
        });

        it('deve aceitar dados mínimos obrigatórios', () => {
            const minimalData = {
                cover: 'https://example.com/cover.jpg',
                languageIds: ['lang-123'],
                translations: [
                    {
                        language: 'pt',
                        name: 'Manga Teste'
                    }
                ]
            };

            const result = createMangaSchema.parse(minimalData);
            expect(result.cover).toBe(minimalData.cover);
            expect(result.languageIds).toEqual(minimalData.languageIds);
            expect(result.translations).toEqual(minimalData.translations);
        });

        it('deve falhar sem cover obrigatório', () => {
            const dataWithoutCover = {
                ...validCreateData,
                cover: undefined
            };

            expect(() => createMangaSchema.parse(dataWithoutCover)).toThrow(ZodError);
        });

        it('deve falhar com cover inválido', () => {
            const dataWithInvalidCover = {
                ...validCreateData,
                cover: 'invalid-url'
            };

            expect(() => createMangaSchema.parse(dataWithInvalidCover)).toThrow(ZodError);
        });

        it('deve falhar com cover vazio', () => {
            const dataWithEmptyCover = {
                ...validCreateData,
                cover: ''
            };

            expect(() => createMangaSchema.parse(dataWithEmptyCover)).toThrow(ZodError);
        });

        it('deve falhar sem languageIds', () => {
            const dataWithoutLanguages = {
                ...validCreateData,
                languageIds: undefined
            };

            expect(() => createMangaSchema.parse(dataWithoutLanguages)).toThrow(ZodError);
        });

        it('deve falhar com languageIds vazio', () => {
            const dataWithEmptyLanguages = {
                ...validCreateData,
                languageIds: []
            };

            expect(() => createMangaSchema.parse(dataWithEmptyLanguages)).toThrow(ZodError);
        });

        it('deve falhar com languageIds inválidos', () => {
            const dataWithInvalidLanguageIds = {
                ...validCreateData,
                languageIds: ['invalid-uuid']
            };

            expect(() => createMangaSchema.parse(dataWithInvalidLanguageIds)).toThrow(ZodError);
        });

        it('deve falhar sem translations', () => {
            const dataWithoutTranslations = {
                ...validCreateData,
                translations: undefined
            };

            expect(() => createMangaSchema.parse(dataWithoutTranslations)).toThrow(ZodError);
        });

        it('deve falhar com translations vazio', () => {
            const dataWithEmptyTranslations = {
                ...validCreateData,
                translations: []
            };

            expect(() => createMangaSchema.parse(dataWithEmptyTranslations)).toThrow(ZodError);
        });

        it('deve falhar com translation sem name', () => {
            const dataWithInvalidTranslation = {
                ...validCreateData,
                translations: [
                    {
                        language: 'pt',
                        description: 'Apenas descrição'
                    }
                ]
            };

            expect(() => createMangaSchema.parse(dataWithInvalidTranslation)).toThrow(ZodError);
        });

        it('deve falhar com categoryIds inválidos', () => {
            const dataWithInvalidCategoryIds = {
                ...validCreateData,
                categoryIds: ['invalid-uuid']
            };

            expect(() => createMangaSchema.parse(dataWithInvalidCategoryIds)).toThrow(ZodError);
        });

        it('deve aceitar categoryIds como undefined', () => {
            const dataWithoutCategories = {
                ...validCreateData,
                categoryIds: undefined
            };

            const result = createMangaSchema.parse(dataWithoutCategories);
            expect(result.categoryIds).toBeUndefined();
        });

        it('deve converter string de data para Date', () => {
            const dataWithStringDate = {
                ...validCreateData,
                releaseDate: '2023-01-01'
            };

            const result = createMangaSchema.parse(dataWithStringDate);
            expect(result.releaseDate).toBeInstanceOf(Date);
        });
    });

    describe('updateMangaSchema', () => {
        const validUpdateData = {
            cover: 'https://example.com/new-cover.jpg',
            status: 'completed',
            type: 'manhwa',
            releaseDate: new Date('2024-01-01'),
            languageIds: ['lang-123'],
            categoryIds: ['cat-123', 'cat-456'],
            translations: [
                {
                    language: 'pt',
                    name: 'Novo Nome',
                    description: 'Nova descrição'
                }
            ]
        };

        it('deve validar dados de atualização corretos', () => {
            const result = updateMangaSchema.parse(validUpdateData);
            expect(result).toEqual(validUpdateData);
        });

        it('deve aceitar apenas languageIds e translations obrigatórios', () => {
            const minimalUpdateData = {
                languageIds: ['lang-123'],
                translations: [
                    {
                        language: 'pt',
                        name: 'Nome Obrigatório'
                    }
                ]
            };

            const result = updateMangaSchema.parse(minimalUpdateData);
            expect(result.languageIds).toEqual(minimalUpdateData.languageIds);
            expect(result.translations).toEqual(minimalUpdateData.translations);
        });

        it('deve falhar sem languageIds obrigatório', () => {
            const dataWithoutLanguages = {
                ...validUpdateData,
                languageIds: undefined
            };

            expect(() => updateMangaSchema.parse(dataWithoutLanguages)).toThrow(ZodError);
        });

        it('deve falhar com languageIds vazio', () => {
            const dataWithEmptyLanguages = {
                ...validUpdateData,
                languageIds: []
            };

            expect(() => updateMangaSchema.parse(dataWithEmptyLanguages)).toThrow(ZodError);
        });

        it('deve falhar sem translations obrigatório', () => {
            const dataWithoutTranslations = {
                ...validUpdateData,
                translations: undefined
            };

            expect(() => updateMangaSchema.parse(dataWithoutTranslations)).toThrow(ZodError);
        });

        it('deve falhar com translations vazio', () => {
            const dataWithEmptyTranslations = {
                ...validUpdateData,
                translations: []
            };

            expect(() => updateMangaSchema.parse(dataWithEmptyTranslations)).toThrow(ZodError);
        });

        it('deve falhar com translation sem nome obrigatório', () => {
            const dataWithInvalidTranslation = {
                ...validUpdateData,
                translations: [
                    {
                        language: 'pt',
                        description: 'Apenas descrição'
                    }
                ]
            };

            expect(() => updateMangaSchema.parse(dataWithInvalidTranslation)).toThrow(ZodError);
        });

        it('deve falhar com nome de translation vazio', () => {
            const dataWithEmptyName = {
                ...validUpdateData,
                translations: [
                    {
                        language: 'pt',
                        name: '',
                        description: 'Descrição'
                    }
                ]
            };

            expect(() => updateMangaSchema.parse(dataWithEmptyName)).toThrow(ZodError);
        });

        it('deve aceitar cover como opcional', () => {
            const dataWithoutCover = {
                ...validUpdateData,
                cover: undefined
            };

            const result = updateMangaSchema.parse(dataWithoutCover);
            expect(result.cover).toBeUndefined();
        });

        it('deve falhar com cover inválido', () => {
            const dataWithInvalidCover = {
                ...validUpdateData,
                cover: 'invalid-url'
            };

            expect(() => updateMangaSchema.parse(dataWithInvalidCover)).toThrow(ZodError);
        });
    });

    describe('patchMangaSchema', () => {
        it('deve validar patch com cover apenas', () => {
            const patchData = {
                cover: 'https://example.com/new-cover.jpg'
            };

            const result = patchMangaSchema.parse(patchData);
            expect(result).toEqual(patchData);
        });

        it('deve validar patch com status apenas', () => {
            const patchData = {
                status: 'completed'
            };

            const result = patchMangaSchema.parse(patchData);
            expect(result).toEqual(patchData);
        });

        it('deve validar patch com múltiplos campos', () => {
            const patchData = {
                cover: 'https://example.com/new-cover.jpg',
                status: 'completed',
                type: 'manhwa',
                languageIds: ['lang-123'],
                translations: [
                    {
                        language: 'pt',
                        name: 'Nome Atualizado'
                    }
                ]
            };

            const result = patchMangaSchema.parse(patchData);
            expect(result).toEqual(patchData);
        });

        it('deve validar patch com translations completas', () => {
            const patchData = {
                translations: [
                    {
                        language: 'pt',
                        name: 'Nome em Português',
                        description: 'Descrição em português'
                    },
                    {
                        language: 'en',
                        name: 'English Name'
                    }
                ]
            };

            const result = patchMangaSchema.parse(patchData);
            expect(result).toEqual(patchData);
        });

        it('deve falhar com objeto vazio', () => {
            const emptyPatch = {};

            expect(() => patchMangaSchema.parse(emptyPatch)).toThrow(ZodError);
        });

        it('deve falhar com cover inválido', () => {
            const invalidPatch = {
                cover: 'invalid-url'
            };

            expect(() => patchMangaSchema.parse(invalidPatch)).toThrow(ZodError);
        });

        it('deve falhar com languageIds inválidos', () => {
            const invalidPatch = {
                languageIds: ['invalid-uuid']
            };

            expect(() => patchMangaSchema.parse(invalidPatch)).toThrow(ZodError);
        });

        it('deve falhar com categoryIds inválidos', () => {
            const invalidPatch = {
                categoryIds: ['invalid-uuid']
            };

            expect(() => patchMangaSchema.parse(invalidPatch)).toThrow(ZodError);
        });

        it('deve falhar com translation sem nome', () => {
            const invalidPatch = {
                translations: [
                    {
                        language: 'pt',
                        description: 'Apenas descrição'
                    }
                ]
            };

            expect(() => patchMangaSchema.parse(invalidPatch)).toThrow(ZodError);
        });

        it('deve falhar com nome de translation vazio', () => {
            const invalidPatch = {
                translations: [
                    {
                        language: 'pt',
                        name: ''
                    }
                ]
            };

            expect(() => patchMangaSchema.parse(invalidPatch)).toThrow(ZodError);
        });

        it('deve aceitar releaseDate como string e converter para Date', () => {
            const patchData = {
                releaseDate: '2024-01-01'
            };

            const result = patchMangaSchema.parse(patchData);
            expect(result.releaseDate).toBeInstanceOf(Date);
        });

        it('deve aceitar categoryIds como array vazio', () => {
            const patchData = {
                categoryIds: []
            };

            const result = patchMangaSchema.parse(patchData);
            expect(result.categoryIds).toEqual([]);
        });
    });

    describe('Type inference', () => {
        it('deve inferir tipos corretamente para CreateMangaInput', () => {
            const createData: CreateMangaInput = {
                cover: 'https://example.com/cover.jpg',
                languageIds: ['lang-123'],
                translations: [
                    {
                        language: 'pt',
                        name: 'Manga Teste'
                    }
                ]
            };

            expect(createData.cover).toBe('https://example.com/cover.jpg');
            expect(createData.languageIds).toHaveLength(1);
            expect(createData.translations).toHaveLength(1);
        });

        it('deve inferir tipos corretamente para PatchMangaInput', () => {
            const patchData: PatchMangaInput = {
                cover: 'https://example.com/new-cover.jpg',
                status: 'completed'
            };

            expect(patchData.cover).toBe('https://example.com/new-cover.jpg');
            expect(patchData.status).toBe('completed');
        });
    });
});