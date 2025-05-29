import { z } from "zod";

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
  birthdate: z
    .union([z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Data inválida" }), z.date()])
    .optional()
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  bio: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  cover: z.string().url().optional().nullable(),
});

