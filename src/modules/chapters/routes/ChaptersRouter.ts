import { Router } from 'express';
import  { ChapterController } from '../controllers/ChaptersController';
import { requireAuth } from '@/middlewares/auth';

const ChaptersRouter = Router();

ChaptersRouter.use(requireAuth)

ChaptersRouter.get('/:id', ChapterController.list);
ChaptersRouter.get('/:id/pages', ChapterController.pages);

export { ChaptersRouter }; 