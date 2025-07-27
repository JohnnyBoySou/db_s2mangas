import type { RequestHandler } from "express";
import { handleZodError } from "@/utils/zodError";
import * as categoryHandlers from "../handlers/CategoriesHandler";

export const create: RequestHandler = async (req, res) => {
    try {
        const category = await categoryHandlers.createCategory(req.body);
        res.status(201).json(category);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const list: RequestHandler = async (req, res) => {
    try {
        const categories = await categoryHandlers.listCategories();
        res.json(categories);
    } catch (error) {
        handleZodError(error, res);
    }
};

export const get: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await categoryHandlers.getCategoryById(id);
        res.json(category);
    } catch (error) {
        if (error instanceof Error && error.message === "Categoria não encontrada") {
            res.status(404).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
};

export const update: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const updated = await categoryHandlers.updateCategory(id, req.body);
        res.json(updated);
    } catch (error) {
        if (error instanceof Error && error.message === "Categoria não encontrada") {
            res.status(404).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
};

export const remove: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await categoryHandlers.deleteCategory(id);
        res.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "Categoria não encontrada") {
            res.status(404).json({ error: error.message });
        } else {
            handleZodError(error, res);
        }
    }
}; 