-- Preserve legacy lead data while bringing the leads table in line with the
-- current Prisma Lead model.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT;

CREATE TYPE "LeadStage" AS ENUM (
  'NEW',
  'INITIAL_CONTACT',
  'FOLLOW_UP',
  'QUALIFIED',
  'INTERESTED',
  'APPLICATION',
  'BOOKING',
  'WON',
  'LOST'
);

CREATE TYPE "LeadStatus_new" AS ENUM (
  'ACTIVE',
  'CONVERTED',
  'LOST',
  'NO_RESPONSE',
  'NOT_INTERESTED',
  'INVALID'
);

CREATE TYPE "LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');
CREATE TYPE "LeadPriority" AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "LeadQuality" AS ENUM (
  'TOP_QUALITY',
  'HIGH_QUALITY',
  'MEDIUM_QUALITY',
  'LOW_QUALITY',
  'IRRELEVANT'
);
CREATE TYPE "EducationLevel" AS ENUM (
  'HIGH_SCHOOL',
  'DIPLOMA',
  'BACHELORS',
  'MASTERS',
  'PHD',
  'OTHER'
);
CREATE TYPE "LostReason" AS ENUM (
  'NO_RESPONSE',
  'NOT_INTERESTED',
  'INVALID_INFO',
  'DUPLICATE',
  'PRICE',
  'OTHER'
);

ALTER TABLE "leads"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "sourceId" INTEGER,
ADD COLUMN "externalLeadId" TEXT,
ADD COLUMN "highestEducation" "EducationLevel",
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "workExperienceYears" INTEGER,
ADD COLUMN "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
ADD COLUMN "temperature" "LeadTemperature",
ADD COLUMN "priority" "LeadPriority",
ADD COLUMN "quality" "LeadQuality",
ADD COLUMN "lostNote" TEXT,
ADD COLUMN "convertedAt" TIMESTAMP(3),
ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "leads"
SET
  "firstName" = COALESCE(
    NULLIF(split_part(trim("fullName"), ' ', 1), ''),
    'Unknown'
  ),
  "lastName" = NULLIF(
    trim(regexp_replace(trim("fullName"), '^\S+\s*', '')),
    ''
  );

ALTER TABLE "leads"
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "courseInterest" DROP NOT NULL;

UPDATE "leads"
SET "lostNote" = "lostReason"
WHERE "lostReason" IS NOT NULL;

ALTER TABLE "leads"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "LeadStatus_new"
USING (
  CASE "status"::TEXT
    WHEN 'ENROLLED' THEN 'CONVERTED'
    WHEN 'LOST' THEN 'LOST'
    ELSE 'ACTIVE'
  END
)::"LeadStatus_new";

DROP TYPE "LeadStatus";
ALTER TYPE "LeadStatus_new" RENAME TO "LeadStatus";

ALTER TABLE "leads"
ALTER COLUMN "status" SET DEFAULT 'ACTIVE',
ALTER COLUMN "lostReason" TYPE "LostReason"
USING (
  CASE upper(replace(COALESCE("lostReason", ''), ' ', '_'))
    WHEN 'NO_RESPONSE' THEN 'NO_RESPONSE'
    WHEN 'NOT_INTERESTED' THEN 'NOT_INTERESTED'
    WHEN 'INVALID_INFO' THEN 'INVALID_INFO'
    WHEN 'DUPLICATE' THEN 'DUPLICATE'
    WHEN 'PRICE' THEN 'PRICE'
    WHEN '' THEN NULL
    ELSE 'OTHER'
  END
)::"LostReason";

CREATE INDEX "leads_email_idx" ON "leads"("email");
CREATE INDEX "leads_phone_idx" ON "leads"("phone");
CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_stage_idx" ON "leads"("stage");
CREATE INDEX "leads_temperature_idx" ON "leads"("temperature");
CREATE INDEX "leads_priority_idx" ON "leads"("priority");
CREATE INDEX "leads_quality_idx" ON "leads"("quality");
CREATE INDEX "leads_country_idx" ON "leads"("country");
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");
CREATE INDEX "leads_deletedAt_idx" ON "leads"("deletedAt");
CREATE INDEX "leads_externalLeadId_idx" ON "leads"("externalLeadId");
