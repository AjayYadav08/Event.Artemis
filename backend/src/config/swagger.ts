import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Event Artemis API',
      version: '1.0.0',
      description:
        'Production REST API for Event Artemis — campus events, team formation, real-time team chat, and file attachments.',
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api/v1`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user account',
          responses: { 201: { description: 'Registered' }, 409: { description: 'Email exists' } },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          responses: { 200: { description: 'Logged in' }, 401: { description: 'Invalid credentials' } },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Rotate refresh token and obtain new access token',
          responses: { 200: { description: 'Refreshed' }, 401: { description: 'Unauthorized' } },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Revoke refresh token and clear cookie',
          responses: { 200: { description: 'Logged out' } },
        },
      },
      '/users/me': {
        get: {
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          summary: 'Get current authenticated user profile',
          responses: { 200: { description: 'User profile' } },
        },
        patch: {
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          summary: 'Update current user profile',
          responses: { 200: { description: 'Updated profile' } },
        },
      },
      '/events': {
        get: {
          tags: ['Events'],
          summary: 'List, search, filter, and paginate events',
          responses: { 200: { description: 'Paginated events list' } },
        },
        post: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: 'Create a new event (Organizer/Admin)',
          responses: { 201: { description: 'Event created' } },
        },
      },
      '/events/{id}/interest': {
        post: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: 'Mark event as interested',
          responses: { 200: { description: 'Marked interested' } },
        },
        delete: {
          tags: ['Events'],
          security: [{ bearerAuth: [] }],
          summary: 'Remove event interest',
          responses: { 200: { description: 'Interest removed' } },
        },
      },
      '/teams': {
        get: {
          tags: ['Teams'],
          security: [{ bearerAuth: [] }],
          summary: 'Discover available teams',
          responses: { 200: { description: 'Teams list' } },
        },
        post: {
          tags: ['Teams'],
          security: [{ bearerAuth: [] }],
          summary: 'Create a new team',
          responses: { 201: { description: 'Team created' } },
        },
      },
      '/team-requests': {
        post: {
          tags: ['Team Requests'],
          security: [{ bearerAuth: [] }],
          summary: 'Submit a join request to a team',
          responses: { 201: { description: 'Request submitted' } },
        },
      },
      '/invitations': {
        post: {
          tags: ['Invitations'],
          security: [{ bearerAuth: [] }],
          summary: 'Invite a user to a team',
          responses: { 201: { description: 'Invitation sent' } },
        },
      },
      '/messages/team/{teamId}': {
        get: {
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          summary: 'Get paginated team chat history',
          responses: { 200: { description: 'Chat messages' } },
        },
        post: {
          tags: ['Messages'],
          security: [{ bearerAuth: [] }],
          summary: 'Send a message to a team chat',
          responses: { 201: { description: 'Message sent' } },
        },
      },
      '/attachments/upload': {
        post: {
          tags: ['Attachments'],
          security: [{ bearerAuth: [] }],
          summary: 'Upload an image, PDF, or audio attachment',
          responses: { 201: { description: 'Uploaded' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

