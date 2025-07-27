import { Router } from 'express';
import { listUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/UsersControllers';
import { requireAuth } from '@/middlewares/auth';
import { requireAdmin } from '@/middlewares/admin';

const AdminUsersRouter = Router();

AdminUsersRouter.get('/', requireAuth, requireAdmin, listUsers);
AdminUsersRouter.get('/:id', requireAuth, requireAdmin, getUserById);
AdminUsersRouter.post('/', requireAuth, requireAdmin, createUser);
AdminUsersRouter.put('/:id', requireAuth, requireAdmin, updateUser);
AdminUsersRouter.delete('/:id', requireAuth, requireAdmin, deleteUser);

export { AdminUsersRouter }; 