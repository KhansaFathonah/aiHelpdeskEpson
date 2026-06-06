ALTER TABLE "EscalationTicket"
ADD COLUMN "confidenceScore" DOUBLE PRECISION,
ADD COLUMN "escalationReason" TEXT;

CREATE INDEX "EscalationTicket_escalationReason_idx" ON "EscalationTicket"("escalationReason");
