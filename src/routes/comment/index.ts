// routes/comment.ts
import { Router } from 'express';
import { create, list, update, remove } from '@/controllers/comment';
import { requireAuth } from '@/middlewares/auth';

const commentRouter = Router();

commentRouter.post('/', requireAuth, create);
commentRouter.get('/:mangaId', requireAuth, list);
commentRouter.put('/:id', requireAuth, update);
commentRouter.delete('/:id', requireAuth, remove);

export default commentRouter;
 