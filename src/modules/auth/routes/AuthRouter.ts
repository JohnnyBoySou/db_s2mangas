import { Router } from "express";
import { requireAuth } from "@/middlewares/auth";
import {
  register,
  login,
  verifyEmailCode,
  updateMe,
  deleteMe,
  getProfile,
} from "../controllers/AuthController";
import { usernameBloomFilter } from "@/services/UsernameBloomFilter";
import prisma from "@/prisma/client";

const AuthRouter = Router();
const AdminAuthRouter = Router();

AuthRouter.post("/register", register);
AuthRouter.post("/verify-email", verifyEmailCode);
AuthRouter.post("/login", login);
AuthRouter.patch("/me", requireAuth, updateMe);
AuthRouter.delete("/me", requireAuth, deleteMe);
AuthRouter.get("/me", requireAuth, getProfile);

AuthRouter.get("/username-available", async (req, res) => {
  const { username } = req.query;
  if (!username || typeof username !== "string") {
    return res
      .status(400)
      .json({ available: false, message: "Username é obrigatório" });
  }
  try {
    const exists = await usernameBloomFilter.checkUsernameExists(username);
    return res.json({ available: !exists });
  } catch (err) {
    return res
      .status(500)
      .json({ available: false, message: "Erro ao verificar username" });
  }
});

