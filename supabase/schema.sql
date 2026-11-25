-- Campus Connect Supabase Schema & Initial Seed Data
-- Run this script in your Supabase project's SQL Editor before deploying to Render or Vercel.

CREATE TABLE IF NOT EXISTS public.organizations (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  meeting_schedule TEXT NOT NULL,
  location TEXT NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_by_uid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  category TEXT NOT NULL,
  venue TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  registered_count INTEGER NOT NULL DEFAULT 0,
  created_by_uid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_uid TEXT,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_email TEXT,
  pass_code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS registrations_event_student_idx
  ON public.registrations (event_id, student_id);

INSERT INTO public.organizations (slug, name, category, description, contact_email, meeting_schedule, location, member_count)
VALUES
  ('autumn-literary-guild', 'Autumn Literary Guild', 'Arts & Culture', 'Weekly poetry readings, zine workshops, and fireside book discussions hosted beneath the Old Bell Tower.', 'guild@campusconnect.edu', 'Wednesdays · 5:30 PM', 'Old Bell Tower Reading Room', 142),
  ('maple-robotics-society', 'Maple Robotics Society', 'Technology', 'Student-led hardware engineering lab building autonomous rovers, campus delivery bots, and embedded prototypes.', 'robotics@campusconnect.edu', 'Thursdays · 6:00 PM', 'Founders Engineering Hall 204', 218),
  ('campus-botanical-collective', 'Campus Botanical Collective', 'Community', 'Maintaining the collegiate arboretum, heirloom pumpkin patch, and seasonal community harvest markets.', 'botany@campusconnect.edu', 'Saturdays · 10:00 AM', 'North Quad Conservatory', 96),
  ('student-chamber-ensemble', 'Student Chamber Ensemble', 'Arts & Culture', 'Acoustic strings, woodwinds, and seasonal courtyard concerts celebrating campus music traditions.', 'chamber@campusconnect.edu', 'Tuesdays · 7:00 PM', 'Alder Chapel Auditorium', 74),
  ('founders-debate-union', 'Founders Debate Union', 'Academic', 'Public policy forums, parliamentary debates, and civic discourse symposiums open to every department.', 'debate@campusconnect.edu', 'Mondays · 6:30 PM', 'Heritage Hall Amphitheater', 129)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.events (organization_id, title, description, status, category, venue, starts_at, ends_at, capacity, registered_count)
SELECT o.id, v.title, v.description, v.status, v.category, v.venue, v.starts_at::timestamptz, v.ends_at::timestamptz, v.capacity, v.registered_count
FROM (VALUES
  ('autumn-literary-guild', 'Lanternlight Poetry & Cider Evening', 'An open-mic reading of autumn essays and verse beside the historic lamppost courtyard, paired with spiced orchard cider.', 'ongoing', 'Arts & Culture', 'Bell Tower Courtyard', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '18 hours', 80, 46),
  ('campus-botanical-collective', 'Harvest Courtyard Market & Leaf Pressing', 'Live botanical illustration booths, heirloom produce stalls, and autumn leaf-pressing tables on the main quad.', 'ongoing', 'Community', 'Main Quad Lawn', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '12 hours', 150, 112),
  ('maple-robotics-society', 'Autonomous Rover Field Trials', 'Live outdoor navigation runs testing campus path-planning sensors along the brick walkways.', 'ongoing', 'Technology', 'South Brick Promenade', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '8 hours', 60, 39),
  ('student-chamber-ensemble', 'Autumn Twilight Strings Recital', 'Acoustic chamber performance featuring Vivaldi and contemporary collegiate compositions at dusk.', 'upcoming', 'Arts & Culture', 'Alder Chapel Auditorium', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 2 hours', 180, 94),
  ('founders-debate-union', 'Annual Civic Innovation Symposium', 'Faculty and student leaders debate sustainable urban transit and campus bike-share infrastructure.', 'upcoming', 'Academic', 'Heritage Hall Amphitheater', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', 220, 138),
  ('maple-robotics-society', 'Winter Hardware Buildathon Kickoff', 'Team formation, microcontroller kit distribution, and mentor office hours for 48-hour hardware sprints.', 'upcoming', 'Technology', 'Founders Engineering Hall 204', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 8 hours', 120, 67)
) AS v(slug, title, description, status, category, venue, starts_at, ends_at, capacity, registered_count)
JOIN public.organizations o ON o.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.title = v.title
);
