import prisma from '@/prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import emailAdapter from '@/config/nodemailer';
import { generateUsername } from '@/utils/generate';
import { RegisterBody, LoginBody } from '@/types/auth';
import { generateVerificationEmail, generateVerificationResendEmail } from '@/utils/emailTemplates';
import { usernameBloomFilter } from '@/services/UsernameBloomFilter';
//import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET;
//const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
//const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const register = async (data: RegisterBody) => {
    const { name, email, password, } = data;
    const normalizedEmail = email.toLowerCase();

    const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingEmail) {
        throw new Error("Email já cadastrado");
    }

    // Criar categorias se não existirem
    /*
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
*/
    // Criar idiomas se não existirem
    /*
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
*/
    const generatedUsername = generateUsername(name);
    let finalUsername = generatedUsername;

    let tries = 0;
    while (await usernameBloomFilter.checkUsernameExists(finalUsername)) {
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
            username: finalUsername,
            password: hashedPassword,
            emailVerificationCode: verificationCode,
            emailVerificationExp: codeExp,
            emailVerified: false,
        },
    });

    // Add the new username to the Bloom Filter
    usernameBloomFilter.addUsername(finalUsername);

    const emailHtml = generateVerificationEmail({
        userName: user.name,
        verificationCode: verificationCode
    });

    await emailAdapter.sendMail({
        from: `"S2Mangás" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Verificação de Email - S2Mangás',
        html: emailHtml,
    });

    return { message: "Usuário criado. Verifique seu email com o código enviado." };
};

export const verifyEmailCode = async (email: string, code: string) => {
    if (!email || !code) {
        throw new Error("Email e código são obrigatórios");
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
        throw new Error("Usuário não encontrado ou já verificado");
    }

    if (
        user.emailVerificationCode !== code ||
        !user.emailVerificationExp ||
        user.emailVerificationExp < new Date()
    ) {
        throw new Error("Código inválido ou expirado");
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            emailVerificationCode: null,
            emailVerificationExp: null,
        },
    });

    return { message: "Email verificado com sucesso" };
};

export const login = async (data: LoginBody) => {
    const { email, password } = data;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        throw new Error("Credenciais inválidas");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        throw new Error("Credenciais inválidas");
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

        const emailHtml = generateVerificationResendEmail({
            userName: user.name,
            verificationCode: verificationCode
        });

        await emailAdapter.sendMail({
            from: `"S2Mangás" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Reenvio de Código de Verificação - S2Mangás',
            html: emailHtml,
        });

        throw new Error("Email não verificado. Código de verificação reenviado.");
    }

    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "15d" });
    return { token, user };
};

export const getProfile = async (userId: string) => {
    if (!userId) {
        throw new Error("Não autorizado");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, username: true, bio: true, createdAt: true, birthdate: true, categories: true, languages: true, cover: true, avatar: true, coins: true },
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    return user;
};

export const updateMe = async (userId: string, data: {
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    cover?: string;
    bio?: string;
    birthdate?: Date;
    categories?: Array<{ id: string; name: string }>;
    languages?: Array<{ id: string; name: string }>;
}) => {
    if (Object.keys(data).length === 0) {
        throw new Error("Nada para atualizar");
    }

    if (data.username) {
        const usernameExists = await usernameBloomFilter.checkUsernameExists(data.username);
        if (usernameExists) {
            const existing = await prisma.user.findUnique({ where: { username: data.username } });
            if (existing && existing.id !== userId) {
                throw new Error("Username já está em uso");
            }
        }
    }

    const { categories, languages, ...userData } = data;
    const updateData: any = { ...userData };

    // Se houver categorias, atualiza a relação
    if (categories) {
        // Remove duplicatas e mantém apenas os IDs únicos
        const uniqueCategoryIds = [...new Set(categories.map((cat: { id: string }) => cat.id))];
        
        // Primeiro verifica se todas as categorias existem
        const existingCategories = await prisma.category.findMany({
            where: { id: { in: uniqueCategoryIds } }
        });

        if (existingCategories.length !== uniqueCategoryIds.length) {
            throw new Error("Uma ou mais categorias não foram encontradas");
        }

        updateData.categories = {
            set: uniqueCategoryIds.map(id => ({ id }))
        };
    }

    // Se houver idiomas, atualiza a relação
    if (languages) {
        // Remove duplicatas e mantém apenas os IDs únicos
        const uniqueLanguageIds = [...new Set(languages.map((lang: { id: string }) => lang.id))];
        
        // Primeiro verifica se todos os idiomas existem
        const existingLanguages = await prisma.language.findMany({
            where: { id: { in: uniqueLanguageIds } }
        });

        if (existingLanguages.length !== uniqueLanguageIds.length) {
            throw new Error("Um ou mais idiomas não foram encontrados");
        }

        updateData.languages = {
            set: uniqueLanguageIds.map(id => ({ id }))
        };
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            name: true,
            username: true,
            birthdate: true,
            bio: true,
            avatar: true,
            cover: true,
            categories: {
                select: {
                    id: true,
                    name: true
                }
            },
            languages: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    // Add the new username to the Bloom Filter if it was updated
    if (data.username && updatedUser.username) {
        usernameBloomFilter.addUsername(updatedUser.username);
    }

    return updatedUser;
};

export const deleteMe = async (userId: string) => {
    if (!userId) {
        throw new Error("ID do usuário não encontrado no token");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    await prisma.user.delete({ where: { id: userId } });
    return { message: "Conta deletada com sucesso" };
};

/*
export const googleSignIn = async (token: string) => {
    if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_CLIENT_ID não configurado");
    
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        if (!payload) throw new Error("Token inválido");

        const { email, name, picture } = payload;
        if (!email) throw new Error("Email não encontrado no token");

        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Criar novo usuário se não existir
            const generatedUsername = generateUsername(name || 'user');
            let finalUsername = generatedUsername;

            let tries = 0;
            while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
                tries++;
                finalUsername = `${generatedUsername}_${tries}`;
            }

            user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    name: name || 'Usuário Google',
                    username: finalUsername,
                    avatar: picture,
                    emailVerified: true,
                    password: '', // Usuários do Google não precisam de senha
                }
            });
        }

        if (!JWT_SECRET) throw new Error("JWT_SECRET não configurado");
        const jwtToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "15d" });

        const { password, ...userWithoutPassword } = user;
        return { token: jwtToken, user: userWithoutPassword };
    } catch (error) {
        console.error('Erro na autenticação Google:', error);
        throw new Error("Falha na autenticação com Google");
    }
};
*/