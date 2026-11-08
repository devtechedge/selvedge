-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "studio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loom" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shafts" INTEGER NOT NULL,
    "treadles" INTEGER NOT NULL,
    "reedWidthCm" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yarn_lot" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiber" TEXT NOT NULL,
    "dyeRecipe" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "lengthOnHandM" INTEGER NOT NULL,
    "reorderM" INTEGER NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "yarn_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shafts" INTEGER NOT NULL,
    "treadles" INTEGER NOT NULL,
    "ends" INTEGER NOT NULL,
    "picks" INTEGER NOT NULL,
    "threading" JSONB NOT NULL,
    "tieUp" JSONB NOT NULL,
    "treadling" JSONB NOT NULL,
    "warpColors" JSONB NOT NULL,
    "weftColors" JSONB NOT NULL,
    "settEpi" INTEGER NOT NULL,
    "reedWidthCm" INTEGER NOT NULL,
    "warpLengthCm" INTEGER NOT NULL,
    "takeUpPct" INTEGER NOT NULL,
    "shrinkagePct" INTEGER NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "loomId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WARP',
    "picksWoven" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "yarnLotId" TEXT NOT NULL,
    "lengthM" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finishing_log" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "measuredShrinkagePct" INTEGER NOT NULL,
    "finalWidthCm" INTEGER NOT NULL,
    "finalLengthCm" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finishing_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studio_slug_key" ON "studio"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "membership_userId_idx" ON "membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_studioId_userId_key" ON "membership"("studioId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_tokenHash_key" ON "session"("tokenHash");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "session_expiresAt_idx" ON "session"("expiresAt");

-- CreateIndex
CREATE INDEX "loom_studioId_idx" ON "loom"("studioId");

-- CreateIndex
CREATE INDEX "yarn_lot_studioId_active_idx" ON "yarn_lot"("studioId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "yarn_lot_studioId_code_key" ON "yarn_lot"("studioId", "code");

-- CreateIndex
CREATE INDEX "draft_studioId_idx" ON "draft"("studioId");

-- CreateIndex
CREATE INDEX "project_studioId_status_idx" ON "project"("studioId", "status");

-- CreateIndex
CREATE INDEX "project_draftId_idx" ON "project"("draftId");

-- CreateIndex
CREATE INDEX "reservation_studioId_yarnLotId_idx" ON "reservation"("studioId", "yarnLotId");

-- CreateIndex
CREATE INDEX "reservation_projectId_idx" ON "reservation"("projectId");

-- CreateIndex
CREATE INDEX "finishing_log_projectId_idx" ON "finishing_log"("projectId");

-- CreateIndex
CREATE INDEX "release_studioId_idx" ON "release"("studioId");

-- CreateIndex
CREATE UNIQUE INDEX "release_draftId_version_key" ON "release"("draftId", "version");

-- CreateIndex
CREATE INDEX "audit_event_studioId_createdAt_idx" ON "audit_event"("studioId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_event_entityType_entityId_idx" ON "audit_event"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loom" ADD CONSTRAINT "loom_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yarn_lot" ADD CONSTRAINT "yarn_lot_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft" ADD CONSTRAINT "draft_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft" ADD CONSTRAINT "draft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "draft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_loomId_fkey" FOREIGN KEY ("loomId") REFERENCES "loom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_yarnLotId_fkey" FOREIGN KEY ("yarnLotId") REFERENCES "yarn_lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finishing_log" ADD CONSTRAINT "finishing_log_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finishing_log" ADD CONSTRAINT "finishing_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release" ADD CONSTRAINT "release_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release" ADD CONSTRAINT "release_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "draft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release" ADD CONSTRAINT "release_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraints
-- The yarn length floor is the database-level backstop against overdraw: even a
-- racing reservation cannot push a dye lot below zero.
ALTER TABLE "yarn_lot" ADD CONSTRAINT "yarn_lot_length_nonnegative" CHECK ("lengthOnHandM" >= 0);
ALTER TABLE "yarn_lot" ADD CONSTRAINT "yarn_lot_reorder_nonnegative" CHECK ("reorderM" >= 0);
ALTER TABLE "membership" ADD CONSTRAINT "membership_role_check" CHECK ("role" IN ('WEAVER', 'DYER', 'MANAGER'));
ALTER TABLE "loom" ADD CONSTRAINT "loom_status_check" CHECK ("status" IN ('AVAILABLE', 'DRESSED', 'MAINTENANCE'));
ALTER TABLE "loom" ADD CONSTRAINT "loom_shafts_check" CHECK ("shafts" >= 2);
ALTER TABLE "loom" ADD CONSTRAINT "loom_treadles_check" CHECK ("treadles" >= 1);
ALTER TABLE "loom" ADD CONSTRAINT "loom_reed_width_check" CHECK ("reedWidthCm" > 0);
ALTER TABLE "project" ADD CONSTRAINT "project_status_check" CHECK ("status" IN ('WARP', 'THREADED', 'WEAVING', 'FINISHED'));
ALTER TABLE "project" ADD CONSTRAINT "project_picks_nonnegative" CHECK ("picksWoven" >= 0);
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_reason_check" CHECK ("reason" IN ('WARP', 'WEFT', 'ADJUSTMENT', 'RELEASE'));
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_length_positive" CHECK ("lengthM" > 0);
ALTER TABLE "draft" ADD CONSTRAINT "draft_revision_positive" CHECK ("revision" >= 1);
ALTER TABLE "draft" ADD CONSTRAINT "draft_ends_positive" CHECK ("ends" > 0);
ALTER TABLE "draft" ADD CONSTRAINT "draft_picks_positive" CHECK ("picks" > 0);
ALTER TABLE "draft" ADD CONSTRAINT "draft_shafts_check" CHECK ("shafts" >= 2);
ALTER TABLE "draft" ADD CONSTRAINT "draft_sett_positive" CHECK ("settEpi" > 0);
ALTER TABLE "release" ADD CONSTRAINT "release_version_positive" CHECK ("version" >= 1);
