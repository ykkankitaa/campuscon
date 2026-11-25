import express from 'express';
import {
  cancelRegistration,
  createEvent,
  createOrganization,
  deleteEventById,
  listEventRegistrations,
  listEvents,
  listOrganizations,
  lookupPassesByStudentId,
  registerStudent,
  toggleCheckin,
} from './repository.ts';

function parsePositiveInt(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'campus-connect' });
  });

  app.get('/api/organizations', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const category =
        typeof req.query.category === 'string' ? req.query.category : '';
      const rows = await listOrganizations({ q, category });
      res.json({ organizations: rows });
    } catch (error) {
      console.error('GET /api/organizations error:', error);
      res.status(500).json({ error: 'Unable to load campus organizations.' });
    }
  });

  app.post('/api/organizations', async (req, res) => {
    try {
      const { name, category, description, contactEmail, meetingSchedule, location } =
        req.body ?? {};

      if (
        typeof name !== 'string' ||
        name.trim().length < 2 ||
        name.trim().length > 80
      ) {
        return res
          .status(400)
          .json({ error: 'Organization name must be between 2 and 80 characters.' });
      }
      if (typeof category !== 'string' || !category.trim()) {
        return res.status(400).json({ error: 'Please select an organization category.' });
      }
      if (typeof description !== 'string' || description.trim().length < 10) {
        return res
          .status(400)
          .json({ error: 'Please provide a brief description (at least 10 characters).' });
      }

      const org = await createOrganization({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        contactEmail:
          typeof contactEmail === 'string' && contactEmail.includes('@')
            ? contactEmail.trim()
            : 'contact@campusconnect.edu',
        meetingSchedule:
          typeof meetingSchedule === 'string' && meetingSchedule.trim()
            ? meetingSchedule.trim()
            : 'Weekly · Campus Commons',
        location:
          typeof location === 'string' && location.trim()
            ? location.trim()
            : 'Student Union Hall',
      });

      res.status(201).json({ organization: org });
    } catch (error) {
      console.error('POST /api/organizations error:', error);
      res.status(500).json({ error: 'Unable to create organization.' });
    }
  });

  app.get('/api/events', async (req, res) => {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : '';
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const category =
        typeof req.query.category === 'string' ? req.query.category : '';
      const orgIdRaw =
        typeof req.query.organizationId === 'string'
          ? parsePositiveInt(req.query.organizationId)
          : null;

      const rows = await listEvents({
        status,
        q,
        category,
        organizationId: orgIdRaw,
      });

      res.json({ events: rows });
    } catch (error) {
      console.error('GET /api/events error:', error);
      res.status(500).json({ error: 'Unable to load campus events.' });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const {
        organizationId,
        title,
        description,
        status,
        category,
        venue,
        startsAt,
        endsAt,
        capacity,
      } = req.body ?? {};

      const orgId = parsePositiveInt(String(organizationId ?? ''));
      if (!orgId) {
        return res.status(400).json({ error: 'Please select a valid host organization.' });
      }
      if (
        typeof title !== 'string' ||
        title.trim().length < 3 ||
        title.trim().length > 120
      ) {
        return res
          .status(400)
          .json({ error: 'Event title must be between 3 and 120 characters.' });
      }
      if (typeof description !== 'string' || description.trim().length < 10) {
        return res
          .status(400)
          .json({ error: 'Event description must be at least 10 characters.' });
      }
      if (typeof venue !== 'string' || venue.trim().length < 2) {
        return res.status(400).json({ error: 'Please specify the campus venue.' });
      }

      const parsedStart = new Date(startsAt);
      const parsedEnd = new Date(endsAt);
      if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ error: 'Please provide valid start and end times.' });
      }
      if (parsedEnd <= parsedStart) {
        return res.status(400).json({ error: 'End time must be after the start time.' });
      }

      const capNum = Number(capacity ?? 100);
      if (!Number.isInteger(capNum) || capNum < 1 || capNum > 5000) {
        return res
          .status(400)
          .json({ error: 'Capacity must be a whole number between 1 and 5000.' });
      }

      const result = await createEvent({
        organizationId: orgId,
        title: title.trim(),
        description: description.trim(),
        status: status === 'ongoing' ? 'ongoing' : 'upcoming',
        category: typeof category === 'string' ? category.trim() : '',
        venue: venue.trim(),
        startsAt: parsedStart,
        endsAt: parsedEnd,
        capacity: capNum,
      });

      if (result.notFound) {
        return res.status(404).json({ error: 'Selected organization was not found.' });
      }

      res.status(201).json({ event: result.event });
    } catch (error) {
      console.error('POST /api/events error:', error);
      res.status(500).json({ error: 'Unable to publish event.' });
    }
  });

  app.delete('/api/events/:id', async (req, res) => {
    try {
      const eventId = parsePositiveInt(String(req.params.id));
      if (!eventId) {
        return res.status(400).json({ error: 'Invalid event ID.' });
      }

      const deleted = await deleteEventById(eventId);
      if (!deleted) {
        return res.status(404).json({ error: 'Event not found.' });
      }
      res.json({ deleted: true, id: eventId });
    } catch (error) {
      console.error('DELETE /api/events/:id error:', error);
      res.status(500).json({ error: 'Unable to delete event.' });
    }
  });

  app.post('/api/registrations', async (req, res) => {
    try {
      const { studentName, studentId, eventId } = req.body ?? {};

      if (
        typeof studentName !== 'string' ||
        studentName.trim().length < 2 ||
        studentName.trim().length > 80
      ) {
        return res
          .status(400)
          .json({ error: 'Please enter your full name (2 to 80 characters).' });
      }

      const normalizedId =
        typeof studentId === 'string' ? studentId.trim().toUpperCase() : '';
      if (!/^[A-Z0-9-]{3,24}$/.test(normalizedId)) {
        return res.status(400).json({
          error:
            'Student ID must be 3 to 24 letters, numbers, or hyphens (e.g. CC-2026-104).',
        });
      }

      const parsedEventId = parsePositiveInt(String(eventId ?? ''));
      if (!parsedEventId) {
        return res.status(400).json({ error: 'Please select an event to register for.' });
      }

      const outcome = await registerStudent({
        studentName: studentName.trim(),
        studentId: normalizedId,
        eventId: parsedEventId,
      });

      if ('error' in outcome) {
        return res.status(outcome.status).json({ error: outcome.error });
      }

      res.status(201).json({ registration: outcome.registration });
    } catch (error) {
      console.error('POST /api/registrations error:', error);
      res.status(500).json({ error: 'Unable to complete registration.' });
    }
  });

  app.get('/api/registrations/lookup', async (req, res) => {
    try {
      const rawId =
        typeof req.query.studentId === 'string'
          ? req.query.studentId.trim().toUpperCase()
          : '';
      if (!/^[A-Z0-9-]{3,24}$/.test(rawId)) {
        return res.status(400).json({
          error: 'Enter a valid Student ID (3 to 24 letters, numbers, or hyphens).',
        });
      }

      const rows = await lookupPassesByStudentId(rawId);
      res.json({ registrations: rows });
    } catch (error) {
      console.error('GET /api/registrations/lookup error:', error);
      res.status(500).json({ error: 'Unable to look up event passes.' });
    }
  });

  app.get('/api/events/:id/registrations', async (req, res) => {
    try {
      const eventId = parsePositiveInt(String(req.params.id));
      if (!eventId) {
        return res.status(400).json({ error: 'Invalid event ID.' });
      }

      const result = await listEventRegistrations(eventId);
      if (result.notFound) {
        return res.status(404).json({ error: 'Event not found.' });
      }

      res.json({ registrations: result.attendees || [] });
    } catch (error) {
      console.error('GET /api/events/:id/registrations error:', error);
      res.status(500).json({ error: 'Unable to load event roster.' });
    }
  });

  app.patch('/api/registrations/:id/checkin', async (req, res) => {
    try {
      const regId = parsePositiveInt(String(req.params.id));
      if (!regId) {
        return res.status(400).json({ error: 'Invalid registration ID.' });
      }

      const result = await toggleCheckin(regId);
      if (result.notFound) {
        return res.status(404).json({ error: 'Registration not found.' });
      }

      res.json({ registration: result.registration });
    } catch (error) {
      console.error('PATCH /api/registrations/:id/checkin error:', error);
      res.status(500).json({ error: 'Unable to update check-in status.' });
    }
  });

  app.delete('/api/registrations/:id', async (req, res) => {
    try {
      const regId = parsePositiveInt(String(req.params.id));
      if (!regId) {
        return res.status(400).json({ error: 'Invalid registration ID.' });
      }

      const rawStudentId =
        typeof req.query.studentId === 'string'
          ? req.query.studentId
          : typeof req.body?.studentId === 'string'
            ? req.body.studentId
            : '';
      const normalizedId = rawStudentId.trim().toUpperCase();
      if (!/^[A-Z0-9-]{3,24}$/.test(normalizedId)) {
        return res.status(400).json({ error: 'Student ID is required to cancel a pass.' });
      }

      const outcome = await cancelRegistration({ regId, studentId: normalizedId });
      if (outcome.error) {
        return res.status(outcome.status).json({ error: outcome.error });
      }

      res.json({ deleted: true, id: regId });
    } catch (error) {
      console.error('DELETE /api/registrations/:id error:', error);
      res.status(500).json({ error: 'Unable to cancel registration.' });
    }
  });

  return app;
}
