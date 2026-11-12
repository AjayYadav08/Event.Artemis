import { Router } from 'express';
import { invitationsController } from '../controllers/invitations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createInvitationSchema } from '../validators/invitations.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createInvitationSchema), invitationsController.create);
router.get('/received', invitationsController.listReceived);
router.post('/:id/accept', invitationsController.accept);
router.post('/:id/reject', invitationsController.reject);

export default router;

