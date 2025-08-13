import {
  idParamsSchema,
  paginationSchema,
  filterSchema,
  batchOperationSchema,
  type IdParams,
  type PaginationQuery,
  type FilterOptions,
  type BatchOperation
} from '../validators/CrudValidator';

describe('CrudValidator', () => {
  describe('idParamsSchema', () => {
    it('deve validar um UUID válido', () => {
      const validId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const result = idParamsSchema.parse({ id: validId });
      expect(result.id).toBe(validId);
    });

    it('deve rejeitar um ID inválido', () => {
      expect(() => {
        idParamsSchema.parse({ id: 'invalid-id' });
      }).toThrow('ID deve ser um UUID válido');
    });

    it('deve rejeitar quando ID está ausente', () => {
      expect(() => {
        idParamsSchema.parse({});
      }).toThrow();
    });
  });

  describe('paginationSchema', () => {
    it('deve aplicar valores padrão quando não fornecidos', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.order).toBe('asc');
    });

    it('deve validar parâmetros de paginação válidos', () => {
      const input = {
        page: '2',
        limit: '20',
        search: 'test',
        orderBy: 'name',
        order: 'desc' as const
      };
      const result = paginationSchema.parse(input);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.search).toBe('test');
      expect(result.orderBy).toBe('name');
      expect(result.order).toBe('desc');
    });

    it('deve rejeitar página menor que 1', () => {
      expect(() => {
        paginationSchema.parse({ page: '0' });
      }).toThrow('Página deve ser maior que 0');
    });

    it('deve rejeitar limite maior que 100', () => {
      expect(() => {
        paginationSchema.parse({ limit: '101' });
      }).toThrow('Limite máximo é 100');
    });

    it('deve rejeitar ordem inválida', () => {
      expect(() => {
        paginationSchema.parse({ order: 'invalid' });
      }).toThrow();
    });
  });

  describe('filterSchema', () => {
    it('deve validar filtros opcionais', () => {
      const input = {
        where: { name: 'test' },
        include: { mangas: true },
        select: { id: true, name: true }
      };
      const result = filterSchema.parse(input);
      expect(result).toEqual(input);
    });

    it('deve aceitar objeto vazio', () => {
      const result = filterSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('batchOperationSchema', () => {
    it('deve validar array de UUIDs válidos', () => {
      const ids = [
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'b2c3d4e5-f6a7-4901-bcde-f12345678901' // UUID corrigido
      ];
      const result = batchOperationSchema.parse({ ids });
      expect(result.ids).toEqual(ids);
    });

    it('deve rejeitar array vazio', () => {
      expect(() => {
        batchOperationSchema.parse({ ids: [] });
      }).toThrow('Pelo menos um ID é obrigatório');
    });

    it('deve rejeitar UUIDs inválidos', () => {
      expect(() => {
        batchOperationSchema.parse({ ids: ['invalid-id'] });
      }).toThrow();
    });
  });
});