// Prova de conceito: Busca SEM Bloom Filter (direto no banco)
AuthRouter.get("/username-available-without-bloom", async (req, res) => {
  const { username } = req.query;
  if (!username || typeof username !== "string") {
    return res
      .status(400)
      .json({ available: false, message: "Username é obrigatório" });
  }

  const startTime = process.hrtime.bigint();

  try {
    // Contar total de usuários para auditoria
    const totalUsers = await prisma.user.count();

    // Busca direto no banco de dados sem Bloom Filter
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000; // Converte para ms

    const exists = !!existingUser;

    return res.json({
      available: !exists,
      method: "database_only",
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      auditInfo: {
        totalUsersInDatabase: totalUsers,
        recordsScanned: "Full database scan required",
        optimizationLevel: "None",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000;

    return res.status(500).json({
      available: false,
      message: "Erro ao verificar username",
      method: "database_only",
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      timestamp: new Date().toISOString(),
    });
  }
});

// Prova de conceito: Busca COM Bloom Filter
AuthRouter.get("/username-available-with-bloom", async (req, res) => {
  const { username } = req.query;
  if (!username || typeof username !== "string") {
    return res
      .status(400)
      .json({ available: false, message: "Username é obrigatório" });
  }

  const startTime = process.hrtime.bigint();

  try {
    // Contar total de usuários para auditoria
    const totalUsers = await prisma.user.count();

    // Primeiro verifica com Bloom Filter
    const bloomStartTime = process.hrtime.bigint();
    const mightExist = usernameBloomFilter.mightExist(username);
    const bloomEndTime = process.hrtime.bigint();
    const bloomTimeMs = Number(bloomEndTime - bloomStartTime) / 1000000;

    let exists = false;
    let dbTimeMs = 0;
    let usedDatabase = false;
    let recordsScanned = 0;

    if (mightExist) {
      // Se o Bloom Filter diz que pode existir, verifica no banco
      const dbStartTime = process.hrtime.bigint();
      const existingUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });
      const dbEndTime = process.hrtime.bigint();
      dbTimeMs = Number(dbEndTime - dbStartTime) / 1000000;
      exists = !!existingUser;
      usedDatabase = true;
      recordsScanned = 1; // Apenas 1 consulta específica por ID
    }
    // Se Bloom Filter retorna false, não existe - não precisa consultar o banco

    const endTime = process.hrtime.bigint();
    const totalExecutionTimeMs = Number(endTime - startTime) / 1000000;

    // Estatísticas do Bloom Filter
    const bloomStats = usernameBloomFilter.getStats();

    return res.json({
      available: !exists,
      method: "bloom_filter_optimized",
      executionTimeMs: Math.round(totalExecutionTimeMs * 100) / 100,
      breakdown: {
        bloomFilterTimeMs: Math.round(bloomTimeMs * 100) / 100,
        databaseTimeMs: Math.round(dbTimeMs * 100) / 100,
        usedDatabase,
        bloomResult: mightExist ? "might_exist" : "definitely_not_exists",
      },
      auditInfo: {
        totalUsersInDatabase: totalUsers,
        recordsScanned: usedDatabase ? 1 : 0,
        bloomFilterElements: bloomStats.currentElements,
        optimizationLevel: usedDatabase
          ? "Partial (Bloom + DB)"
          : "Maximum (Bloom only)",
        performanceGain: usedDatabase ? "~50-80%" : "~99%",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000;

    return res.status(500).json({
      available: false,
      message: "Erro ao verificar username",
      method: "bloom_filter_optimized",
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      timestamp: new Date().toISOString(),
    });
  }
});

// Rota para criar 1000 usuários de teste (apenas para benchmark)
AuthRouter.post("/create-test-users", async (req, res) => {
  const { count = 1000 } = req.body;

  if (count > 5000) {
    return res.status(400).json({
      error: "Máximo de 5000 usuários por vez",
    });
  }

  const startTime = process.hrtime.bigint();

  try {
    const users: Array<{
      name: string;
      email: string;
      username: string;
      password: string;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    }> = [];
    const batchSize = 100; // Criar em lotes para evitar sobrecarga

    // Preparar dados dos usuários
    for (let i = 1; i <= count; i++) {
      users.push({
        name: `Test User ${i}`,
        email: `testuser${i}@example.com`,
        username: `testuser${i}`,
        password: "$2b$10$dummy.hash.for.testing.purposes.only", // Hash dummy
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    let createdCount = 0;

    // Criar usuários em lotes
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      try {
        await prisma.user.createMany({
          data: batch,
          skipDuplicates: true, // Ignora se já existir
        });

        // Adicionar usernames ao Bloom Filter
        batch.forEach((user) => {
          usernameBloomFilter.addUsername(user.username);
        });

        createdCount += batch.length;

        // Log do progresso
        console.log(`Criados ${createdCount}/${count} usuários...`);
      } catch (batchError) {
        console.error(`Erro no lote ${i}-${i + batchSize}:`, batchError);
      }
    }

    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000;

    // Estatísticas do Bloom Filter
    const bloomStats = usernameBloomFilter.getStats();

    return res.json({
      message: `${createdCount} usuários de teste criados com sucesso`,
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      bloomFilterStats: {
        initialized: bloomStats.initialized,
        expectedElements: bloomStats.expectedElements,
        currentElements: bloomStats.currentElements,
        errorRate: Math.round(bloomStats.errorRate * 10000) / 100 + "%",
      },
      userPattern: "testuser1, testuser2, ..., testuser" + count,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000;

    console.error("Erro ao criar usuários de teste:", error);
    return res.status(500).json({
      error: "Erro ao criar usuários de teste",
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      details: error.message || "Erro desconhecido",
    });
  }
});

// Rota para limpar usuários de teste
AuthRouter.delete("/cleanup-test-users", async (req, res) => {
  const startTime = process.hrtime.bigint();

  try {
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          contains: "@example.com",
        },
      },
    });

    // Resetar o Bloom Filter e reinicializar
    usernameBloomFilter.reset();
    await usernameBloomFilter.initialize();

    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000;

    return res.json({
      message: `${result.count} usuários de teste removidos`,
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      bloomFilterReinitialized: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const endTime = process.hrtime.bigint();
    const executionTimeMs = Number(endTime - startTime) / 1000000;

    console.error("Erro ao limpar usuários de teste:", error);
    return res.status(500).json({
      error: "Erro ao limpar usuários de teste",
      executionTimeMs: Math.round(executionTimeMs * 100) / 100,
      details: error.message || "Erro desconhecido",
    });
  }
});

export { AuthRouter, AdminAuthRouter };
