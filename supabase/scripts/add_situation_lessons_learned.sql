-- Migration: Add situation and lessons_learned columns to activities table
-- This separates the report into two sections:
-- 1. situation: Description of the situation
-- 2. lessons_learned: What was learned, consequences for next time

-- Add new columns
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS situation TEXT,
ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Migrate existing description data to situation column (optional - uncomment if desired)
-- UPDATE activities SET situation = description WHERE description IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN activities.situation IS 'Description of the situation during the activity';
COMMENT ON COLUMN activities.lessons_learned IS 'What was learned and consequences for next time';
