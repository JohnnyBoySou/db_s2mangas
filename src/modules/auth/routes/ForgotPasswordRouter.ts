import { Router } from 'express'
import { forgotPassword, resetPassword, verifyResetCode, } from '../controllers/ForgotPasswordController'

const ForgotPasswordRouter = Router()

ForgotPasswordRouter.post('/', forgotPassword);
ForgotPasswordRouter.post('/verify-code', verifyResetCode)
ForgotPasswordRouter.post('/reset-password', resetPassword);
//ForgotPasswordRouter.post('/send-code', )

export { ForgotPasswordRouter }
