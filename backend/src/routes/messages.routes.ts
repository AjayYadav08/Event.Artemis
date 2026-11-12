import { Router } from 'express';
import { messagesController } from '../controllers/messages.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  queryMessagesSchema,
  sendMessageSchema,
  deleteMessageSchema,
} from '../validators/messages.validator';

const router = Router();

router.use(authenticate);

router.get('/team/:teamId', validate(queryMessagesSchema), messagesController.list);
router.post('/team/:teamId', validate(sendMessageSchema), messagesController.send);
router.delete('/:messageId', validate(deleteMessageSchema), messagesController.remove);

export default router;

