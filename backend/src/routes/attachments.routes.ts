import { Router } from 'express';
import { attachmentsController } from '../controllers/attachments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

router.get('/public/:key', attachmentsController.getPublicAvatar);
router.post(
  '/upload',
  authenticate,
  uploadMiddleware.single('file'),
  attachmentsController.upload
);
router.get('/:id/download', authenticate, attachmentsController.download);

export default router;

