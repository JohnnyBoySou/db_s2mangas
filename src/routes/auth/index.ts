import { Router } from 'express'
import { register, login, verifyEmailCode, updateMe , deleteMe} from '@/controllers/auth'
import { forgotPassword, resetPassword, verifyResetCode, } from '@/controllers/auth/forgot_password'
import { requireAuth } from '@/middlewares/authMiddleware'

const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/verify-email', verifyEmailCode)
authRouter.post('/login', login)
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/verify-code', verifyResetCode)
authRouter.post('/reset-password', resetPassword);
authRouter.patch("/me", requireAuth, updateMe);
authRouter.delete("/me", requireAuth, deleteMe);

export default authRouter
