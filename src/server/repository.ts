import crypto from 'node:crypto';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { ensureSeedData } from '../db/seed.ts';
import { events, organizations, registrations } from '../db/schema.ts';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase.ts';

export interface OrganizationDto {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  contactEmail: string;
  meetingSchedule: string;
  location: string;
  memberCount: number;
  eventCount: number;
  createdAt: string | Date;
}

export interface EventDto {
  id: number;
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  title: string;
  description: string;
  status: string;
  category: string;
  venue: string;
  startsAt: string | Date;
  endsAt: string | Date;
  capacity: number;
  registeredCount: number;
  createdAt: string | Date;
}

export interface RegistrationPassDto {
  id: number;
  eventId: number;
  studentName: string;
  studentId: string;
  passCode: string;
  checkedIn: boolean;
  createdAt: string | Date;
  eventTitle: string;
  eventVenue: string;
  eventStartsAt: string | Date;
  eventStatus: string;
  organizationName: string;
}

export interface AttendeeDto {
  id: number;
  studentName: string;
  studentId: string;
  passCode: string;
  checkedIn: boolean;
  createdAt: string | Date;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function listOrganizations(params: {
  q?: string;
  category?: string;
}): Promise<OrganizationDto[]> {
  const q = params.q?.trim() || '';
  const category = params.category?.trim() || '';

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: orgRows, error } = await query;
    if (error) {
      throw new Error('Unable to load organizations from Supabase.', { cause: error });
    }

    const { data: eventRows, error: evError } = await supabase
      .from('events')
      .select('organization_id');
    if (evError) {
      throw new Error('Unable to count organization events.', { cause: evError });
    }

    const countMap = new Map<number, number>();
    for (const row of eventRows || []) {
      const orgId = Number(row.organization_id);
      countMap.set(orgId, (countMap.get(orgId) || 0) + 1);
    }

    const lowered = q.toLowerCase();
    return (orgRows || [])
      .filter((row: any) => {
        if (!lowered) return true;
        return `${row.name} ${row.description} ${row.location} ${row.category}`
          .toLowerCase()
          .includes(lowered);
      })
      .map((row: any) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: row.category,
        description: row.description,
        contactEmail: row.contact_email,
        meetingSchedule: row.meeting_schedule,
        location: row.location,
        memberCount: row.member_count,
        eventCount: countMap.get(row.id) || 0,
        createdAt: row.created_at,
      }));
  }

  await ensureSeedData();
  const conditions = [];
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(organizations.name, pattern),
        ilike(organizations.description, pattern),
        ilike(organizations.location, pattern),
        ilike(organizations.category, pattern)
      )
    );
  }
  if (category && category !== 'All') {
    conditions.push(eq(organizations.category, category));
  }

  const orgRows = await db
    .select()
    .from(organizations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(organizations.name));

  const eventCounts = await db
    .select({
      organizationId: events.organizationId,
      eventCount: sql<number>`count(*)::int`,
    })
    .from(events)
    .groupBy(events.organizationId);

  const countMap = new Map(
    eventCounts.map((row) => [row.organizationId, row.eventCount])
  );

  return orgRows.map((org) => ({
    id: org.id,
    slug: org.slug,
    name: org.name,
    category: org.category,
    description: org.description,
    contactEmail: org.contactEmail,
    meetingSchedule: org.meetingSchedule,
    location: org.location,
    memberCount: org.memberCount,
    eventCount: countMap.get(org.id) ?? 0,
    createdAt: org.createdAt,
  }));
}

