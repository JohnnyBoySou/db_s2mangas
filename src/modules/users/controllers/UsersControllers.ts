import type { RequestHandler } from "express";
import * as userHandlers from "@/handlers/user";
import { handleZodError } from "@/utils/zodError";
import { createUserSchema, updateUserSchema } from "../validators/UsersValidator";
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