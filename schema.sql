-- ═══════════════════════════════════════════════════════════════════════
-- ZENITH PRANAVI (ZPed.org) — Complete Database Schema
-- ═══════════════════════════════════════════════════════════════════════
-- Project:  ZPranavi
-- Account:  VidhyadharanSS  
-- Supabase: https://oqxwvkytyczmldnrqjll.supabase.co
--
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Paste this ENTIRE file
-- 4. Click "Run" (or Ctrl+Enter)
--
-- Creates:  3 tables, RLS policies, indexes, 10 sample tutors
-- ═══════════════════════════════════════════════════════════════════════


-- ╔═══════════════════════════════════════╗
-- ║  1. ENABLE UUID EXTENSION             ║
-- ╚═══════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ╔═══════════════════════════════════════╗
-- ║  2. DROP EXISTING (Clean Slate)       ║
-- ╚═══════════════════════════════════════╝

DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS enquiries CASCADE;
DROP TABLE IF EXISTS tutors CASCADE;


-- ╔═══════════════════════════════════════╗
-- ║  3. TUTORS TABLE                      ║
-- ╚═══════════════════════════════════════╝

CREATE TABLE tutors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    subjects        TEXT[] NOT NULL DEFAULT '{}',
    price_hour      INTEGER NOT NULL DEFAULT 20,
    rating          NUMERIC(2,1) NOT NULL DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
    sessions_count  INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tutors IS 'Tutor profiles for Zenith Pranavi (ZPed.org)';
COMMENT ON COLUMN tutors.subjects IS 'Array of subjects the tutor teaches';
COMMENT ON COLUMN tutors.price_hour IS 'Hourly rate in USD (Year 1-6: $13, Year 7-10: $20, Year 11-12: $27, Special: $27)';
COMMENT ON COLUMN tutors.status IS 'active = available for booking, inactive = unavailable';


-- ╔═══════════════════════════════════════╗
-- ║  4. BOOKINGS TABLE                    ║
-- ╚═══════════════════════════════════════╝

CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name    TEXT NOT NULL,
    tutor_name      TEXT NOT NULL,
    subject         TEXT NOT NULL,
    booking_date    DATE NOT NULL,
    booking_time    TEXT NOT NULL,
    price           INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE bookings IS 'Student session bookings — linked to auth.users via user_id';
COMMENT ON COLUMN bookings.user_id IS 'References the authenticated user who made the booking';
COMMENT ON COLUMN bookings.status IS 'pending → confirmed → completed (or cancelled)';


-- ╔═══════════════════════════════════════╗
-- ║  5. ENQUIRIES TABLE                   ║
-- ╚═══════════════════════════════════════╝

