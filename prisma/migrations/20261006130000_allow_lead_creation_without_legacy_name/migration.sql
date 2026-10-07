-- New leads store names in firstName and lastName. The legacy fullName
-- column remains for existing rows, but must not block inserts from Prisma.
ALTER TABLE "leads"
ALTER COLUMN "fullName" DROP NOT NULL;
