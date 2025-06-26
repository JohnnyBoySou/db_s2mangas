import { Response } from 'express'
import { ZodError } from 'zod'

export function handleZodError(error: unknown, res: Response) {
  // Se for um erro do Zod
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.') || '(root)',
      message: err.message,
    }))
    return res.status(400).json({ errors: formattedErrors })
  }

  // Se for um erro customizado (Error comum)
  if (error instanceof Error) {
    return res.status(400).json({ error: error.message })
  }

  // Para outros tipos de erro
  return res.status(500).json({ error: 'Erro interno', details: error })
}