export async function createOrganization(input: {
  name: string;
  category: string;
  description: string;
  contactEmail: string;
  meetingSchedule: string;
  location: string;
}): Promise<OrganizationDto> {
  const baseSlug = slugify(input.name) || 'campus-org';
  const uniqueSlug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        slug: uniqueSlug,
        name: input.name,
        category: input.category,
        description: input.description,
        contact_email: input.contactEmail,
        meeting_schedule: input.meetingSchedule,
        location: input.location,
        member_count: 1,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Unable to save organization in Supabase.', { cause: error });
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      category: data.category,
      description: data.description,
      contactEmail: data.contact_email,
      meetingSchedule: data.meeting_schedule,
      location: data.location,
      memberCount: data.member_count,
      eventCount: 0,
      createdAt: data.created_at,
    };
  }

  const [created] = await db
    .insert(organizations)
    .values({
      slug: uniqueSlug,
      name: input.name,
      category: input.category,
      description: input.description,
      contactEmail: input.contactEmail,
      meetingSchedule: input.meetingSchedule,
      location: input.location,
      memberCount: 1,
    })
    .returning();

  return {
    id: created.id,
    slug: created.slug,
    name: created.name,
    category: created.category,
    description: created.description,
    contactEmail: created.contactEmail,
    meetingSchedule: created.meetingSchedule,
    location: created.location,
    memberCount: created.memberCount,
    eventCount: 0,
    createdAt: created.createdAt,
  };
}

export async function listEvents(params: {
  status?: string;
  q?: string;
  category?: string;
  organizationId?: number | null;
}): Promise<EventDto[]> {
  const status = params.status?.trim() || '';
  const q = params.q?.trim() || '';
  const category = params.category?.trim() || '';
  const orgId = params.organizationId ?? null;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('events')
      .select('*, organizations!inner(name, slug)')
      .order('starts_at', { ascending: true });

    if (status === 'upcoming' || status === 'ongoing' || status === 'completed') {
      query = query.eq('status', status);
    }
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (orgId) {
      query = query.eq('organization_id', orgId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error('Unable to load events from Supabase.', { cause: error });
    }

    const lowered = q.toLowerCase();
    return (data || [])
      .filter((row: any) => {
        if (!lowered) return true;
        const orgName = row.organizations?.name || '';
        return `${row.title} ${row.description} ${row.venue} ${row.category} ${orgName}`
          .toLowerCase()
          .includes(lowered);
      })
      .map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        organizationName: row.organizations?.name || 'Campus Organization',
        organizationSlug: row.organizations?.slug || 'campus-org',
        title: row.title,
        description: row.description,
        status: row.status,
        category: row.category,
        venue: row.venue,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        capacity: row.capacity,
        registeredCount: row.registered_count,
        createdAt: row.created_at,
      }));
  }

  await ensureSeedData();
  const conditions = [];
  if (status === 'upcoming' || status === 'ongoing' || status === 'completed') {
    conditions.push(eq(events.status, status));
  }
  if (category && category !== 'All') {
    conditions.push(eq(events.category, category));
  }
  if (orgId) {
    conditions.push(eq(events.organizationId, orgId));
  }
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(events.title, pattern),
        ilike(events.description, pattern),
        ilike(events.venue, pattern),
        ilike(events.category, pattern),
        ilike(organizations.name, pattern)
      )
    );
  }

  return db
    .select({
      id: events.id,
      organizationId: events.organizationId,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      title: events.title,
      description: events.description,
      status: events.status,
      category: events.category,
      venue: events.venue,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      capacity: events.capacity,
      registeredCount: events.registeredCount,
      createdAt: events.createdAt,
    })
    .from(events)
    .innerJoin(organizations, eq(events.organizationId, organizations.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(events.startsAt));
}

