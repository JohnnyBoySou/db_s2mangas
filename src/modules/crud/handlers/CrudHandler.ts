import { FilterOptions } from "../validators/CrudValidator";

// Interface para resultado paginado
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    next: boolean;
    prev: boolean;
  };
}

// Interface para opções de busca
export interface FindManyOptions {
  where?: any;
  orderBy?: any;
  include?: any;
  select?: any;
  page?: number;
  limit?: number;
}

// Interface base para repositório CRUD
export interface ICrudRepository<T, CreateData, UpdateData> {
  create(_data: CreateData): Promise<T>;
  findById(_id: string, _options?: FilterOptions): Promise<T | null>;
  findMany(_options?: FindManyOptions): Promise<PaginatedResult<T>>;
  update(_id: string, _data: UpdateData): Promise<T>;
  delete(_id: string): Promise<void>;
  count(_where?: any): Promise<number>;
  exists(_id: string): Promise<boolean>;
  batchDelete(_ids: string[]): Promise<{ count: number }>;
  search(_query: string, _options?: FindManyOptions): Promise<PaginatedResult<T>>;
}

// Configuração do repositório
export interface RepositoryConfig {
  model: any;
  defaultInclude?: any;
  searchFields?: string[];
}

// Funções do repositório Prisma
export function createPrismaRepository<T, CreateData, UpdateData>(
  config: RepositoryConfig
): ICrudRepository<T, CreateData, UpdateData> {
  const { model, defaultInclude, searchFields } = config;

  return {
    async create(data: CreateData): Promise<T> {
      return await model.create({
        data,
        include: defaultInclude,
      });
    },

    async findById(id: string, options?: FilterOptions): Promise<T | null> {
      return await model.findUnique({
        where: { id },
        include: options?.include || defaultInclude,
        select: options?.select,
      });
    },

    async findMany(options: FindManyOptions = {}): Promise<PaginatedResult<T>> {
      const { page = 1, limit = 10, where, orderBy, include, select } = options;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        model.findMany({
          where,
          orderBy,
          include: include || defaultInclude,
          select,
          skip,
          take: limit,
        }),
        model.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          next: page < totalPages,
          prev: page > 1,
        },
      };
    },

    async update(id: string, data: UpdateData): Promise<T> {
      return await model.update({
        where: { id },
        data,
        include: defaultInclude,
      });
    },

    async delete(id: string): Promise<void> {
      await model.delete({ where: { id } });
    },

    async count(where?: any): Promise<number> {
      return await model.count({ where });
    },

    async exists(id: string): Promise<boolean> {
      const count = await model.count({ where: { id } });
      return count > 0;
    },

    async batchDelete(ids: string[]): Promise<{ count: number }> {
      return await model.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
    },

    async search(query: string, options: FindManyOptions = {}): Promise<PaginatedResult<T>> {
      if (!searchFields || searchFields.length === 0) {
        throw new Error("Search fields not defined for this repository");
      }

      const searchConditions = searchFields.map(field => ({
        [field]: {
          contains: query,
          mode: 'insensitive' as const,
        },
      }));

      const where = {
        ...options.where,
        OR: searchConditions,
      };

      return this.findMany({
        ...options,
        where,
      });
    },
  };
}

// Funções auxiliares do repositório
export function createRepositoryHelpers<T, CreateData, UpdateData>(
  repository: ICrudRepository<T, CreateData, UpdateData>,
  model: any,
  defaultInclude?: any
) {
  return {
    async findFirst(where: any, options?: FilterOptions): Promise<T | null> {
      return await model.findFirst({
        where,
        include: options?.include || defaultInclude,
        select: options?.select,
      });
    },

    async findUnique(where: any, options?: FilterOptions): Promise<T | null> {
      return await model.findUnique({
        where,
        include: options?.include || defaultInclude,
        select: options?.select,
      });
    },

    async upsert(where: any, create: CreateData, update: UpdateData): Promise<T> {
      return await model.upsert({
        where,
        create,
        update,
        include: defaultInclude,
      });
    },

    async batchCreate(data: CreateData[]): Promise<{ count: number }> {
      return await model.createMany({
        data,
        skipDuplicates: true,
      });
    },

    async batchUpdate(where: any, data: Partial<UpdateData>): Promise<{ count: number }> {
      return await model.updateMany({
        where,
        data,
      });
    },
  };
}

// Funções do handler CRUD
export function createCrudHandler<T, CreateData, UpdateData>(
  _repository: ICrudRepository<T, CreateData, UpdateData>
) {
  return {
    async create(data: CreateData): Promise<T> {
      return await _repository.create(data);
    },

    async getById(id: string, options?: FilterOptions): Promise<T> {
      const item = await _repository.findById(id, options);
      if (!item) {
        throw new Error("Item não encontrado");
      }
      return item;
    },

    async list(options: FindManyOptions = {}): Promise<PaginatedResult<T>> {
      return await _repository.findMany(options);
    },

    async update(id: string, data: UpdateData): Promise<T> {
      if (!(await _repository.exists(id))) {
        throw new Error("Item não encontrado");
      }
      return await _repository.update(id, data);
    },

    async delete(id: string): Promise<{ message: string }> {
      if (!(await _repository.exists(id))) {
        throw new Error("Item não encontrado");
      }
      await _repository.delete(id);
      return { message: "Item deletado com sucesso" };
    },

    async batchDelete(ids: string[]): Promise<{ message: string; count: number }> {
      const result = await _repository.batchDelete(ids);
      return {
        message: `${result.count} itens deletados com sucesso`,
        count: result.count
      };
    },

    async search(query: string, options: FindManyOptions = {}): Promise<PaginatedResult<T>> {
      return await _repository.search(query, options);
    },

    async count(where?: any): Promise<{ count: number }> {
      const count = await _repository.count(where);
      return { count };
    },

    async exists(id: string): Promise<{ exists: boolean }> {
      const exists = await _repository.exists(id);
      return { exists };
    },
  };
}

// Função factory para criar um handler completo
export function createFullCrudHandler<T, CreateData, UpdateData>(
  config: RepositoryConfig
) {
  const repository = createPrismaRepository<T, CreateData, UpdateData>(config);
  const handler = createCrudHandler(repository);
  const helpers = createRepositoryHelpers(repository, config.model, config.defaultInclude);
  
  return {
    ...handler,
    helpers,
    repository,
  };
}

// Exportar tipos para compatibilidade
export type CrudHandler<T, CreateData, UpdateData> = ReturnType<typeof createCrudHandler<T, CreateData, UpdateData>>;