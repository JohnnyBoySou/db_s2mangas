import { z } from "zod";

// Schema para validação de criação de usuário
export const createUserSchema = z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    username: z.string().optional(),
    avatar: z.string().optional(),
    cover: z.string().optional(),
});

// Schema para validação de atualização de usuário
export const updateUserSchema = z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
    email: z.string().email("Email inválido").optional(),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
    username: z.string().optional(),
    avatar: z.string().optional(),
    cover: z.string().optional(),
    bio: z.string().optional(),
    birthdate: z.string().optional(),
});
