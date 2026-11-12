import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import eventsRoutes from './events.routes';
import teamsRoutes from './teams.routes';
import teamRequestsRoutes from './teamRequests.routes';
import invitationsRoutes from './invitations.routes';
import messagesRoutes from './messages.routes';
import attachmentsRoutes from './attachments.routes';
import eventSourcesRoutes from './eventSources.routes';
import discoveredEventsRoutes from './discoveredEvents.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/events', eventsRoutes);
router.use('/teams', teamsRoutes);
router.use('/team-requests', teamRequestsRoutes);
router.use('/invitations', invitationsRoutes);
router.use('/messages', messagesRoutes);
router.use('/attachments', attachmentsRoutes);
router.use('/event-sources', eventSourcesRoutes);
router.use('/discovered-events', discoveredEventsRoutes);

export default router;

