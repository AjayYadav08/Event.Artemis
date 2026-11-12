import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

const app = createApp();

describe('Event Artemis Backend API Integration Tests', () => {
  let studentToken = '';
  let studentId = '';
  let organizerToken = '';
  let organizerId = '';
  let outsiderToken = '';
  let createdEventId = '';
  let createdTeamId = '';
  let joinRequestId = '';
  let invitationId = '';
  let messageId1 = '';
  let messageId2 = '';
  let attachmentId = '';

  beforeAll(async () => {
    // Clean test DB in dependency order
    await prisma.chatAttachment.deleteMany();
    await prisma.messageDeletion.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.teamRating.deleteMany();
    await prisma.teamInvitation.deleteMany();
    await prisma.teamJoinRequest.deleteMany();
    await prisma.teamMembership.deleteMany();
    await prisma.team.deleteMany();
    await prisma.eventInterest.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.eventFieldHistory.deleteMany();
    await prisma.event.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Promote one user to ORGANIZER after registration
    const orgReg = await request(app).post('/api/v1/auth/register').send({
      name: 'Organizer One',
      email: 'organizer@test.edu',
      password: 'Password@123',
      skills: ['Management'],
    });
    organizerId = orgReg.body.data.user.id;
    await prisma.user.update({
      where: { id: organizerId },
      data: { role: 'ORGANIZER' },
    });
    const orgLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'organizer@test.edu',
      password: 'Password@123',
    });
    organizerToken = orgLogin.body.data.accessToken;
  });

  afterAll(async () => {
    const testUploadDir = path.resolve(process.cwd(), 'uploads-test');
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
    await prisma.$disconnect();
  });

  it('GET /api/health returns database connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.database).toBe('connected');
  });

  it('registers a student, prevents duplicate email, and logs in with HttpOnly refresh cookie', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Student Tester',
      email: 'student@test.edu',
      password: 'Password@123',
      skills: ['React', 'TypeScript'],
    });
    expect(reg.status).toBe(201);
    expect(reg.body.data.user.passwordHash).toBeUndefined();
    expect(reg.body.data.accessToken).toBeTruthy();
    expect(reg.headers['set-cookie']).toBeDefined();

    studentId = reg.body.data.user.id;
    studentToken = reg.body.data.accessToken;

    const dup = await request(app).post('/api/v1/auth/register').send({
      name: 'Student Tester',
      email: 'student@test.edu',
      password: 'Password@123',
    });
    expect(dup.status).toBe(409);

    const outReg = await request(app).post('/api/v1/auth/register').send({
      name: 'Outsider User',
      email: 'outsider@test.edu',
      password: 'Password@123',
    });
    outsiderToken = outReg.body.data.accessToken;
  });

  it('rejects unauthorized requests and enforces RBAC', async () => {
    const unauth = await request(app).get('/api/v1/users/me');
    expect(unauth.status).toBe(401);

    const forbiddenCreate = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Event',
        category: 'Competition',
        date: '15 May 2026',
        time: '10:00 AM',
        location: 'Hall A',
        domain: 'AI',
        posterUrl: 'https://example.com/poster.jpg',
      });
    expect(forbiddenCreate.status).toBe(403);
  });

  it('supports profile retrieval and updates', async () => {
    const me = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('student@test.edu');

    const updated = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Student Updated', skills: ['React', 'Node.js'] });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Student Updated');
  });

  it('creates, searches, filters, updates, and manages interest for events', async () => {
    const createRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        title: 'Artemis AI Summit',
        category: 'Competition',
        date: '18 May 2026',
        time: '10:00 AM',
        location: 'Main Auditorium',
        domain: 'Artificial Intelligence',
        participationMode: 'Hybrid',
        xp: 2500,
        posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
      });
    expect(createRes.status).toBe(201);
    createdEventId = createRes.body.data.id;

    // Search & filter
    const listRes = await request(app)
      .get('/api/v1/events?search=Artemis&category=Competition&participationMode=Hybrid')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].id).toBe(createdEventId);

    // Mark interested
    const intRes = await request(app)
      .post(`/api/v1/events/${createdEventId}/interest`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(intRes.status).toBe(200);

    const myInt = await request(app)
      .get('/api/v1/events/my/interested')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(myInt.status).toBe(200);
    expect(myInt.body.data.some((e: any) => e.id === createdEventId)).toBe(true);

    // Update event
    const patchRes = await request(app)
      .patch(`/api/v1/events/${createdEventId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ prizePool: '₹1,00,000' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.prizePool).toBe('₹1,00,000');
  });

  it('creates teams, handles join requests, prevents duplicates, and handles invitations', async () => {
    const teamRes = await request(app)
      .post('/api/v1/teams')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Alpha Squad',
        hackathon: 'Artemis AI Summit',
        description: 'Building multi-agent workflows',
        expectations: ['Daily standups'],
        maxMembers: 4,
      });
    expect(teamRes.status).toBe(201);
    createdTeamId = teamRes.body.data.id;

    // Student submits join request
    const reqRes = await request(app)
      .post('/api/v1/team-requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ teamId: createdTeamId, message: 'I know React & TS!' });
    expect(reqRes.status).toBe(201);
    joinRequestId = reqRes.body.data.id;

    // Duplicate pending request rejected
    const dupReq = await request(app)
      .post('/api/v1/team-requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ teamId: createdTeamId });
    expect(dupReq.status).toBe(409);

    // Organizer accepts join request
    const acceptRes = await request(app)
      .post(`/api/v1/team-requests/${joinRequestId}/accept`)
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('Accepted');

    // Organizer invites outsider
    const invRes = await request(app)
      .post('/api/v1/invitations')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ teamId: createdTeamId, recipientEmail: 'outsider@test.edu' });
    expect(invRes.status).toBe(201);
    invitationId = invRes.body.data.id;

    // Outsider rejects invitation
    const rejInv = await request(app)
      .post(`/api/v1/invitations/${invitationId}/reject`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(rejInv.status).toBe(200);
    expect(rejInv.body.data.status).toBe('Rejected');
  });

  it('supports persistent team chat, access control, file uploads, and message deletion', async () => {
    // Non-member (outsider) cannot read or send messages
    const forbiddenChat = await request(app)
      .get(`/api/v1/messages/team/${createdTeamId}`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(forbiddenChat.status).toBe(403);

    // Valid PNG buffer (magic bytes: 89 50 4E 47 0D 0A 1A 0A)
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const uploadRes = await request(app)
      .post('/api/v1/attachments/upload')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('teamId', createdTeamId)
      .attach('file', validPng, { filename: 'diagram.png', contentType: 'image/png' });
    expect(uploadRes.status).toBe(201);
    attachmentId = uploadRes.body.data.id;

    // Spoofed PNG (invalid magic bytes) must be rejected
    const badPng = Buffer.from('not-a-real-png');
    const badUpload = await request(app)
      .post('/api/v1/attachments/upload')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('teamId', createdTeamId)
      .attach('file', badPng, { filename: 'fake.png', contentType: 'image/png' });
    expect(badUpload.status).toBe(400);

    // Authorized member can download attachment, outsider cannot
    const okDownload = await request(app)
      .get(`/api/v1/attachments/${attachmentId}/download`)
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(okDownload.status).toBe(200);

    const badDownload = await request(app)
      .get(`/api/v1/attachments/${attachmentId}/download`)
      .set('Authorization', `Bearer ${outsiderToken}`);
    expect(badDownload.status).toBe(403);

    // Send messages
    const msg1 = await request(app)
      .post(`/api/v1/messages/team/${createdTeamId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: 'Hello team!', attachmentId });
    expect(msg1.status).toBe(201);
    messageId1 = msg1.body.data.id;

    const msg2 = await request(app)
      .post(`/api/v1/messages/team/${createdTeamId}`)
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ content: 'Welcome aboard!' });
    expect(msg2.status).toBe(201);
    messageId2 = msg2.body.data.id;

    // Delete message 1 forEveryone
    const delEveryone = await request(app)
      .delete(`/api/v1/messages/${messageId1}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ deleteType: 'forEveryone' });
    expect(delEveryone.status).toBe(200);
    expect(delEveryone.body.data.message.text).toBe('This message was deleted');
    expect(delEveryone.body.data.message.deletedForEveryone).toBe(true);

    // Delete message 2 forMe (only hidden for student, still visible to organizer)
    const delForMe = await request(app)
      .delete(`/api/v1/messages/${messageId2}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ deleteType: 'forMe' });
    expect(delForMe.status).toBe(200);

    const studentHistory = await request(app)
      .get(`/api/v1/messages/team/${createdTeamId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentHistory.body.data.length).toBe(1);
    expect(studentHistory.body.data[0].deletedForEveryone).toBe(true);

    const orgHistory = await request(app)
      .get(`/api/v1/messages/team/${createdTeamId}`)
      .set('Authorization', `Bearer ${organizerToken}`);
    expect(orgHistory.body.data.length).toBe(2);
  });

  it('refreshes tokens and logs out cleanly', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'student@test.edu',
      password: 'Password@123',
    });
    const cookies = login.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies);
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.accessToken).toBeTruthy();

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refresh.headers['set-cookie'] || cookies);
    expect(logout.status).toBe(200);
  });
});

