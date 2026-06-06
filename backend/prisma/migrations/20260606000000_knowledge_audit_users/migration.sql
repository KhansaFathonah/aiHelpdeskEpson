ALTER TABLE "KnowledgeDocument" ADD COLUMN "createdById" TEXT;
ALTER TABLE "KnowledgeDocument" ADD COLUMN "updatedById" TEXT;

CREATE INDEX "KnowledgeDocument_createdById_idx" ON "KnowledgeDocument"("createdById");
CREATE INDEX "KnowledgeDocument_updatedById_idx" ON "KnowledgeDocument"("updatedById");

ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
