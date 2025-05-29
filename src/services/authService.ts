import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '@/prisma/client';

const JWT_SECRET = process.env.JWT_SECRET ?? 'default_secret'

export async function signup(name: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })
  return user
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Usuário não encontrado')

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) throw new Error('Senha inválida')

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '1h',
  })

  return { user, token }
}