export async function createEvent(input: {
  organizationId: number;
  title: string;
  description: string;
  status: 'upcoming' | 'ongoing';
  category: string;
  venue: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
}): Promise<{ event?: EventDto; notFound?: boolean }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, category')
      .eq('id', input.organizationId)
      .maybeSingle();

    if (orgError) {
      throw new Error('Unable to verify organization.', { cause: orgError });
    }
    if (!org) {
      return { notFound: true };
    }

    const { data: created, error } = await supabase
      .from('events')
      .insert({
        organization_id: org.id,
        title: input.title,
        description: input.description,
        status: input.status,
        category: input.category || org.category,
        venue: input.venue,
        starts_at: input.startsAt.toISOString(),
        ends_at: input.endsAt.toISOString(),
        capacity: input.capacity,
        registered_count: 0,
      })
      .select()
      .single();

    if (error || !created) {
      throw new Error('Unable to create event in Supabase.', { cause: error });
    }

    return {
      event: {
        id: created.id,
        organizationId: created.organization_id,
        organizationName: org.name,
        organizationSlug: org.slug,
        title: created.title,
        description: created.description,
        status: created.status,
        category: created.category,
        venue: created.venue,
        startsAt: created.starts_at,
        endsAt: created.ends_at,
        capacity: created.capacity,
        registeredCount: created.registered_count,
        createdAt: created.created_at,
      },
    };
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, input.organizationId));

  if (!org) {
    return { notFound: true };
  }

  const [created] = await db
    .insert(events)
    .values({
      organizationId: org.id,
      title: input.title,
      description: input.description,
      status: input.status,
      category: input.category || org.category,
      venue: input.venue,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      capacity: input.capacity,
      registeredCount: 0,
    })
    .returning();

  return {
    event: {
      id: created.id,
      organizationId: created.organizationId,
      organizationName: org.name,
      organizationSlug: org.slug,
      title: created.title,
      description: created.description,
      status: created.status,
      category: created.category,
      venue: created.venue,
      startsAt: created.startsAt,
      endsAt: created.endsAt,
      capacity: created.capacity,
      registeredCount: created.registeredCount,
      createdAt: created.createdAt,
    },
  };
}

export async function deleteEventById(eventId: number): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .select('id');

    if (error) {
      throw new Error('Unable to delete event in Supabase.', { cause: error });
    }
    return Boolean(data && data.length > 0);
  }

  const deleted = await db
    .delete(events)
    .where(eq(events.id, eventId))
    .returning({ id: events.id });

  return deleted.length > 0;
}

export async function registerStudent(input: {
  studentName: string;
  studentId: string;
  eventId: number;
}): Promise<
  | { status: 201; registration: RegistrationPassDto }
  | { status: 404 | 409; error: string }
