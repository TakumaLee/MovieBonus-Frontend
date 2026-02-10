-- 2026-02-10: Enable RLS for MovieBonus core tables
-- Safe, idempotent migration

-- feedback tables
ALTER TABLE IF EXISTS feedback_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bonus_completion_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS movies ENABLE ROW LEVEL SECURITY;

-- Public can submit feedback
DROP POLICY IF EXISTS "public_insert_user_feedbacks" ON user_feedbacks;
CREATE POLICY "public_insert_user_feedbacks"
ON user_feedbacks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public can read feedback types
DROP POLICY IF EXISTS "public_select_feedback_types" ON feedback_types;
CREATE POLICY "public_select_feedback_types"
ON feedback_types
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Only authenticated users can read/modify feedback records (admin UI should use authenticated context)
DROP POLICY IF EXISTS "auth_select_user_feedbacks" ON user_feedbacks;
CREATE POLICY "auth_select_user_feedbacks"
ON user_feedbacks
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_update_user_feedbacks" ON user_feedbacks;
CREATE POLICY "auth_update_user_feedbacks"
ON user_feedbacks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Child feedback tables limited to authenticated read/write
DROP POLICY IF EXISTS "auth_all_feedback_attachments" ON feedback_attachments;
CREATE POLICY "auth_all_feedback_attachments"
ON feedback_attachments
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_feedback_activity_logs" ON feedback_activity_logs;
CREATE POLICY "auth_all_feedback_activity_logs"
ON feedback_activity_logs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_bonus_completion_details" ON bonus_completion_details;
CREATE POLICY "auth_all_bonus_completion_details"
ON bonus_completion_details
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Movies readable by everyone, mutable only authenticated
DROP POLICY IF EXISTS "public_select_movies" ON movies;
CREATE POLICY "public_select_movies"
ON movies
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "auth_modify_movies" ON movies;
CREATE POLICY "auth_modify_movies"
ON movies
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Admin sessions should never be public
DROP POLICY IF EXISTS "auth_all_admin_sessions" ON admin_sessions;
CREATE POLICY "auth_all_admin_sessions"
ON admin_sessions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
