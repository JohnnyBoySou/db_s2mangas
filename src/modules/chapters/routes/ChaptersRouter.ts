import { Router } from 'express';
import { list, getPages } from '../controllers/ChaptersController';

const ChaptersRouter = Router();
ChaptersRouter.get('/manga/:id', list);
ChaptersRouter.get('/:chapterID/pages', getPages);

export { ChaptersRouter }; 