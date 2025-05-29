import { ZodError } from 'zod'
import { Response } from 'express'

export function handleZodError(error: unknown, res: Response) {
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.') || '(root)',
      message: err.message,
    }))
    return res.status(400).json({ errors: formattedErrors })
  }

  return res.status(500).json({ error: 'Erro interno' })
}
