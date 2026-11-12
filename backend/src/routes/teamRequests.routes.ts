import { Router } from 'express';
import { teamRequestsController } from '../controllers/teamRequests.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createJoinRequestSchema } from '../validators/teamRequests.validator';

const router = Router();

router.use(authenticate);

router.post('/', validate(createJoinRequestSchema), teamRequestsController.create);
router.get('/my', teamRequestsController.listMine);
router.get('/team/:teamId', teamRequestsController.listByTeam);
router.post('/:id/accept', teamRequestsController.accept);
router.post('/:id/reject', teamRequestsController.reject);

export default router;

