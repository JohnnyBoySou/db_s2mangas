import prisma from "@/prisma/client";
import { BasePrismaRepository } from "@/modules/crud/handlers/CrudHandler";
import { CreateCategoryData, UpdateCategoryData } from "../validators/CategoriesValidators";

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  mangas?: any[];
  _count?: { mangas: number };
}

export class CategoryRepository extends BasePrismaRepository<Category, CreateCategoryData, UpdateCategoryData> {
  protected model = prisma.category;
  protected defaultInclude = {
    _count: {
      select: {
        mangas: true,
      },
    },
  };
  protected searchFields = ['name'];

  async findByName(name: string): Promise<Category | null> {
    return await this.findFirst({
      name: { 
        equals: name, 
        mode: 'insensitive' 
      }
    });
  }

  async canDelete(id: string): Promise<boolean> {
    const category = await this.findById(id, {
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