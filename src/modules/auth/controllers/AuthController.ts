import type { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import { updateUserSchema, loginSchema, registerSchema  } from "../validators/AuthSchema";
import * as authHandlers from "../handlers/AuthHandler";

type VerifyEmailBody = { email: string; code: string };

// ✅ Criação de usuário
export const register: RequestHandler = async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authHandlers.register(data);
        res.status(201).json(result);
    } catch (error: unknown) {
        console.log(error)
        handleZodError(error, res);
    }
};

// ✅ Verificar email do usuário
export const verifyEmailCode: RequestHandler<{}, any, VerifyEmailBody> = async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await authHandlers.verifyEmailCode(email, code);
        res.json(result);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// ✅ Login e token JWT
export const login: RequestHandler = async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authHandlers.login(data);
        res.status(200).json(result);
    } catch (error: unknown) {
        handleZodError(error, res);
    }
};

// ✅ Dados do usuário
export const getProfile: RequestHandler = async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const result = await authHandlers.getProfile(userId);
        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// ✅ Editar a propria conta do usuário
export const updateMe: RequestHandler = async (req, res) => {
    try {
        //TODO - ADICIONAR CATEGORIAS E LINGUAGENS
        const userId = req.user?.id;
        const data = updateUserSchema.parse(req.body);
        const result = await authHandlers.updateMe(userId as string, {
            name: data.name,
            email: data.email,
            username: data.username,
            avatar: data.avatar,
            cover: data.cover,
            bio: data.bio || undefined,
            birthdate: data.birthdate,
            //categories: data.categories?.map(({ id, name }) => ({ id, name: name ?? undefined })) || [],
            //languages: data.languages?.map(({ id, name, code  }) => ({ id, name: name ?? undefined, code })) || []
        });
        res.json(result);
    } catch (error: unknown) {
        console.error('Error updating user profile:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
};

// ✅ Deletar a propria conta do usuário
export const deleteMe: RequestHandler = async (req, res) => {
    try {
        const userId = (req as any).user?.id;
        const result = await authHandlers.deleteMe(userId);
        res.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};

// ✅ Login com Google
/*
export const googleSignIn: RequestHandler<{}, any, GoogleSignInBody> = async (req, res) => {
    console.log("google comecou")
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: "Token do Google é obrigatório" });
            return;
        }
        
        const result = await authHandlers.googleSignIn(token);
        res.status(200).json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(500).json({ error: errorMessage });
    }
};
*/