import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  email: z.string().email().optional(),
  birthdate: z
    .union([
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }),
      z.date(),
    ])
    .optional()
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  bio: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional(),
  cover: z.string().url().optional(),
  categories: z
    .array(
      z.union([
        z.string().uuid(),
        z.object({
          id: z.string().uuid(),
          name: z.string(),
        }),
      ])
    )
    .optional()
    .transform((cats) =>
      cats?.map((cat) => (typeof cat === "string" ? { id: cat } : cat))
    ),
  languages: z
    .array(
      z.union([
        z.string().uuid(),
        z.object({
          id: z.string().uuid(),
          code: z.string(),
          name: z.string(),
        }),
      ])
    )
    .optional()
    .transform((langs) =>
      langs?.map((lang) => (typeof lang === "string" ? { id: lang } : lang))
    ),
});

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

export const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido')
});

export const verifyCodeSchema = z.object({
    email: z.string().email('Email inválido'),
    code: z.string().min(1, 'Código é obrigatório')
});

export const resetPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
    code: z.string().min(1, 'Código é obrigatório'),
    newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres')
});