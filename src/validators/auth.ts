import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    avatar: z.string().url().optional(),
    cover: z.string().url().optional(),
    categories: z.array(z.object({
        name: z.string()
    })).optional(),
    languages: z.array(z.string()).optional()
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

export const updateUserSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').optional(),
    email: z.string().email('Email inválido').optional(),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
    avatar: z.string().optional(),
    cover: z.string().optional(),
    categories: z.array(z.object({
        name: z.string()
    })).optional(),
    languages: z.array(z.string()).optional()
});