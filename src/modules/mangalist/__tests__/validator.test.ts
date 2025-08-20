import { ZodError } from 'zod';
import {
    mangaListStatusSchema,
    createMangaListSchema,
    updateMangaListSchema,
    addMangaToListSchema,
    updateMangaListItemSchema,
    reorderMangaListItemsSchema,
    bulkAddToMangaListSchema,
    mangaListFiltersSchema,
    mangaListParamsSchema,
    mangaListItemParamsSchema,
    CreateMangaListInput,
    UpdateMangaListInput,
    AddMangaToListInput,
    BulkAddToMangaListInput
} from '../validators/MangalistValidators';

describe('MangaList Validators', () => {
    describe('mangaListStatusSchema', () => {
        it('deve aceitar status válidos', () => {
            expect(mangaListStatusSchema.parse('PRIVATE')).toBe('PRIVATE');
            expect(mangaListStatusSchema.parse('PUBLIC')).toBe('PUBLIC');
            expect(mangaListStatusSchema.parse('UNLISTED')).toBe('UNLISTED');
        });

        it('deve rejeitar status inválidos', () => {
            expect(() => mangaListStatusSchema.parse('INVALID')).toThrow(ZodError);
            expect(() => mangaListStatusSchema.parse('private')).toThrow(ZodError);
            expect(() => mangaListStatusSchema.parse(123)).toThrow(ZodError);
        });
    });

    describe('createMangaListSchema', () => {
        const validCreateData = {
            name: 'Minha Lista',
            cover: 'https://example.com/cover.jpg',
            mood: 'Ação',
            description: 'Lista de mangás de ação',
            status: 'PUBLIC' as const,
            isDefault: false,
            mangaIds: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001']
        };

        it('deve validar dados corretos', () => {
            const result = createMangaListSchema.parse(validCreateData);
            expect(result).toEqual(validCreateData);
        });

        it('deve aceitar dados mínimos obrigatórios', () => {
            const minimalData = {
                name: 'Lista Mínima',
                cover: 'https://example.com/cover.jpg',
                mood: 'Aventura'
            };

            const result = createMangaListSchema.parse(minimalData);
            expect(result.name).toBe(minimalData.name);
            expect(result.cover).toBe(minimalData.cover);
            expect(result.mood).toBe(minimalData.mood);
            expect(result.status).toBe('PRIVATE'); // valor padrão
            expect(result.isDefault).toBe(false); // valor padrão
        });

        it('deve falhar sem nome obrigatório', () => {
            const dataWithoutName = {
                ...validCreateData,
                name: undefined
            };

            expect(() => createMangaListSchema.parse(dataWithoutName)).toThrow(ZodError);
        });

        it('deve falhar com nome vazio', () => {
            const dataWithEmptyName = {
                ...validCreateData,
                name: ''
            };

            expect(() => createMangaListSchema.parse(dataWithEmptyName)).toThrow(ZodError);
        });

        it('deve falhar com nome muito longo', () => {
            const dataWithLongName = {
                ...validCreateData,
                name: 'a'.repeat(101) // Mais de 100 caracteres
            };

            expect(() => createMangaListSchema.parse(dataWithLongName)).toThrow(ZodError);
        });

        it('deve falhar sem cover obrigatório', () => {
            const dataWithoutCover = {
                ...validCreateData,
                cover: undefined
            };

            expect(() => createMangaListSchema.parse(dataWithoutCover)).toThrow(ZodError);
        });

        it('deve falhar com cover inválido', () => {
            const dataWithInvalidCover = {
                ...validCreateData,
                cover: 'invalid-url'
            };

            expect(() => createMangaListSchema.parse(dataWithInvalidCover)).toThrow(ZodError);
        });

        it('deve falhar sem mood obrigatório', () => {
            const dataWithoutMood = {
                ...validCreateData,
                mood: undefined
            };

            expect(() => createMangaListSchema.parse(dataWithoutMood)).toThrow(ZodError);
        });

        it('deve falhar com mood vazio', () => {
            const dataWithEmptyMood = {
                ...validCreateData,
                mood: ''
            };

            expect(() => createMangaListSchema.parse(dataWithEmptyMood)).toThrow(ZodError);
        });

        it('deve falhar com mood muito longo', () => {
            const dataWithLongMood = {
                ...validCreateData,
                mood: 'a'.repeat(51) // Mais de 50 caracteres
            };

            expect(() => createMangaListSchema.parse(dataWithLongMood)).toThrow(ZodError);
        });

        it('deve falhar com descrição muito longa', () => {
            const dataWithLongDescription = {
                ...validCreateData,
                description: 'a'.repeat(501) // Mais de 500 caracteres
            };

            expect(() => createMangaListSchema.parse(dataWithLongDescription)).toThrow(ZodError);
        });

        it('deve aceitar descrição como opcional', () => {
            const dataWithoutDescription = {
                ...validCreateData,
                description: undefined
            };

            const result = createMangaListSchema.parse(dataWithoutDescription);
            expect(result.description).toBeUndefined();
        });

        it('deve falhar com mangaIds inválidos', () => {
            const dataWithInvalidMangaIds = {
                ...validCreateData,
                mangaIds: ['invalid-uuid']
            };

            expect(() => createMangaListSchema.parse(dataWithInvalidMangaIds)).toThrow(ZodError);
        });

        it('deve aceitar mangaIds como opcional', () => {
            const dataWithoutMangaIds = {
                ...validCreateData,
                mangaIds: undefined
            };

            const result = createMangaListSchema.parse(dataWithoutMangaIds);
            expect(result.mangaIds).toBeUndefined();
        });

        it('deve aceitar status padrão', () => {
            const dataWithDefaultStatus = {
                name: 'Lista',
                cover: 'https://example.com/cover.jpg',
                mood: 'Ação'
            };

            const result = createMangaListSchema.parse(dataWithDefaultStatus);
            expect(result.status).toBe('PRIVATE');
        });
    });

    describe('updateMangaListSchema', () => {
        const validUpdateData = {
            name: 'Lista Atualizada',
            cover: 'https://example.com/new-cover.jpg',
            mood: 'Romance',
            description: 'Nova descrição',
            status: 'PUBLIC' as const,
            isDefault: true
        };

        it('deve validar dados de atualização corretos', () => {
            const result = updateMangaListSchema.parse(validUpdateData);
            expect(result).toEqual(validUpdateData);
        });

        it('deve aceitar atualização parcial', () => {
            const partialUpdate = {
                name: 'Novo Nome'
            };

            const result = updateMangaListSchema.parse(partialUpdate);
            expect(result.name).toBe('Novo Nome');
            expect(result.cover).toBeUndefined();
        });

        it('deve aceitar todos os campos como opcionais', () => {
            const emptyUpdate = {};

            const result = updateMangaListSchema.parse(emptyUpdate);
            expect(Object.keys(result)).toHaveLength(0);
        });

        it('deve falhar com nome vazio quando fornecido', () => {
            const updateWithEmptyName = {
                name: ''
            };

            expect(() => updateMangaListSchema.parse(updateWithEmptyName)).toThrow(ZodError);
        });

        it('deve falhar com cover inválido quando fornecido', () => {
            const updateWithInvalidCover = {
                cover: 'invalid-url'
            };

            expect(() => updateMangaListSchema.parse(updateWithInvalidCover)).toThrow(ZodError);
        });
    });

    describe('addMangaToListSchema', () => {
        const validAddData = {
            mangaId: '550e8400-e29b-41d4-a716-446655440000',
            order: 5,
            note: 'Ótimo mangá'
        };

        it('deve validar dados corretos', () => {
            const result = addMangaToListSchema.parse(validAddData);
            expect(result).toEqual(validAddData);
        });

        it('deve aceitar apenas mangaId obrigatório', () => {
            const minimalData = {
                mangaId: '550e8400-e29b-41d4-a716-446655440000'
            };

            const result = addMangaToListSchema.parse(minimalData);
            expect(result.mangaId).toBe(minimalData.mangaId);
            expect(result.order).toBeUndefined();
            expect(result.note).toBeUndefined();
        });

        it('deve falhar sem mangaId obrigatório', () => {
            const dataWithoutMangaId = {
                order: 5,
                note: 'Nota'
            };

            expect(() => addMangaToListSchema.parse(dataWithoutMangaId)).toThrow(ZodError);
        });

        it('deve falhar com mangaId inválido', () => {
            const dataWithInvalidMangaId = {
                mangaId: 'invalid-uuid'
            };

            expect(() => addMangaToListSchema.parse(dataWithInvalidMangaId)).toThrow(ZodError);
        });

        it('deve falhar com order negativo', () => {
            const dataWithNegativeOrder = {
                mangaId: '550e8400-e29b-41d4-a716-446655440000',
                order: -1
            };

            expect(() => addMangaToListSchema.parse(dataWithNegativeOrder)).toThrow(ZodError);
        });

        it('deve falhar com order não inteiro', () => {
            const dataWithFloatOrder = {
                mangaId: '550e8400-e29b-41d4-a716-446655440000',
                order: 1.5
            };

            expect(() => addMangaToListSchema.parse(dataWithFloatOrder)).toThrow(ZodError);
        });

        it('deve falhar com nota muito longa', () => {
            const dataWithLongNote = {
                mangaId: '550e8400-e29b-41d4-a716-446655440000',
                note: 'a'.repeat(201) // Mais de 200 caracteres
            };

            expect(() => addMangaToListSchema.parse(dataWithLongNote)).toThrow(ZodError);
        });
    });

    describe('updateMangaListItemSchema', () => {
        it('deve validar atualização de ordem', () => {
            const updateData = { order: 10 };
            const result = updateMangaListItemSchema.parse(updateData);
            expect(result.order).toBe(10);
        });

        it('deve validar atualização de nota', () => {
            const updateData = { note: 'Nova nota' };
            const result = updateMangaListItemSchema.parse(updateData);
            expect(result.note).toBe('Nova nota');
        });

        it('deve aceitar ambos os campos', () => {
            const updateData = { order: 5, note: 'Nota atualizada' };
            const result = updateMangaListItemSchema.parse(updateData);
            expect(result).toEqual(updateData);
        });

        it('deve aceitar objeto vazio', () => {
            const emptyUpdate = {};
            const result = updateMangaListItemSchema.parse(emptyUpdate);
            expect(Object.keys(result)).toHaveLength(0);
        });

        it('deve falhar com ordem negativa', () => {
            const invalidUpdate = { order: -1 };
            expect(() => updateMangaListItemSchema.parse(invalidUpdate)).toThrow(ZodError);
        });

        it('deve falhar com nota muito longa', () => {
            const invalidUpdate = { note: 'a'.repeat(201) };
            expect(() => updateMangaListItemSchema.parse(invalidUpdate)).toThrow(ZodError);
        });
    });

    describe('reorderMangaListItemsSchema', () => {
        const validReorderData = {
            items: [
                { id: '550e8400-e29b-41d4-a716-446655440000', order: 0 },
                { id: '550e8400-e29b-41d4-a716-446655440001', order: 1 }
            ]
        };

        it('deve validar dados corretos', () => {
            const result = reorderMangaListItemsSchema.parse(validReorderData);
            expect(result).toEqual(validReorderData);
        });

        it('deve falhar com array vazio', () => {
            const emptyData = { items: [] };
            expect(() => reorderMangaListItemsSchema.parse(emptyData)).toThrow(ZodError);
        });

        it('deve falhar sem items', () => {
            const dataWithoutItems = {};
            expect(() => reorderMangaListItemsSchema.parse(dataWithoutItems)).toThrow(ZodError);
        });

        it('deve falhar com ID inválido', () => {
            const invalidData = {
                items: [
                    { id: 'invalid-uuid', order: 0 }
                ]
            };
            expect(() => reorderMangaListItemsSchema.parse(invalidData)).toThrow(ZodError);
        });

        it('deve falhar com ordem negativa', () => {
            const invalidData = {
                items: [
                    { id: '550e8400-e29b-41d4-a716-446655440000', order: -1 }
                ]
            };
            expect(() => reorderMangaListItemsSchema.parse(invalidData)).toThrow(ZodError);
        });
    });

    describe('bulkAddToMangaListSchema', () => {
        const validBulkData = {
            mangaIds: [
                '550e8400-e29b-41d4-a716-446655440000',
                '550e8400-e29b-41d4-a716-446655440001'
            ],
            notes: {
                '550e8400-e29b-41d4-a716-446655440000': 'Primeira nota',
                '550e8400-e29b-41d4-a716-446655440001': 'Segunda nota'
            }
        };

        it('deve validar dados corretos', () => {
            const result = bulkAddToMangaListSchema.parse(validBulkData);
            expect(result).toEqual(validBulkData);
        });

        it('deve aceitar apenas mangaIds', () => {
            const minimalData = {
                mangaIds: ['550e8400-e29b-41d4-a716-446655440000']
            };

            const result = bulkAddToMangaListSchema.parse(minimalData);
            expect(result.mangaIds).toEqual(minimalData.mangaIds);
            expect(result.notes).toBeUndefined();
        });

        it('deve falhar sem mangaIds', () => {
            const dataWithoutMangaIds = {
                notes: { 'test': 'nota' }
            };
            expect(() => bulkAddToMangaListSchema.parse(dataWithoutMangaIds)).toThrow(ZodError);
        });

        it('deve falhar com mangaIds vazio', () => {
            const emptyData = { mangaIds: [] };
            expect(() => bulkAddToMangaListSchema.parse(emptyData)).toThrow(ZodError);
        });

        it('deve falhar com mangaId inválido', () => {
            const invalidData = {
                mangaIds: ['invalid-uuid']
            };
            expect(() => bulkAddToMangaListSchema.parse(invalidData)).toThrow(ZodError);
        });

        it('deve falhar com nota muito longa', () => {
            const invalidData = {
                mangaIds: ['550e8400-e29b-41d4-a716-446655440000'],
                notes: {
                    '550e8400-e29b-41d4-a716-446655440000': 'a'.repeat(201)
                }
            };
            expect(() => bulkAddToMangaListSchema.parse(invalidData)).toThrow(ZodError);
        });
    });

    describe('mangaListFiltersSchema', () => {
        it('deve aplicar valores padrão', () => {
            const emptyFilters = {};
            const result = mangaListFiltersSchema.parse(emptyFilters);
            
            expect(result.sortBy).toBe('createdAt');
            expect(result.sortOrder).toBe('desc');
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        it('deve aceitar todos os filtros', () => {
            const filters = {
                userId: '550e8400-e29b-41d4-a716-446655440000',
                status: 'PUBLIC' as const,
                mood: 'Ação',
                search: 'mangá',
                sortBy: 'name' as const,
                sortOrder: 'asc' as const,
                page: 2,
                limit: 50
            };

            const result = mangaListFiltersSchema.parse(filters);
            expect(result).toEqual(filters);
        });

        it('deve falhar com page inválido', () => {
            const invalidFilters = { page: 0 };
            expect(() => mangaListFiltersSchema.parse(invalidFilters)).toThrow(ZodError);
        });

        it('deve falhar com limit muito alto', () => {
            const invalidFilters = { limit: 101 };
            expect(() => mangaListFiltersSchema.parse(invalidFilters)).toThrow(ZodError);
        });

        it('deve falhar com userId inválido', () => {
            const invalidFilters = { userId: 'invalid-uuid' };
            expect(() => mangaListFiltersSchema.parse(invalidFilters)).toThrow(ZodError);
        });
    });

    describe('mangaListParamsSchema', () => {
        it('deve validar ID válido', () => {
            const params = { id: '550e8400-e29b-41d4-a716-446655440000' };
            const result = mangaListParamsSchema.parse(params);
            expect(result.id).toBe(params.id);
        });

        it('deve falhar com ID inválido', () => {
            const params = { id: 'invalid-uuid' };
            expect(() => mangaListParamsSchema.parse(params)).toThrow(ZodError);
        });
    });

    describe('mangaListItemParamsSchema', () => {
        it('deve validar parâmetros válidos', () => {
            const params = {
                listId: '550e8400-e29b-41d4-a716-446655440000',
                itemId: '550e8400-e29b-41d4-a716-446655440001'
            };
            
            const result = mangaListItemParamsSchema.parse(params);
            expect(result).toEqual(params);
        });

        it('deve falhar com listId inválido', () => {
            const params = {
                listId: 'invalid-uuid',
                itemId: '550e8400-e29b-41d4-a716-446655440001'
            };
            expect(() => mangaListItemParamsSchema.parse(params)).toThrow(ZodError);
        });

        it('deve falhar com itemId inválido', () => {
            const params = {
                listId: '550e8400-e29b-41d4-a716-446655440000',
                itemId: 'invalid-uuid'
            };
            expect(() => mangaListItemParamsSchema.parse(params)).toThrow(ZodError);
        });
    });

    describe('Type inference', () => {
        it('deve inferir tipos corretamente para CreateMangaListInput', () => {
            const createData: CreateMangaListInput = {
                name: 'Test List',
                cover: 'https://example.com/cover.jpg',
                mood: 'Action'
            };

            expect(createData.name).toBe('Test List');
            expect(createData.cover).toBe('https://example.com/cover.jpg');
            expect(createData.mood).toBe('Action');
        });

        it('deve inferir tipos corretamente para UpdateMangaListInput', () => {
            const updateData: UpdateMangaListInput = {
                name: 'Updated List',
                description: 'New description'
            };

            expect(updateData.name).toBe('Updated List');
            expect(updateData.description).toBe('New description');
        });

        it('deve inferir tipos corretamente para AddMangaToListInput', () => {
            const addData: AddMangaToListInput = {
                mangaId: '550e8400-e29b-41d4-a716-446655440000',
                order: 1,
                note: 'Great manga'
            };

            expect(addData.mangaId).toBe('550e8400-e29b-41d4-a716-446655440000');
            expect(addData.order).toBe(1);
            expect(addData.note).toBe('Great manga');
        });

        it('deve inferir tipos corretamente para BulkAddToMangaListInput', () => {
            const bulkData: BulkAddToMangaListInput = {
                mangaIds: ['550e8400-e29b-41d4-a716-446655440000'],
                notes: {
                    '550e8400-e29b-41d4-a716-446655440000': 'Note'
                }
            };

            expect(bulkData.mangaIds).toHaveLength(1);
            expect(bulkData.notes).toBeDefined();
        });
    });
});