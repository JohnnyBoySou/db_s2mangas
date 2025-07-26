// routes/comment.ts
import { Router } from 'express';
import { create, list, update, remove } from '@/controllers/comment';
import { requireAuth } from '@/middlewares/auth';

const CommentRouter = Router();

CommentRouter.post('/', requireAuth, create);
CommentRouter.get('/:mangaId', requireAuth, list);
CommentRouter.put('/:id', requireAuth, update);
CommentRouter.delete('/:id', requireAuth, remove);

export { CommentRouter };
 