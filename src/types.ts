export interface CampusUser {
  uid: string;
  email: string;
  displayName: string;
  picture?: string | null;
}

export interface Organization {
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
  createdByUid?: string | null;
  createdAt: string;
}

export interface CampusEvent {
  id: number;
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  title: string;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  category: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  registeredCount: number;
  createdByUid?: string | null;
  createdAt: string;
}

export interface EventRegistration {
  id: number;
  eventId: number;
  studentName: string;
  studentId: string;
  passCode: string;
  checkedIn: boolean;
  createdAt: string;
  eventTitle: string;
  eventVenue: string;
  eventStartsAt: string;
  eventStatus: string;
  organizationName: string;
}

export interface AttendeeRecord {
  id: number;
  studentName: string;
  studentId: string;
  passCode: string;
  checkedIn: boolean;
  createdAt: string;
}

export type ActiveView = 'home' | 'events' | 'organizations' | 'passes' | 'about';
export type EventFilterTab = 'all' | 'upcoming' | 'ongoing';
