import type { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import emailAdapter from '@/config/nodemailer';
import prisma from '@/prisma/client';

type ForgotPasswordBody = { email: string };
type ResetPasswordBody = { email: string; code: string; newPassword: string };
type VerifyCodeBody = { email: string; code: string };

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); 
}

export const forgotPassword: RequestHandler<{}, any, ForgotPasswordBody> = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email é obrigatório' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
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

  res.json({ message: 'Código enviado para seu email' });
};

export const verifyResetCode: RequestHandler<{}, any, VerifyCodeBody> = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400).json({ error: 'Email e código são obrigatórios' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      resetToken: code,
      resetTokenExp: { gte: new Date() },
    },
  });

  if (!user) {
    res.status(400).json({ error: 'Código inválido ou expirado' });
    return;
  }

  res.json({ message: 'Código válido' });
};

export const resetPassword: RequestHandler<{}, any, ResetPasswordBody> = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    res.status(400).json({ error: 'Email, código e nova senha são obrigatórios' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      resetToken: code,
      resetTokenExp: { gte: new Date() },
    },
  });

  if (!user) {
    res.status(400).json({ error: 'Código inválido ou expirado' });
    return;
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

  res.json({ message: 'Senha atualizada com sucesso' });
};