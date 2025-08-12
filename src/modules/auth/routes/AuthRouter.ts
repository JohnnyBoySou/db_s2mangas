import { Router } from 'express'
import { requireAuth } from '@/middlewares/auth'
import { register, login, verifyEmailCode, updateMe, deleteMe, getProfile} from '../controllers/AuthController'

const AuthRouter = Router()
const AdminAuthRouter = Router()

AuthRouter.post('/register', register)
AuthRouter.post('/verify-email', verifyEmailCode)
AuthRouter.post('/login', login)
AuthRouter.patch("/me", requireAuth, updateMe);
AuthRouter.delete("/me", requireAuth, deleteMe);
AuthRouter.get("/me", requireAuth, getProfile);

export { AuthRouter, AdminAuthRouter }
