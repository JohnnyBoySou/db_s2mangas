import type { RequestHandler } from 'express';
import { handleZodError } from '@/utils/zodError';
import * as forgotPasswordHandlers from '../handlers/ForgotPasswordHandler';
import { resetPasswordSchema, forgotPasswordSchema, verifyCodeSchema } from '../validators/AuthSchema';

type ForgotPasswordBody = { email: string };
type ResetPasswordBody = { email: string; code: string; newPassword: string };
type VerifyCodeBody = { email: string; code: string };

export const forgotPassword: RequestHandler<{}, any, ForgotPasswordBody> = async (req, res) => {
    try {
        const validatedData = forgotPasswordSchema.parse(req.body);
        const result = await forgotPasswordHandlers.forgotPassword(validatedData.email);
        res.json(result);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const verifyResetCode: RequestHandler<{}, any, VerifyCodeBody> = async (req, res) => {
    try {
        const validatedData = verifyCodeSchema.parse(req.body);
        const result = await forgotPasswordHandlers.verifyResetCode(validatedData.email, validatedData.code);
        res.json(result);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const resetPassword: RequestHandler<{}, any, ResetPasswordBody> = async (req, res) => {
    try {
        const validatedData = resetPasswordSchema.parse(req.body);
        const result = await forgotPasswordHandlers.resetPassword(validatedData.email, validatedData.code, validatedData.newPassword);
        res.json(result);
    } catch (error) {
        handleZodError(error, res);
    }
};