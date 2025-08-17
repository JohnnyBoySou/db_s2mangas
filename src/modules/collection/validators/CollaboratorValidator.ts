import { z } from "zod";

export const addCollaboratorSchema = z.object({
  collectionId: z.string().uuid("ID da coleção deve ser um UUID válido"),
  userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
  role: z.enum(["EDITOR", "ADMIN"]).default("EDITOR"),
});

export const removeCollaboratorSchema = z.object({
  collectionId: z.string().uuid("ID da coleção deve ser um UUID válido"),
  userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
});

export const updateCollaboratorRoleSchema = z.object({
  collectionId: z.string().uuid("ID da coleção deve ser um UUID válido"),
  userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
  role: z.enum(["EDITOR", "ADMIN"]),
});

export const listCollaboratorsSchema = z.object({
  collectionId: z.string().uuid("ID da coleção deve ser um UUID válido"),
});

export const collectionIdParamSchema = z.object({
  id: z.string().uuid("ID da coleção deve ser um UUID válido"),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid("ID do usuário deve ser um UUID válido"),
});
