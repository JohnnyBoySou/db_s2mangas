import { z } from 'zod';
import { advancedSearchSchema } from '../validators/SearchValidator';
import { MANGA_STATUS, MANGA_TYPE, MANGA_ORDER } from '@/constants/search';

describe('Search Validators', () => {
    describe('advancedSearchSchema', () => {
        it('deve validar dados válidos de busca avançada', () => {
            const validData = {
                name: 'One Piece',
                categories: ['Ação', 'Aventura'],
                status: MANGA_STATUS.ONGOING,
                type: MANGA_TYPE.MANGA,
                languages: ['pt-BR', 'en'],
                orderBy: MANGA_ORDER.MOST_RECENT,
                page: '1',
                limit: '10'
            };

            const result = advancedSearchSchema.parse(validData);

            expect(result).toEqual({
                name: 'One Piece',
                categories: ['Ação', 'Aventura'],
                status: MANGA_STATUS.ONGOING,
                type: MANGA_TYPE.MANGA,
                languages: ['pt-BR', 'en'],
                orderBy: MANGA_ORDER.MOST_RECENT,
                page: 1, // convertido para número
                limit: 10 // convertido para número
            });
        });

        it('deve aplicar valores padrão quando opcionais não são fornecidos', () => {
            const minimalData = {};

            const result = advancedSearchSchema.parse(minimalData);

            expect(result).toEqual({
                orderBy: MANGA_ORDER.MOST_RECENT,
                page: 1,
                limit: 10
            });
        });

        it('deve converter strings de page e limit para números', () => {
            const data = {
                page: '5',
                limit: '20'
            };

            const result = advancedSearchSchema.parse(data);

            expect(result.page).toBe(5);
            expect(result.limit).toBe(20);
            expect(typeof result.page).toBe('number');
            expect(typeof result.limit).toBe('number');
        });

        it('deve validar status válidos', () => {
            const validStatuses = [
                MANGA_STATUS.ONGOING,
                MANGA_STATUS.COMPLETED,
                MANGA_STATUS.DROPPED,
                MANGA_STATUS.HIATUS,
                MANGA_STATUS.ANNOUNCED
            ];

            validStatuses.forEach(status => {
                const data = { status };
                const result = advancedSearchSchema.parse(data);
                expect(result.status).toBe(status);
            });
        });

        it('deve rejeitar status inválidos', () => {
            const invalidData = {
                status: 'Status Inválido'
            };

            expect(() => {
                advancedSearchSchema.parse(invalidData);
            }).toThrow();
        });

        it('deve validar tipos válidos', () => {
            const validTypes = [
                MANGA_TYPE.MANGA,
                MANGA_TYPE.MANHWA,
                MANGA_TYPE.MANHUA,
                MANGA_TYPE.WEBTOON
            ];

            validTypes.forEach(type => {
                const data = { type };
                const result = advancedSearchSchema.parse(data);
                expect(result.type).toBe(type);
            });
        });

        it('deve rejeitar tipos inválidos', () => {
            const invalidData = {
                type: 'Tipo Inválido'
            };

            expect(() => {
                advancedSearchSchema.parse(invalidData);
            }).toThrow();
        });

        it('deve validar orderBy válidos', () => {
            const validOrderBy = [
                MANGA_ORDER.MOST_VIEWED,
                MANGA_ORDER.MOST_LIKED,
                MANGA_ORDER.MOST_RECENT
            ];

            validOrderBy.forEach(orderBy => {
                const data = { orderBy };
                const result = advancedSearchSchema.parse(data);
                expect(result.orderBy).toBe(orderBy);
            });
        });

        it('deve rejeitar orderBy inválidos', () => {
            const invalidData = {
                orderBy: 'invalid_order'
            };

            expect(() => {
                advancedSearchSchema.parse(invalidData);
            }).toThrow();
        });

        it('deve aceitar name como string opcional', () => {
            const dataWithName = { name: 'One Piece' };
            const dataWithoutName = {};

            const resultWithName = advancedSearchSchema.parse(dataWithName);
            const resultWithoutName = advancedSearchSchema.parse(dataWithoutName);

            expect(resultWithName.name).toBe('One Piece');
            expect(resultWithoutName.name).toBeUndefined();
        });

        it('deve aceitar categories como array de strings opcional', () => {
            const dataWithCategories = { categories: ['Ação', 'Romance'] };
            const dataWithoutCategories = {};

            const resultWithCategories = advancedSearchSchema.parse(dataWithCategories);
            const resultWithoutCategories = advancedSearchSchema.parse(dataWithoutCategories);

            expect(resultWithCategories.categories).toEqual(['Ação', 'Romance']);
            expect(resultWithoutCategories.categories).toBeUndefined();
        });

        it('deve aceitar languages como array de strings opcional', () => {
            const dataWithLanguages = { languages: ['pt-BR', 'en', 'es'] };
            const dataWithoutLanguages = {};

            const resultWithLanguages = advancedSearchSchema.parse(dataWithLanguages);
            const resultWithoutLanguages = advancedSearchSchema.parse(dataWithoutLanguages);

            expect(resultWithLanguages.languages).toEqual(['pt-BR', 'en', 'es']);
            expect(resultWithoutLanguages.languages).toBeUndefined();
        });

        it('deve rejeitar categories que não são array de strings', () => {
            const invalidData = {
                categories: 'não é um array'
            };

            expect(() => {
                advancedSearchSchema.parse(invalidData);
            }).toThrow();
        });

        it('deve rejeitar languages que não são array de strings', () => {
            const invalidData = {
                languages: ['pt-BR', 123] // contém número
            };

            expect(() => {
                advancedSearchSchema.parse(invalidData);
            }).toThrow();
        });

        it('deve rejeitar page que não pode ser convertido para número', () => {
            const invalidData = {
                page: 'not-a-number'
            };

            expect(() => {
                advancedSearchSchema.parse(invalidData);
            }).toThrow();
        });

        it('deve rejeitar limit que não pode ser convertido para número', () => {
            const invalidData = {
                limit: 'not-a-number'
            };

            expect(() => {
                advancedSearchSchema.parse(invalidData);
            }).toThrow();
        });

        it('deve aceitar page e limit como números válidos em string', () => {
            const data = {
                page: '15',
                limit: '25'
            };

            const result = advancedSearchSchema.parse(data);

            expect(result.page).toBe(15);
            expect(result.limit).toBe(25);
        });

        it('deve aceitar valores negativos e convertê-los (sem validação de mínimo)', () => {
            const data = {
                page: '-1',
                limit: '-5'
            };

            const result = advancedSearchSchema.parse(data);

            expect(result.page).toBe(-1);
            expect(result.limit).toBe(-5);
        });

        it('deve aceitar valores decimais e convertê-los para inteiros', () => {
            const data = {
                page: '3.7',
                limit: '12.9'
            };

            const result = advancedSearchSchema.parse(data);

            expect(result.page).toBe(3);
            expect(result.limit).toBe(12);
        });

        it('deve validar dados complexos combinados', () => {
            const complexData = {
                name: 'Naruto',
                categories: ['Ação', 'Aventura', 'Ninja'],
                status: MANGA_STATUS.COMPLETED,
                type: MANGA_TYPE.MANGA,
                languages: ['pt-BR', 'en', 'ja'],
                orderBy: MANGA_ORDER.MOST_LIKED,
                page: '2',
                limit: '15'
            };

            const result = advancedSearchSchema.parse(complexData);

            expect(result).toEqual({
                name: 'Naruto',
                categories: ['Ação', 'Aventura', 'Ninja'],
                status: MANGA_STATUS.COMPLETED,
                type: MANGA_TYPE.MANGA,
                languages: ['pt-BR', 'en', 'ja'],
                orderBy: MANGA_ORDER.MOST_LIKED,
                page: 2,
                limit: 15
            });
        });

        it('deve preservar ordem dos itens em arrays', () => {
            const data = {
                categories: ['Ação', 'Romance', 'Comédia', 'Drama'],
                languages: ['pt-BR', 'en', 'es', 'ja']
            };

            const result = advancedSearchSchema.parse(data);

            expect(result.categories).toEqual(['Ação', 'Romance', 'Comédia', 'Drama']);
            expect(result.languages).toEqual(['pt-BR', 'en', 'es', 'ja']);
        });

        it('deve aceitar arrays vazios', () => {
            const data = {
                categories: [],
                languages: []
            };

            const result = advancedSearchSchema.parse(data);

            expect(result.categories).toEqual([]);
            expect(result.languages).toEqual([]);
        });
    });
});