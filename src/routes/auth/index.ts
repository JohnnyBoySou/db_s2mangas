import { Router } from 'express'
import { register, login, verifyEmailCode, updateMe, deleteMe, getProfile} from '@/controllers/auth'
import { forgotPassword, resetPassword, verifyResetCode, } from '@/controllers/auth/forgot_password'
import { requireAuth } from '@/middlewares/auth'

const AuthRouter = Router()
const AdminAuthRouter = Router()


AuthRouter.post('/register', register)
AuthRouter.post('/verify-email', verifyEmailCode)
AuthRouter.post('/login', login)
AuthRouter.post('/forgot-password', forgotPassword);
AuthRouter.post('/verify-code', verifyResetCode)
AuthRouter.post('/reset-password', resetPassword);
AuthRouter.patch("/me", requireAuth, updateMe);
AuthRouter.delete("/me", requireAuth, deleteMe);
AuthRouter.get("/me", requireAuth, getProfile);

export { AuthRouter, AdminAuthRouter }
