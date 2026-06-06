UPDATE "KnowledgeDocument"
SET
  "createdById" = COALESCE(
    "createdById",
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1)
  ),
  "updatedById" = COALESCE(
    "updatedById",
    (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1)
  )
WHERE "createdById" IS NULL OR "updatedById" IS NULL;
