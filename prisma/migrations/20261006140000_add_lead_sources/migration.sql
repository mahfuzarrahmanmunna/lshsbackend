CREATE TABLE IF NOT EXISTS "lead_sources" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lead_sources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lead_sources_name_key" ON "lead_sources"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_sources_code_key" ON "lead_sources"("code");

INSERT INTO "lead_sources" ("name", "code", "updatedAt")
VALUES
  ('Manual', 'MANUAL', CURRENT_TIMESTAMP),
  ('Meta Ads', 'META_ADS', CURRENT_TIMESTAMP),
  ('Website', 'WEBSITE', CURRENT_TIMESTAMP),
  ('WhatsApp', 'WHATSAPP', CURRENT_TIMESTAMP),
  ('Google Ads', 'GOOGLE_ADS', CURRENT_TIMESTAMP),
  ('Referral', 'REFERRAL', CURRENT_TIMESTAMP),
  ('Email', 'EMAIL', CURRENT_TIMESTAMP),
  ('Phone', 'PHONE', CURRENT_TIMESTAMP),
  ('Other', 'OTHER', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_sourceId_fkey'
  ) THEN
    ALTER TABLE "leads"
    ADD CONSTRAINT "leads_sourceId_fkey"
    FOREIGN KEY ("sourceId") REFERENCES "lead_sources"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