CREATE TABLE enquiries (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    message         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE enquiries IS 'Contact form submissions (public — no auth required)';


-- ╔═══════════════════════════════════════╗
-- ║  6. ENABLE ROW LEVEL SECURITY         ║
-- ╚═══════════════════════════════════════╝

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;


-- ╔═══════════════════════════════════════╗
-- ║  7. RLS POLICIES — TUTORS             ║
-- ╚═══════════════════════════════════════╝

-- Anyone can read tutors (public listing)
CREATE POLICY "Allow public read on tutors"
    ON tutors
    FOR SELECT
    USING (true);


-- ╔═══════════════════════════════════════╗
-- ║  8. RLS POLICIES — BOOKINGS           ║
-- ╚═══════════════════════════════════════╝

-- Only authenticated users can create bookings
CREATE POLICY "Allow authenticated users to insert bookings"
    ON bookings
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Users can only view their OWN bookings
CREATE POLICY "Users can view own bookings"
    ON bookings
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their OWN bookings (e.g., cancel)
CREATE POLICY "Users can update own bookings"
    ON bookings
    FOR UPDATE
    USING (auth.uid() = user_id);


-- ╔═══════════════════════════════════════╗
-- ║  9. RLS POLICIES — ENQUIRIES          ║
-- ╚═══════════════════════════════════════╝

-- Anyone can submit an enquiry (public contact form)
CREATE POLICY "Allow public insert on enquiries"
    ON enquiries
    FOR INSERT
    WITH CHECK (true);

-- No SELECT policy = only service_role (admin) can read enquiries


-- ╔═══════════════════════════════════════╗
-- ║  10. PERFORMANCE INDEXES              ║
-- ╚═══════════════════════════════════════╝

CREATE INDEX idx_tutors_status ON tutors(status);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_enquiries_created_at ON enquiries(created_at DESC);


-- ╔═══════════════════════════════════════╗
-- ║  11. SAMPLE TUTOR DATA (10 tutors)    ║
-- ╚═══════════════════════════════════════╝
-- Pricing: Year 1-6 = $13, Year 7-10 = $20, Year 11-12 = $27, Special = $27

INSERT INTO tutors (name, subjects, price_hour, rating, sessions_count, status) VALUES
    (
        'Dr. Sarah Mitchell',
        ARRAY['Mathematics', 'Physics', 'Statistics'],
        27,                -- Year 11-12 Advanced
        4.9,
        342,
        'active'
    ),
    (
        'James O''Connor',
        ARRAY['English', 'Literature', 'Creative Writing'],
        20,                -- Year 7-10 Intermediate
        4.8,
        215,
        'active'
    ),
    (
        'Priya Sharma',
        ARRAY['Chemistry', 'Biology', 'Environmental Science'],
        20,                -- Year 7-10 Intermediate
        4.7,
        189,
        'active'
    ),
    (
        'Michael Chen',
        ARRAY['Mathematics', 'Computer Science', 'Coding'],
        27,                -- Year 11-12 Advanced
        4.9,
        410,
        'active'
    ),
    (
        'Emma Williams',
        ARRAY['French', 'Spanish', 'German'],
        20,                -- Year 7-10 Intermediate
        4.6,
        156,
        'active'
    ),
    (
        'Dr. Anil Kapoor',
        ARRAY['Physics', 'Mathematics', 'Engineering'],
        27,                -- Year 11-12 Advanced
        4.8,
        298,
        'active'
    ),
    (
        'Lisa Thompson',
        ARRAY['History', 'Geography', 'Social Studies'],
        13,                -- Year 1-6 Foundation
        4.7,
        178,
        'active'
    ),
    (
        'Rachel Green',
        ARRAY['Art', 'Design', 'Music'],
        13,                -- Year 1-6 Foundation
        4.5,
        124,
        'active'
    ),
    (
        'David Park',
        ARRAY['Special Needs', 'Literacy', 'Numeracy'],
        27,                -- Special Needs Inclusive
        4.9,
        267,
        'active'
    ),
    (
        'Sophie Anderson',
        ARRAY['Biology', 'Health Science', 'Psychology'],
        20,                -- Year 7-10 Intermediate
        4.6,
        143,
        'active'
    );


-- ═══════════════════════════════════════════════════════════════════════
-- ✅ SCHEMA COMPLETE!
--
-- ┌──────────────┬──────────────────────────────────────────────┐
-- │ Tables       │ tutors, bookings, enquiries                  │
-- │ RLS          │ Enabled on all 3 tables                      │
-- │ Policies     │ 5 policies (read tutors, CRUD bookings,      │
-- │              │ insert enquiries)                             │
-- │ Indexes      │ 5 performance indexes                        │
-- │ Sample Data  │ 10 tutors with correct pricing               │
-- └──────────────┴──────────────────────────────────────────────┘
--
-- Pricing Map:
--   Year 1-6:       $13/hr  (Lisa Thompson, Rachel Green)
--   Year 7-10:      $20/hr  (James, Priya, Emma, Sophie)
--   Year 11-12:     $27/hr  (Dr. Sarah, Michael, Dr. Anil)
--   Special Needs:  $27/hr  (David Park)
--
-- Next: Update config.js with your Supabase URL + anon key, then open index.html
-- ═══════════════════════════════════════════════════════════════════════
