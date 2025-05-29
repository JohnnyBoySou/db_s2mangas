import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
});

export const registerSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
  avatar: z.string().min(1, { message: 'Avatar é obrigatório' }),
  cover: z.string().min(1, { message: 'Cover é obrigatório' }),
  languages: z.array(z.string()),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string()
  }))
});

