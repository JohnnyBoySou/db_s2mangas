import { Router } from 'express';
import { list, getPages } from '../controllers/ChaptersController';

const ChaptersRouter = Router();
ChaptersRouter.get('/:id', list);
ChaptersRouter.get('/:id/pages', getPages);

export { ChaptersRouter }; 