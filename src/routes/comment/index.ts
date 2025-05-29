// routes/comment.ts
import { Router } from 'express';
import {
  createComment,
  listCommentsByManga,
  updateComment,
  deleteComment,
} from '@/controllers/comment';
import { requireAuth } from '@/middlewares/authMiddleware';

const commentRouter = Router();

commentRouter.post('/', requireAuth, createComment);
commentRouter.get('/:mangaId', requireAuth,listCommentsByManga);
commentRouter.patch('/:id', requireAuth, updateComment);
commentRouter.delete('/:id', requireAuth, deleteComment);

export default commentRouter;
