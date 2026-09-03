-- ═══════════════════════════════════════════════════════════════════════
-- ZENITH PRANAVI (ZPed.org) — Enhanced Database Schema v4
-- Adds: session_reviews, notifications, student_progress, session_notes
-- Run AFTER the base schema.sql and audit-logs-migration.sql
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ╔═══════════════════════════════════════╗
-- ║  SESSION REVIEWS                      ║
-- ╚═══════════════════════════════════════╝
-- Students can rate & review their tutoring sessions

CREATE TABLE IF NOT EXISTS session_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text     TEXT DEFAULT '',
    tutor_name      TEXT NOT NULL,
    subject         TEXT NOT NULL,
    is_public       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(booking_id)  -- One review per booking
);

ALTER TABLE session_reviews ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
    ON session_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews"
    ON session_reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can read their own reviews
CREATE POLICY "Users can read own reviews"
    ON session_reviews FOR SELECT
    USING (auth.uid() = user_id);

-- Public reviews are visible to everyone
CREATE POLICY "Public reviews are readable"
    ON session_reviews FOR SELECT
    USING (is_public = true);

-- Admins can read all reviews
CREATE POLICY "Admin can read all reviews"
    ON session_reviews FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com', 'admin@zped.org',
            'vidhyadharanss@gmail.com', 'zenithpranavi786@gmail.com'
        )
    );

-- ╔═══════════════════════════════════════╗
-- ║  NOTIFICATIONS                        ║
-- ╚═══════════════════════════════════════╝
-- In-app notifications for users

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL DEFAULT 'info'
                    CHECK (type IN ('info', 'success', 'warning', 'booking', 'review', 'system')),
    title           TEXT NOT NULL,
    message         TEXT NOT NULL DEFAULT '',
    is_read         BOOLEAN DEFAULT false,
    action_url      TEXT DEFAULT NULL,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- System can insert notifications for any user (via service role or RPC)
CREATE POLICY "Authenticated users can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- ╔═══════════════════════════════════════╗
-- ║  STUDENT PROGRESS TRACKING            ║
-- ╚═══════════════════════════════════════╝
-- Tracks learning milestones and session statistics

CREATE TABLE IF NOT EXISTS student_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject         TEXT NOT NULL,
    sessions_completed INTEGER DEFAULT 0,
    total_hours     NUMERIC(6,1) DEFAULT 0,
    avg_rating      NUMERIC(2,1) DEFAULT NULL,
    notes           TEXT DEFAULT '',
    milestones      JSONB DEFAULT '[]',
    last_session_at TIMESTAMPTZ DEFAULT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, subject)
);

ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own progress
CREATE POLICY "Users can read own progress"
    ON student_progress FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
    ON student_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
    ON student_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can read all progress
CREATE POLICY "Admin can read all progress"
    ON student_progress FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN (
            'v72653666@gmail.com', 'admin@zped.org',
            'vidhyadharanss@gmail.com', 'zenithpranavi786@gmail.com'
        )
    );

-- ╔═══════════════════════════════════════╗
-- ║  PERFORMANCE INDEXES                   ║
-- ╚═══════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_reviews_booking ON session_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON session_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tutor ON session_reviews(tutor_name);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON session_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON session_reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_user ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_subject ON student_progress(subject);
CREATE INDEX IF NOT EXISTS idx_progress_updated ON student_progress(updated_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- DONE! Enhanced tables ready for the upgraded platform.
-- ═══════════════════════════════════════════════════════════════════════
