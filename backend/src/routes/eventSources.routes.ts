import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { eventSourcesController } from '../controllers/eventSources.controller';
import {
  createEventSourceSchema,
  updateEventSourceSchema,
} from '../validators/eventSources.validator';

const router = Router();

router.use(authenticate, requireRole('ADMIN', 'ORGANIZER'));

router.get('/notifications', eventSourcesController.listNotifications);
router.get('/jobs/:jobId', eventSourcesController.getJobStatus);

router.post('/', validate(createEventSourceSchema), eventSourcesController.createSource);
router.get('/', eventSourcesController.listSources);
router.get('/:id', eventSourcesController.getSourceById);
router.patch('/:id', validate(updateEventSourceSchema), eventSourcesController.updateSource);
router.delete('/:id', eventSourcesController.deleteSource);

router.post('/:id/discover', eventSourcesController.discoverSource);
router.post('/:id/sync', eventSourcesController.syncSource);
router.get('/:id/discovered-events', eventSourcesController.getSourceDiscoveredEvents);
router.get('/:id/sync-history', eventSourcesController.getSourceSyncHistory);

export default router;

