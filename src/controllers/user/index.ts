import type { RequestHandler } from "express";
import * as userHandlers from "@/handlers/user";
import { handleZodError } from "@/utils/zodError";
import { z } from "zod";

// Schema para validação de criação de usuário
const createUserSchema = z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    username: z.string().optional(),
    avatar: z.string().optional(),
    cover: z.string().optional(),
});

// Schema para validação de atualização de usuário
const updateUserSchema = z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
    email: z.string().email("Email inválido").optional(),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
    username: z.string().optional(),
    avatar: z.string().optional(),
    cover: z.string().optional(),
    bio: z.string().optional(),
    birthdate: z.string().optional(),
});

// Listar todos os usuários
export const listUsers: RequestHandler = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        
        const result = await userHandlers.listUsers(page, limit);
        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// Buscar usuário por ID
export const getUserById: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userHandlers.getUserById(id);
        res.json(user);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// Criar novo usuário
export const createUser: RequestHandler = async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);
        const user = await userHandlers.createUser(data);
        res.status(201).json(user);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// Atualizar usuário
export const updateUser: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        
        const updateData = {
            ...data,
            birthdate: data.birthdate ? new Date(data.birthdate) : undefined
        };
        
        const user = await userHandlers.updateUser(id, updateData);
        res.json(user);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// Deletar usuário
export const deleteUser: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await userHandlers.deleteUser(id);
        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
}; 