DO $$
BEGIN
  CREATE TYPE "LeadActivityType" AS ENUM (
    'CALL',
    'WHATSAPP',
    'EMAIL',
    'SMS',
    'MEETING',
    'NOTE',
    'STATUS_CHANGE',
    'STAGE_CHANGE',
    'ASSIGNMENT',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LeadActivityResult" AS ENUM (
    'CONNECTED',
    'NO_RESPONSE',
    'RESPONDED',
    'INVALID',
    'PROVIDED_INFORMATION',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "FollowUpType" AS ENUM (
    'CALL',
    'WHATSAPP',
    'EMAIL',
    'SMS',
    'MEETING',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "FollowUpStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'MISSED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "lead_program_interests" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "courseId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_program_interests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_program_interests_leadId_courseId_key"
  ON "lead_program_interests" ("leadId", "courseId");
CREATE INDEX IF NOT EXISTS "lead_program_interests_courseId_idx"
  ON "lead_program_interests" ("courseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_program_interests_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_program_interests"
      ADD CONSTRAINT "lead_program_interests_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_program_interests_courseId_fkey'
  ) THEN
    ALTER TABLE "lead_program_interests"
      ADD CONSTRAINT "lead_program_interests_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "courses"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lead_assignments" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "assignedToId" INTEGER NOT NULL,
  "assignedById" INTEGER,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note" TEXT,
  CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_assignments_leadId_idx"
  ON "lead_assignments" ("leadId");
CREATE INDEX IF NOT EXISTS "lead_assignments_assignedToId_idx"
  ON "lead_assignments" ("assignedToId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_assignments_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_assignments"
      ADD CONSTRAINT "lead_assignments_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_assignments_assignedToId_fkey'
  ) THEN
    ALTER TABLE "lead_assignments"
      ADD CONSTRAINT "lead_assignments_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_assignments_assignedById_fkey'
  ) THEN
    ALTER TABLE "lead_assignments"
      ADD CONSTRAINT "lead_assignments_assignedById_fkey"
      FOREIGN KEY ("assignedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lead_activities" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "userId" INTEGER,
  "type" "LeadActivityType" NOT NULL,
  "result" "LeadActivityResult",
  "description" TEXT,
  "durationSeconds" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_activities_leadId_idx"
  ON "lead_activities" ("leadId");
CREATE INDEX IF NOT EXISTS "lead_activities_userId_idx"
  ON "lead_activities" ("userId");
CREATE INDEX IF NOT EXISTS "lead_activities_type_idx"
  ON "lead_activities" ("type");
CREATE INDEX IF NOT EXISTS "lead_activities_createdAt_idx"
  ON "lead_activities" ("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_activities_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_activities"
      ADD CONSTRAINT "lead_activities_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_activities_userId_fkey'
  ) THEN
    ALTER TABLE "lead_activities"
      ADD CONSTRAINT "lead_activities_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lead_follow_ups" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "assignedToId" INTEGER,
  "followUpNumber" INTEGER NOT NULL,
  "type" "FollowUpType" NOT NULL DEFAULT 'CALL',
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
  "outcome" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lead_follow_ups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_follow_ups_leadId_followUpNumber_key"
  ON "lead_follow_ups" ("leadId", "followUpNumber");
CREATE INDEX IF NOT EXISTS "lead_follow_ups_leadId_idx"
  ON "lead_follow_ups" ("leadId");
CREATE INDEX IF NOT EXISTS "lead_follow_ups_assignedToId_idx"
  ON "lead_follow_ups" ("assignedToId");
CREATE INDEX IF NOT EXISTS "lead_follow_ups_status_idx"
  ON "lead_follow_ups" ("status");
CREATE INDEX IF NOT EXISTS "lead_follow_ups_scheduledAt_idx"
  ON "lead_follow_ups" ("scheduledAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_follow_ups_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_follow_ups"
      ADD CONSTRAINT "lead_follow_ups_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_follow_ups_assignedToId_fkey'
  ) THEN
    ALTER TABLE "lead_follow_ups"
      ADD CONSTRAINT "lead_follow_ups_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lead_notes" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "userId" INTEGER,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_notes_leadId_idx"
  ON "lead_notes" ("leadId");
CREATE INDEX IF NOT EXISTS "lead_notes_userId_idx"
  ON "lead_notes" ("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_notes_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_notes"
      ADD CONSTRAINT "lead_notes_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_notes_userId_fkey'
  ) THEN
    ALTER TABLE "lead_notes"
      ADD CONSTRAINT "lead_notes_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lead_status_history" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "oldStatus" "LeadStatus",
  "newStatus" "LeadStatus" NOT NULL,
  "changedById" INTEGER,
  "reason" TEXT,
  "lostReason" "LostReason",
  "lostNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_status_history_leadId_idx"
  ON "lead_status_history" ("leadId");
CREATE INDEX IF NOT EXISTS "lead_status_history_newStatus_idx"
  ON "lead_status_history" ("newStatus");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_status_history_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_status_history"
      ADD CONSTRAINT "lead_status_history_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_status_history_changedById_fkey'
  ) THEN
    ALTER TABLE "lead_status_history"
      ADD CONSTRAINT "lead_status_history_changedById_fkey"
      FOREIGN KEY ("changedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lead_stage_history" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "oldStage" "LeadStage",
  "newStage" "LeadStage" NOT NULL,
  "changedById" INTEGER,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lead_stage_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lead_stage_history_leadId_idx"
  ON "lead_stage_history" ("leadId");
CREATE INDEX IF NOT EXISTS "lead_stage_history_newStage_idx"
  ON "lead_stage_history" ("newStage");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_stage_history_leadId_fkey'
  ) THEN
    ALTER TABLE "lead_stage_history"
      ADD CONSTRAINT "lead_stage_history_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "leads"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_stage_history_changedById_fkey'
  ) THEN
    ALTER TABLE "lead_stage_history"
      ADD CONSTRAINT "lead_stage_history_changedById_fkey"
      FOREIGN KEY ("changedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
