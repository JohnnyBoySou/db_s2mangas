import { Router } from 'express';
import { list, getPages } from '../../controllers/chapters/index';

const chaptersRouter = Router();
chaptersRouter.get('/manga/:id', list);
chaptersRouter.get('/:chapterID/pages', getPages);

export default chaptersRouter; 