> {
  const passCode = `CC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data: eventRow, error: eventErr } = await supabase
      .from('events')
      .select('id, title, venue, starts_at, status, capacity, registered_count, organizations!inner(name)')
      .eq('id', input.eventId)
      .maybeSingle();

    if (eventErr) {
      throw new Error('Unable to look up event in Supabase.', { cause: eventErr });
    }
    if (!eventRow) {
      return { status: 404, error: 'Selected event was not found.' };
    }
    if (eventRow.registered_count >= eventRow.capacity) {
      return { status: 409, error: 'This event has reached full capacity.' };
    }

    const { data: existingReg, error: dupErr } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', input.eventId)
      .eq('student_id', input.studentId)
      .maybeSingle();

    if (dupErr) {
      throw new Error('Unable to check duplicate registration.', { cause: dupErr });
    }
    if (existingReg) {
      return {
        status: 409,
        error: `Student ID ${input.studentId} is already registered for ${eventRow.title}.`,
      };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('registrations')
      .insert({
        event_id: input.eventId,
        student_name: input.studentName,
        student_id: input.studentId,
        pass_code: passCode,
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      if (insertErr?.code === '23505') {
        return {
          status: 409,
          error: `Student ID ${input.studentId} is already registered for ${eventRow.title}.`,
        };
      }
      throw new Error('Unable to create registration in Supabase.', { cause: insertErr });
    }

    await supabase
      .from('events')
      .update({ registered_count: eventRow.registered_count + 1 })
      .eq('id', input.eventId);

    const orgRel: any = eventRow.organizations;
    const organizationName = Array.isArray(orgRel)
      ? orgRel[0]?.name || 'Campus Organization'
      : orgRel?.name || 'Campus Organization';

    return {
      status: 201,
      registration: {
        id: inserted.id,
        eventId: inserted.event_id,
        studentName: inserted.student_name,
        studentId: inserted.student_id,
        passCode: inserted.pass_code,
        checkedIn: inserted.checked_in,
        createdAt: inserted.created_at,
        eventTitle: eventRow.title,
        eventVenue: eventRow.venue,
        eventStartsAt: eventRow.starts_at,
        eventStatus: eventRow.status,
        organizationName,
      },
    };
  }

  return db.transaction(async (tx) => {
    const [eventRow] = await tx
      .select({
        id: events.id,
        title: events.title,
        venue: events.venue,
        startsAt: events.startsAt,
        status: events.status,
        capacity: events.capacity,
        registeredCount: events.registeredCount,
        organizationName: organizations.name,
      })
      .from(events)
      .innerJoin(organizations, eq(events.organizationId, organizations.id))
      .where(eq(events.id, input.eventId));

    if (!eventRow) {
      return { status: 404 as const, error: 'Selected event was not found.' };
    }
    if (eventRow.registeredCount >= eventRow.capacity) {
      return { status: 409 as const, error: 'This event has reached full capacity.' };
    }

    const [existingReg] = await tx
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, input.eventId),
          eq(registrations.studentId, input.studentId)
        )
      );

    if (existingReg) {
      return {
        status: 409 as const,
        error: `Student ID ${input.studentId} is already registered for ${eventRow.title}.`,
      };
    }

    const [inserted] = await tx
      .insert(registrations)
      .values({
        eventId: input.eventId,
        studentName: input.studentName,
        studentId: input.studentId,
        passCode,
      })
      .returning();

    await tx
      .update(events)
      .set({
        registeredCount: sql`${events.registeredCount} + 1`,
      })
      .where(eq(events.id, input.eventId));

    return {
      status: 201 as const,
      registration: {
        id: inserted.id,
        eventId: inserted.eventId,
        studentName: inserted.studentName,
        studentId: inserted.studentId,
        passCode: inserted.passCode,
        checkedIn: inserted.checkedIn,
        createdAt: inserted.createdAt,
        eventTitle: eventRow.title,
        eventVenue: eventRow.venue,
        eventStartsAt: eventRow.startsAt,
        eventStatus: eventRow.status,
        organizationName: eventRow.organizationName,
      },
    };
  });
}

export async function lookupPassesByStudentId(
  studentId: string
): Promise<RegistrationPassDto[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('registrations')
      .select(
        'id, event_id, student_name, student_id, pass_code, checked_in, created_at, events!inner(title, venue, starts_at, status, organizations!inner(name))'
      )
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Unable to look up passes in Supabase.', { cause: error });
    }

    return (data || []).map((row: any) => {
      const ev = row.events;
      const orgRel = ev?.organizations;
      const organizationName = Array.isArray(orgRel)
        ? orgRel[0]?.name || 'Campus Organization'
        : orgRel?.name || 'Campus Organization';
      return {
        id: row.id,
        eventId: row.event_id,
        studentName: row.student_name,
        studentId: row.student_id,
        passCode: row.pass_code,
        checkedIn: row.checked_in,
        createdAt: row.created_at,
        eventTitle: ev?.title || '',
        eventVenue: ev?.venue || '',
        eventStartsAt: ev?.starts_at || '',
        eventStatus: ev?.status || 'upcoming',
        organizationName,
      };
    });
  }

  return db
    .select({
      id: registrations.id,
      eventId: registrations.eventId,
      studentName: registrations.studentName,
      studentId: registrations.studentId,
      passCode: registrations.passCode,
      checkedIn: registrations.checkedIn,
      createdAt: registrations.createdAt,
      eventTitle: events.title,
      eventVenue: events.venue,
      eventStartsAt: events.startsAt,
      eventStatus: events.status,
      organizationName: organizations.name,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(organizations, eq(events.organizationId, organizations.id))
    .where(eq(registrations.studentId, studentId))
    .orderBy(desc(registrations.createdAt));
}

export async function listEventRegistrations(
  eventId: number
): Promise<{ attendees?: AttendeeDto[]; notFound?: boolean }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data: ev, error: evErr } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle();

    if (evErr) {
      throw new Error('Unable to check event in Supabase.', { cause: evErr });
    }
    if (!ev) {
      return { notFound: true };
    }

    const { data, error } = await supabase
      .from('registrations')
      .select('id, student_name, student_id, pass_code, checked_in, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Unable to load event roster from Supabase.', { cause: error });
    }

    return {
      attendees: (data || []).map((row: any) => ({
        id: row.id,
        studentName: row.student_name,
        studentId: row.student_id,
        passCode: row.pass_code,
        checkedIn: row.checked_in,
        createdAt: row.created_at,
      })),
    };
  }

  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.id, eventId));

  if (!ev) {
    return { notFound: true };
  }

  const attendees = await db
    .select({
      id: registrations.id,
      studentName: registrations.studentName,
      studentId: registrations.studentId,
      passCode: registrations.passCode,
      checkedIn: registrations.checkedIn,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .where(eq(registrations.eventId, eventId))
    .orderBy(desc(registrations.createdAt));

  return { attendees };
}

export async function toggleCheckin(
  regId: number
): Promise<{ registration?: { id: number; checkedIn: boolean }; notFound?: boolean }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('registrations')
      .select('id, checked_in')
      .eq('id', regId)
      .maybeSingle();

    if (fetchErr) {
      throw new Error('Unable to find registration in Supabase.', { cause: fetchErr });
    }
    if (!existing) {
      return { notFound: true };
    }

    const { data: updated, error } = await supabase
      .from('registrations')
      .update({ checked_in: !existing.checked_in })
      .eq('id', regId)
      .select('id, checked_in')
      .single();

    if (error || !updated) {
      throw new Error('Unable to update check-in status.', { cause: error });
    }
    return { registration: { id: updated.id, checkedIn: updated.checked_in } };
  }

  const [existing] = await db
    .select({ id: registrations.id, checkedIn: registrations.checkedIn })
    .from(registrations)
    .where(eq(registrations.id, regId));

  if (!existing) {
    return { notFound: true };
  }

  const [updated] = await db
    .update(registrations)
    .set({ checkedIn: !existing.checkedIn })
    .where(eq(registrations.id, regId))
    .returning({ id: registrations.id, checkedIn: registrations.checkedIn });

  return { registration: updated };
}

export async function cancelRegistration(input: {
  regId: number;
  studentId: string;
}): Promise<{ status: 200 | 403 | 404; error?: string }> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data: existing, error: fetchErr } = await supabase
      .from('registrations')
      .select('id, event_id, student_id')
      .eq('id', input.regId)
      .maybeSingle();

    if (fetchErr) {
      throw new Error('Unable to look up registration.', { cause: fetchErr });
    }
    if (!existing) {
      return { status: 404, error: 'Registration not found.' };
    }
    if (existing.student_id !== input.studentId) {
      return {
        status: 403,
        error: 'Student ID does not match this registration pass.',
      };
    }

    const { error: delErr } = await supabase
      .from('registrations')
      .delete()
      .eq('id', input.regId);
    if (delErr) {
      throw new Error('Unable to cancel registration.', { cause: delErr });
    }

    const { data: ev } = await supabase
      .from('events')
      .select('registered_count')
      .eq('id', existing.event_id)
      .maybeSingle();

    if (ev) {
      await supabase
        .from('events')
        .update({ registered_count: Math.max(0, ev.registered_count - 1) })
        .eq('id', existing.event_id);
    }

    return { status: 200 };
  }

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({
        id: registrations.id,
        eventId: registrations.eventId,
        studentId: registrations.studentId,
      })
      .from(registrations)
      .where(eq(registrations.id, input.regId));

    if (!existing) {
      return { status: 404 as const, error: 'Registration not found.' };
    }
    if (existing.studentId !== input.studentId) {
      return {
        status: 403 as const,
        error: 'Student ID does not match this registration pass.',
      };
    }

    await tx.delete(registrations).where(eq(registrations.id, input.regId));
    await tx
      .update(events)
      .set({
        registeredCount: sql`GREATEST(${events.registeredCount} - 1, 0)`,
      })
      .where(eq(events.id, existing.eventId));

    return { status: 200 as const };
  });
}
