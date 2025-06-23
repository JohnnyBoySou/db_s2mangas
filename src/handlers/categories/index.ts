import prisma from "@/prisma/client";
import { createCategorySchema, updateCategorySchema } from "@/schemas/categorySchemas";

export const createCategory = async (data: any) => {
    const validatedData = createCategorySchema.parse(data);
    const category = await prisma.category.create({
        data: {
            name: validatedData.name,
        },
    });
    return category;
};

export const listCategories = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
        prisma.category.findMany({
            include: {
                _count: {
                    select: {
                        mangas: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            },
            skip,
            take: limit
        }),
        prisma.category.count()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: categories,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            next: page < totalPages,
            prev: page > 1,
        },
    };
};

export const getCategoryById = async (id: string) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            mangas: {
                include: {
                    translations: true,
                    languages: true
                }
            }
        }
    });

    if (!category) {
        throw new Error("Categoria não encontrada");
    }

    return category;
};

export const updateCategory = async (id: string, data: any) => {
    const validatedData = updateCategorySchema.parse(data);
    const existing = await prisma.category.findUnique({ where: { id } });
    
    if (!existing) {
        throw new Error("Categoria não encontrada");
    }

    const updated = await prisma.category.update({
        where: { id },
        data: {
            name: validatedData.name,
        },
    });

    return updated;
};

export const deleteCategory = async (id: string) => {
    const existing = await prisma.category.findUnique({ where: { id } });
    
    if (!existing) {
        throw new Error("Categoria não encontrada");
    }

    await prisma.category.delete({ where: { id } });
    return { message: "Categoria deletada com sucesso" };
}; 