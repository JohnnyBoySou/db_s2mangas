import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

// Verificar se as variáveis de ambiente estão configuradas
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
  logger.warn('Configurações SMTP incompletas. Email pode não funcionar corretamente.');
}

const emailAdapter = nodemailer.createTransport({
  host: smtpHost || 'localhost',
  port: Number(smtpPort) || 587,
  secure: false, 
  auth: {
    user: smtpUser || '',
    pass: smtpPass || '',
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false, 
  },
});

export default emailAdapter