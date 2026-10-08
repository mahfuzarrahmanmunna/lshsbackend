ALTER TABLE "lead_follow_ups"
ADD COLUMN IF NOT EXISTS "nextFollowUpAt" TIMESTAMP(3);
