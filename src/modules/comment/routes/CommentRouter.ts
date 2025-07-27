import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth';
import { create, list, update, remove } from '../controllers/CommentController';

const CommentRouter = Router();

CommentRouter.post('/', requireAuth, create);
CommentRouter.get('/:mangaId', requireAuth, list);
CommentRouter.put('/:id', requireAuth, update);
CommentRouter.delete('/:id', requireAuth, remove);

export { CommentRouter };
 