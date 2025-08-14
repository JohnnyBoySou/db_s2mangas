import prisma from "@/prisma/client";
import { createPrismaRepository, ICrudRepository } from "@/modules/crud/handlers/CrudHandler";
import { CreateCategoryData, UpdateCategoryData } from "../validators/CategoriesValidators";

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  mangas?: any[];
  _count?: { mangas: number };
}

export class CategoryRepository implements ICrudRepository<Category, CreateCategoryData, UpdateCategoryData> {
  private repository: ICrudRepository<Category, CreateCategoryData, UpdateCategoryData>;

  constructor() {
    this.repository = createPrismaRepository<Category, CreateCategoryData, UpdateCategoryData>({
      model: prisma.category,
      defaultInclude: {
        _count: {
          select: {
            mangas: true,
          },
        },
      },
      searchFields: ['name'],
    });
  }

  async create(data: CreateCategoryData): Promise<Category> {
    return await this.repository.create(data);
  }

  async findById(id: string, options?: any): Promise<Category | null> {
    return await this.repository.findById(id, options);
  }

  async findMany(options?: any): Promise<any> {
    return await this.repository.findMany(options);
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    return await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return await this.repository.delete(id);
  }

  async count(where?: any): Promise<number> {
    return await this.repository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.repository.exists(id);
  }

  async batchDelete(ids: string[]): Promise<{ count: number }> {
    return await this.repository.batchDelete(ids);
  }

  async search(query: string, options?: any): Promise<any> {
    return await this.repository.search(query, options);
  }

  async findByName(name: string): Promise<Category | null> {
    return await this.repository.findById(name, {
      where: {
        name: { 
          equals: name, 
          mode: 'insensitive' 
        }
      }
    });
  }

  async canDelete(id: string): Promise<boolean> {
    const category = await this.repository.findById(id, {
      include: {
        _count: {
          select: {
            mangas: true,
          },
        },
      },
    });
    
    return category ? category._count?.mangas === 0 : false;
  }
}