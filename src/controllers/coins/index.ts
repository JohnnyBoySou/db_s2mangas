import { RequestHandler } from "express";
import { addCoins, removeCoins, getCoins } from "../../handlers/coins";

export const add: RequestHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await addCoins(userId!);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const remove: RequestHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await removeCoins(userId!);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const get: RequestHandler = async (req, res) => {
    try {
        const userId = req.user?.id;
        const user = await getCoins(userId!);
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
