import { RequestHandler } from "express";
import * as fileHandler from "../handlers/FilesHandler";
import { cleanOrphanFiles } from "@/utils/cleanOrphanFiles";
import { uploadFileSchema } from "../validators/FilesValidator";
import { handleZodError } from '@/utils/zodError';

export const uploadFile: RequestHandler = async (req, res) => {
  try {
    const validatedData = uploadFileSchema.parse(req.body);
    const file = await fileHandler.uploadFile(validatedData);
    res.status(201).json(file);
  } catch (error: any) {
    handleZodError(error, res);
    res.status(400).json({ error: error.message });
  }
};

export const getFileById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await fileHandler.getFileById(id);

    if (!file) {
      res.status(404).json({ error: "Arquivo não encontrado" });
      return;
    }

    res.json(file);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await fileHandler.deleteFile(id);
    res.status(204).send();
  } catch (error: any) {
    if (error.message === "Arquivo não encontrado") {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
};

export const cleanOrphanFilesEndpoint: RequestHandler = async (req, res) => {
  try {
    await cleanOrphanFiles();
    res
      .status(200)
      .json({ message: "Limpeza de arquivos órfãos concluída com sucesso" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
