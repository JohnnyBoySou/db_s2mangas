import type { RequestHandler } from 'express';
import * as forgotPasswordHandlers from '@/handlers/auth/forgot_password';

type ForgotPasswordBody = { email: string };
type ResetPasswordBody = { email: string; code: string; newPassword: string };
type VerifyCodeBody = { email: string; code: string };

export const forgotPassword: RequestHandler<{}, any, ForgotPasswordBody> = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await forgotPasswordHandlers.forgotPassword(email);
        res.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(400).json({ error: errorMessage });
    }
};

export const verifyResetCode: RequestHandler<{}, any, VerifyCodeBody> = async (req, res) => {
    try {
        const { email, code } = req.body;
        const result = await forgotPasswordHandlers.verifyResetCode(email, code);
        res.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(400).json({ error: errorMessage });
    }
};

export const resetPassword: RequestHandler<{}, any, ResetPasswordBody> = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        const result = await forgotPasswordHandlers.resetPassword(email, code, newPassword);
        res.json(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro interno";
        res.status(400).json({ error: errorMessage });
    }
};