-- CreateTable
CREATE TABLE "waitlist_entry" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'developer',
    "confirmationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entry_email_key" ON "waitlist_entry"("email");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entry_confirmationId_key" ON "waitlist_entry"("confirmationId");

-- CreateIndex
CREATE INDEX "waitlist_entry_createdAt_idx" ON "waitlist_entry"("createdAt");
