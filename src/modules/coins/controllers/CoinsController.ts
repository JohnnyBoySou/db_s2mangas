import { RequestHandler } from "express";
import { addCoins, removeCoins, getCoins } from "../handlers/CoinsHandler";

/**
 * @swagger
 * components:
 *   schemas:
 *     UserCoins:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: ID único do usuário
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *         coins:
 *           type: number
 *           description: Quantidade de coins do usuário
 *           example: 150
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Mensagem de erro
 *           example: "Saldo insuficiente de coins"
 */

/**
 * @swagger
 * /coins:
 *   get:
 *     summary: Obter saldo de coins do usuário
 *     description: Retorna o saldo atual de coins do usuário autenticado
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo de coins retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCoins'
 *       400:
 *         description: Erro ao buscar saldo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /coins/add:
 *   post:
 *     summary: Adicionar coins ao usuário
 *     description: Adiciona 30 coins ao saldo do usuário autenticado
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coins adicionados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCoins'
 *       400:
 *         description: Erro ao adicionar coins
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /coins/remove:
 *   post:
 *     summary: Remover coins do usuário
 *     description: Remove 15 coins do saldo do usuário autenticado (se houver saldo suficiente)
 *     tags: [Coins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coins removidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCoins'
 *       400:
 *         description: Erro ao remover coins (saldo insuficiente ou usuário não encontrado)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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
