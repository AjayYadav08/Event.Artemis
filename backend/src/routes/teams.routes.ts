import { Router } from 'express';
import { teamsController } from '../controllers/teams.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTeamSchema,
  updateTeamSchema,
  updateMemberRoleSchema,
  rateMemberSchema,
} from '../validators/teams.validator';

const router = Router();

router.use(authenticate);

router.get('/', teamsController.listAvailable);
router.get('/my', teamsController.listMine);
router.post('/', validate(createTeamSchema), teamsController.create);
router.get('/:id', teamsController.getById);
router.patch('/:id', validate(updateTeamSchema), teamsController.update);
router.delete('/:id', teamsController.remove);
router.post('/:id/leave', teamsController.leave);
router.delete('/:id/members/:userId', teamsController.removeMember);
router.patch(
  '/:id/members/:userId/role',
  validate(updateMemberRoleSchema),
  teamsController.updateMemberRole
);
router.post(
  '/:id/members/:userId/rate',
  validate(rateMemberSchema),
  teamsController.rateMember
);

export default router;

