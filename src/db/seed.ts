import { sql } from 'drizzle-orm';
import { db } from './index.ts';
import { events, organizations } from './schema.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeedData(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    try {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizations);

      if (count > 0) {
        return;
      }

      const insertedOrgs = await db
        .insert(organizations)
        .values([
          {
            slug: 'autumn-literary-guild',
            name: 'Autumn Literary Guild',
            category: 'Arts & Culture',
            description:
              'Weekly poetry readings, zine workshops, and fireside book discussions hosted beneath the Old Bell Tower.',
            contactEmail: 'guild@campusconnect.edu',
            meetingSchedule: 'Wednesdays · 5:30 PM',
            location: 'Old Bell Tower Reading Room',
            memberCount: 142,
          },
          {
            slug: 'maple-robotics-society',
            name: 'Maple Robotics Society',
            category: 'Technology',
            description:
              'Student-led hardware engineering lab building autonomous rovers, campus delivery bots, and embedded prototypes.',
            contactEmail: 'robotics@campusconnect.edu',
            meetingSchedule: 'Thursdays · 6:00 PM',
            location: 'Founders Engineering Hall 204',
            memberCount: 218,
          },
          {
            slug: 'campus-botanical-collective',
            name: 'Campus Botanical Collective',
            category: 'Community',
            description:
              'Maintaining the collegiate arboretum, heirloom pumpkin patch, and seasonal community harvest markets.',
            contactEmail: 'botany@campusconnect.edu',
            meetingSchedule: 'Saturdays · 10:00 AM',
            location: 'North Quad Conservatory',
            memberCount: 96,
          },
          {
            slug: 'student-chamber-ensemble',
            name: 'Student Chamber Ensemble',
            category: 'Arts & Culture',
            description:
              'Acoustic strings, woodwinds, and seasonal courtyard concerts celebrating campus music traditions.',
            contactEmail: 'chamber@campusconnect.edu',
            meetingSchedule: 'Tuesdays · 7:00 PM',
            location: 'Alder Chapel Auditorium',
            memberCount: 74,
          },
          {
            slug: 'founders-debate-union',
            name: 'Founders Debate Union',
            category: 'Academic',
            description:
              'Public policy forums, parliamentary debates, and civic discourse symposiums open to every department.',
            contactEmail: 'debate@campusconnect.edu',
            meetingSchedule: 'Mondays · 6:30 PM',
            location: 'Heritage Hall Amphitheater',
            memberCount: 129,
          },
        ])
        .onConflictDoNothing()
        .returning();

      if (insertedOrgs.length === 0) {
        return;
      }

      const orgMap = new Map(insertedOrgs.map((org) => [org.slug, org.id]));
      const now = Date.now();
      const hour = 3600 * 1000;
      const day = 24 * hour;

      await db.insert(events).values([
        {
          organizationId: orgMap.get('autumn-literary-guild')!,
          title: 'Lanternlight Poetry & Cider Evening',
          description:
            'An open-mic reading of autumn essays and verse beside the historic lamppost courtyard, paired with spiced orchard cider.',
          status: 'ongoing',
          category: 'Arts & Culture',
          venue: 'Bell Tower Courtyard',
          startsAt: new Date(now - 2 * hour),
          endsAt: new Date(now + 18 * hour),
          capacity: 80,
          registeredCount: 46,
        },
        {
          organizationId: orgMap.get('campus-botanical-collective')!,
          title: 'Harvest Courtyard Market & Leaf Pressing',
          description:
            'Live botanical illustration booths, heirloom produce stalls, and autumn leaf-pressing tables on the main quad.',
          status: 'ongoing',
          category: 'Community',
          venue: 'Main Quad Lawn',
          startsAt: new Date(now - 3 * hour),
          endsAt: new Date(now + 12 * hour),
          capacity: 150,
          registeredCount: 112,
        },
        {
          organizationId: orgMap.get('maple-robotics-society')!,
          title: 'Autonomous Rover Field Trials',
          description:
            'Live outdoor navigation runs testing campus path-planning sensors along the brick walkways.',
          status: 'ongoing',
          category: 'Technology',
          venue: 'South Brick Promenade',
          startsAt: new Date(now - 1 * hour),
          endsAt: new Date(now + 8 * hour),
          capacity: 60,
          registeredCount: 39,
        },
        {
          organizationId: orgMap.get('student-chamber-ensemble')!,
          title: 'Autumn Twilight Strings Recital',
          description:
            'Acoustic chamber performance featuring Vivaldi and contemporary collegiate compositions at dusk.',
          status: 'upcoming',
          category: 'Arts & Culture',
          venue: 'Alder Chapel Auditorium',
          startsAt: new Date(now + 3 * day),
          endsAt: new Date(now + 3 * day + 2 * hour),
          capacity: 180,
          registeredCount: 94,
        },
        {
          organizationId: orgMap.get('founders-debate-union')!,
          title: 'Annual Civic Innovation Symposium',
          description:
            'Faculty and student leaders debate sustainable urban transit and campus bike-share infrastructure.',
          status: 'upcoming',
          category: 'Academic',
          venue: 'Heritage Hall Amphitheater',
          startsAt: new Date(now + 7 * day),
          endsAt: new Date(now + 7 * day + 2.5 * hour),
          capacity: 220,
          registeredCount: 138,
        },
        {
          organizationId: orgMap.get('maple-robotics-society')!,
          title: 'Winter Hardware Buildathon Kickoff',
          description:
            'Team formation, microcontroller kit distribution, and mentor office hours for 48-hour hardware sprints.',
          status: 'upcoming',
          category: 'Technology',
          venue: 'Founders Engineering Hall 204',
          startsAt: new Date(now + 10 * day),
          endsAt: new Date(now + 10 * day + 8 * hour),
          capacity: 120,
          registeredCount: 67,
        },
      ]);
    } catch (error) {
      seedPromise = null;
      console.error('Lazy seed check error:', error);
    }
  })();

  return seedPromise;
}
