import { Router } from 'express';
import { eventsController } from '../controllers/events.controller';
import { eventSourcesController } from '../controllers/eventSources.controller';
import {
  authenticate,
  optionalAuthenticate,
  requireRole,
} from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createEventSchema,
  updateEventSchema,
  queryEventsSchema,
} from '../validators/events.validator';

const router = Router();

router.get(
  '/',
  optionalAuthenticate,
  validate(queryEventsSchema),
  eventsController.list
);
router.get('/my/interested', authenticate, eventsController.getMyInterested);
router.get('/my/registered', authenticate, eventsController.getMyRegistered);
router.get('/:id', optionalAuthenticate, eventsController.getById);

router.post(
  '/',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  validate(createEventSchema),
  eventsController.create
);
router.patch(
  '/:id',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  validate(updateEventSchema),
  eventsController.update
);
router.delete(
  '/:id',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  eventsController.remove
);

router.post('/:id/interest', authenticate, eventsController.addInterest);
router.delete('/:id/interest', authenticate, eventsController.removeInterest);
router.post('/:id/register', authenticate, eventsController.registerForEvent);

router.get('/:id/sources', authenticate, requireRole('ADMIN', 'ORGANIZER'), eventSourcesController.getEventSources);
router.get('/:id/change-history', authenticate, requireRole('ADMIN', 'ORGANIZER'), eventSourcesController.getEventChangeHistory);

export default router;

