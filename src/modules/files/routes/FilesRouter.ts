import { Router } from 'express';
import { uploadFile, getFileById, deleteFile } from '../controllers/FilesController';
import { requireAdmin, requireAuth } from '@/middlewares/auth';
import { cleanOrphanFiles } from '@/utils/cleanOrphanFiles';

const FileRouter = Router();
const AdminFileRouter = Router();

FileRouter.post('/upload', requireAuth, uploadFile);
FileRouter.get('/:id', requireAuth, getFileById);
FileRouter.delete('/:id', requireAuth, deleteFile);

AdminFileRouter.post('/clean-orphans', requireAuth, requireAdmin, cleanOrphanFiles);

export { FileRouter, AdminFileRouter }; 
