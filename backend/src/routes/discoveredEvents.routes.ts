import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { eventSourcesController } from '../controllers/eventSources.controller';
import {
  bulkApproveDiscoveredEventsSchema,
  rejectDiscoveredEventSchema,
  updateDiscoveredEventSchema,
} from '../validators/eventSources.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'ORGANIZER'));

router.get('/', eventSourcesController.listDiscoveredEvents);
router.post(
  '/bulk-approve',
  validate(bulkApproveDiscoveredEventsSchema),
  eventSourcesController.bulkApproveDiscoveredEvents
);
router.get('/:id', eventSourcesController.getDiscoveredEventById);
router.patch('/:id', validate(updateDiscoveredEventSchema), eventSourcesController.updateDiscoveredEvent);
router.post('/:id/approve', eventSourcesController.approveDiscoveredEvent);
router.post('/:id/reject', validate(rejectDiscoveredEventSchema), eventSourcesController.rejectDiscoveredEvent);

export default router;

