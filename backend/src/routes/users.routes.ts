import { Router } from 'express';
import { usersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { updateProfileSchema } from '../validators/users.validator';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.me);
router.patch('/me', validate(updateProfileSchema), usersController.updateMe);
router.post(
  '/me/avatar',
  uploadMiddleware.single('avatar'),
  usersController.uploadAvatar
);
router.get('/search', usersController.search);

export default router;

