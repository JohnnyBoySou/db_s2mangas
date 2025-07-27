import prisma from '@/prisma/client';
import bcrypt from 'bcrypt';
import emailAdapter from '@/config/nodemailer';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const forgotPassword = async (email: string) => {
    if (!email) {
        throw new Error('Email é obrigatório');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new Error('Usuário não encontrado');
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetToken: otp,
            resetTokenExp: otpExpiresAt,
        },
    });

    await emailAdapter.sendMail({
        from: `"Seu App" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Código para redefinição de senha',
        html: `
            <p>Olá, ${user.name}</p>
            <p>Seu código para redefinir a senha é:</p>
            <h2>${otp}</h2>
            <p>O código é válido por 10 minutos.</p>
        `,
    });

    return { message: 'Código enviado para seu email' };
};

export const verifyResetCode = async (email: string, code: string) => {
    if (!email || !code) {
        throw new Error('Email e código são obrigatórios');
    }

    const user = await prisma.user.findFirst({
        where: {
            email,
            resetToken: code,
            resetTokenExp: { gte: new Date() },
        },
    });

    if (!user) {
        throw new Error('Código inválido ou expirado');
    }

    return { message: 'Código válido' };
};

export const resetPassword = async (email: string, code: string, newPassword: string) => {
    if (!email || !code || !newPassword) {
        throw new Error('Email, código e nova senha são obrigatórios');
    }

    const user = await prisma.user.findFirst({
        where: {
            email,
            resetToken: code,
            resetTokenExp: { gte: new Date() },
        },
    });

    if (!user) {
        throw new Error('Código inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExp: null,
        },
    });

    return { message: 'Senha atualizada com sucesso' };
}; 