-- ═══════════════════════════════════════════════════════════════════════
-- ZENITH PRANAVI (ZPed.org) — Complete Database Schema v3
-- Google Meet support + Admin for v72653666@gmail.com
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"  
-- 3. Paste this ENTIRE file
-- 4. Click "Run" (or Ctrl+Enter)
--
-- WARNING: This drops and recreates all tables.
-- If you already have data, use the MIGRATION section at bottom instead.
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


-- ╔═══════════════════════════════════════╗
-- ║  4. BOOKINGS TABLE (with Google Meet) ║
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
    google_meet     BOOLEAN DEFAULT true,
    meet_link       TEXT DEFAULT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


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


-- ╔═══════════════════════════════════════╗
-- ║  6. ENABLE ROW LEVEL SECURITY         ║
-- ╚═══════════════════════════════════════╝

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;


-- ╔═══════════════════════════════════════╗
-- ║  7. RLS POLICIES — TUTORS             ║
-- ╚═══════════════════════════════════════╝

CREATE POLICY "Allow public read on tutors"
    ON tutors FOR SELECT USING (true);


-- ╔═══════════════════════════════════════╗
-- ║  8. RLS POLICIES — BOOKINGS           ║
-- ╚═══════════════════════════════════════╝

-- Users insert their own bookings
CREATE POLICY "Allow authenticated users to insert bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Users see their own bookings
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE
    USING (auth.uid() = user_id);

-- ADMIN: Can read ALL bookings
CREATE POLICY "Admin can read all bookings"
    ON bookings FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com',
            'admin@zped.org',
            'vidhyadharanss@gmail.com'
        )
    );

-- ADMIN: Can update ALL bookings (confirm, cancel, complete, add meet link)
CREATE POLICY "Admin can update all bookings"
    ON bookings FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com',
            'admin@zped.org',
            'vidhyadharanss@gmail.com'
        )
    );


-- ╔═══════════════════════════════════════╗
-- ║  9. RLS POLICIES — ENQUIRIES          ║
-- ╚═══════════════════════════════════════╝

-- Anyone can submit an enquiry
CREATE POLICY "Allow public insert on enquiries"
    ON enquiries FOR INSERT
    WITH CHECK (true);

-- ADMIN: Can read ALL enquiries
CREATE POLICY "Admin can read all enquiries"
    ON enquiries FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com',
            'admin@zped.org',
            'vidhyadharanss@gmail.com'
        )
    );

-- ADMIN: Can delete enquiries
CREATE POLICY "Admin can delete enquiries"
    ON enquiries FOR DELETE
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com',
            'admin@zped.org',
            'vidhyadharanss@gmail.com'
        )
    );


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

INSERT INTO tutors (name, subjects, price_hour, rating, sessions_count, status) VALUES
    ('Dr. Sarah Mitchell', ARRAY['Mathematics', 'Physics', 'Statistics'], 27, 4.9, 342, 'active'),
    ('James O''Connor', ARRAY['English', 'Literature', 'Creative Writing'], 20, 4.8, 215, 'active'),
    ('Priya Sharma', ARRAY['Chemistry', 'Biology', 'Environmental Science'], 20, 4.7, 189, 'active'),
    ('Michael Chen', ARRAY['Mathematics', 'Computer Science', 'Coding'], 27, 4.9, 410, 'active'),
    ('Emma Williams', ARRAY['French', 'Spanish', 'German'], 20, 4.6, 156, 'active'),
    ('Dr. Anil Kapoor', ARRAY['Physics', 'Mathematics', 'Engineering'], 27, 4.8, 298, 'active'),
    ('Lisa Thompson', ARRAY['History', 'Geography', 'Social Studies'], 13, 4.7, 178, 'active'),
    ('Rachel Green', ARRAY['Art', 'Design', 'Music'], 13, 4.5, 124, 'active'),
    ('David Park', ARRAY['Special Needs', 'Literacy', 'Numeracy'], 27, 4.9, 267, 'active'),
    ('Sophie Anderson', ARRAY['Biology', 'Health Science', 'Psychology'], 20, 4.6, 143, 'active');


-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION ONLY — If you already have data, run ONLY this section:
-- ═══════════════════════════════════════════════════════════════════════
-- 
-- -- Add Google Meet columns to existing bookings table
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_meet BOOLEAN DEFAULT true;
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meet_link TEXT DEFAULT NULL;
-- 
-- -- Add admin policies for v72653666@gmail.com
-- CREATE POLICY "Admin v72653666 can read all bookings"
--     ON bookings FOR SELECT
--     USING (auth.jwt() ->> 'email' = 'v72653666@gmail.com');
-- 
-- CREATE POLICY "Admin v72653666 can update all bookings"
--     ON bookings FOR UPDATE
--     USING (auth.jwt() ->> 'email' = 'v72653666@gmail.com');
-- 
-- CREATE POLICY "Admin v72653666 can read all enquiries"
--     ON enquiries FOR SELECT
--     USING (auth.jwt() ->> 'email' = 'v72653666@gmail.com');
-- 
-- CREATE POLICY "Admin v72653666 can delete enquiries"
--     ON enquiries FOR DELETE
--     USING (auth.jwt() ->> 'email' = 'v72653666@gmail.com');
-- ═══════════════════════════════════════════════════════════════════════
