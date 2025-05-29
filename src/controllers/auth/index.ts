import type { RequestHandler } from "express";
import prisma from "@/prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema, registerSchema } from "@/schemas/authSchemas";
import { handleZodError } from "@/utils/zodError";
import { RegisterBody, LoginBody } from "@/types/auth";
import emailAdapter from "@/config/nodemailer";
import { updateUserSchema } from "@/schemas/updateSchemas";
import { generateUsername } from "@/utils/generate";

const JWT_SECRET = process.env.JWT_SECRET;

type VerifyEmailBody = { email: string; code: string };

// ✅ Criação de usuário
export const register: RequestHandler<{}, any, RegisterBody> = async (req, res) => {
  try {
    const { name, email, password, avatar, cover, categories, languages } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingEmail) {
      res.status(409).json({ error: "Email já cadastrado" });
      return 
    }

    // Criar categorias se não existirem
    const categoryConnections = await Promise.all(categories.map(async cat => {
      try {
        const existingCategory = await prisma.category.findUnique({
          where: { name: cat.name }
        });

        if (existingCategory) {
          return { id: existingCategory.id };
        }

        const newCategory = await prisma.category.create({
          data: { name: cat.name }
        });

        return { id: newCategory.id };
      } catch (error) {
        console.error('Erro ao criar categoria:', error);
        // Se falhar ao criar, tenta buscar novamente
        const category = await prisma.category.findUnique({
          where: { name: cat.name }
        });
        if (category) {
          return { id: category.id };
        }
        throw error;
      }
    }));

    // Criar idiomas se não existirem
    const languageConnections = await Promise.all(languages.map(async lang => {
      try {
        const existingLanguage = await prisma.language.findUnique({
          where: { code: lang }
        });

        if (existingLanguage) {
          return { code: existingLanguage.code };
        }

        const newLanguage = await prisma.language.create({
          data: { code: lang, name: lang }
        });

        return { code: newLanguage.code };
      } catch (error) {
        console.error('Erro ao criar idioma:', error);
        // Se falhar ao criar, tenta buscar novamente
        const language = await prisma.language.findUnique({
          where: { code: lang }
        });
        if (language) {
          return { code: language.code };
        }
        throw error;
      }
    }));

    const generatedUsername = generateUsername(name);
    let finalUsername = generatedUsername;

    let tries = 0;
    while (await prisma.user.findUnique({ where: { username: generatedUsername } })) {
      tries++;
      finalUsername = `${generatedUsername}_${tries}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExp = new Date(Date.now() + 1000 * 60 * 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        avatar,
        cover,
        username: finalUsername,
        password: hashedPassword,
        emailVerificationCode: verificationCode,
        emailVerificationExp: codeExp,
        emailVerified: false,
        languages: {
          connect: languageConnections
        },
        categories: {
          connect: categoryConnections
        }
      },
    });

    await emailAdapter.sendMail({
      from: `"Seu App" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Código de Verificação de Email',
      html: `
        <p>Olá, ${user.name}</p>
        <p>Seu código de verificação é:</p>
        <h2>${verificationCode}</h2>
        <p>O código é válido por 10 minutos.</p>
      `,
    });

    res.status(201).json({ message: "Usuário criado. Verifique seu email com o código enviado." });
  } catch (error: unknown) {
    console.log(error)
    handleZodError(error, res);
  }
};

// ✅ Verificar email do usuário
export const verifyEmailCode: RequestHandler<{}, any, VerifyEmailBody> = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ error: "Email e código são obrigatórios" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) {
    res.status(400).json({ error: "Usuário não encontrado ou já verificado" });
    return;
  }

  if (
    user.emailVerificationCode !== code ||
    !user.emailVerificationExp ||
    user.emailVerificationExp < new Date()
  ) {
    res.status(400).json({ error: "Código inválido ou expirado" });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationExp: null,
    },
  });

  res.json({ message: "Email verificado com sucesso" });
};

// ✅ Login e token JWT
export const login: RequestHandler<{}, any, LoginBody> = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: "Credenciais inválidas" });
      return;
    }

   
    if (!user.emailVerified) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExp = new Date(Date.now() + 1000 * 60 * 10); // 10 minutos

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: verificationCode,
          emailVerificationExp: codeExp,
        },
      });

      await emailAdapter.sendMail({
        from: `"Seu App" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Código de Verificação de Email - Reenvio',
        html: `
          <p>Olá, ${user.name}</p>
          <p>Você ainda não verificou seu email. Aqui está seu código de verificação:</p>
          <h2>${verificationCode}</h2>
          <p>O código é válido por 10 minutos.</p>
        `,
      });

      res.status(403).json({ error: "Email não verificado. Código de verificação reenviado." });
      return;
    }

    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "15d" });

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ token, user: userWithoutPassword });
  } catch (error: unknown) {
    handleZodError(error, res);
  }
}

// ✅ Dados do usuário
export const getProfile: RequestHandler = async (req, res) => {
  const userId = (req as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Não autorizado" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, username: true },
    });

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    res.json(user);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    res.status(500).json({ error: errorMessage });
  }
}

// ✅ Editar a propria conta do usuário
export const updateMe: RequestHandler = async (req, res) => {
  const userId = (req as any).user.id;
  try {
    const data = updateUserSchema.parse(req.body);

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "Nada para atualizar" });
      return 
    }

    if (data.username) {
      const existing = await prisma.user.findUnique({ where: { username: data.username } });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: "Username já está em uso" });
        return 
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        birthdate: true,
        bio: true,
        avatar: true,
        cover: true,
      },
    });

    res.json({ message: "Dados atualizados com sucesso", user: updatedUser });
  } catch (error) {
     handleZodError(error, res)
  }
};

// ✅ Deletar a propria conta do usuário
export const deleteMe: RequestHandler = async (req, res) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    res.status(400).json({ error: "ID do usuário não encontrado no token" });
    return 
  }
  
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return 
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Conta deletada com sucesso" });
  } catch {
    res.status(500).json({ error: "Erro ao deletar conta" });
  }
};