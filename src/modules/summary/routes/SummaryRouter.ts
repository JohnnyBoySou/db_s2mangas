import { Router } from 'express';
import { postSummary } from '../controllers/SummaryControllers';
import multer from 'multer';

const SummaryRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

SummaryRouter.post('/summary', upload.array('pages', 100), postSummary);

export { SummaryRouter };
