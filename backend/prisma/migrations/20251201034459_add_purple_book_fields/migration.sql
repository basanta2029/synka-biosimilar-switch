-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_drugs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "costPerMonth" REAL NOT NULL,
    "approvedForSwitch" BOOLEAN NOT NULL DEFAULT true,
    "therapeuticClass" TEXT NOT NULL,
    "manufacturer" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeIngredient" TEXT,
    "fdaSuffix" TEXT,
    "blaNumber" TEXT,
    "fdaApprovalDate" DATETIME,
    "interchangeability" TEXT NOT NULL DEFAULT 'NOT_APPLICABLE',
    "referenceProductId" TEXT,
    "indications" TEXT,
    "administrationRoute" TEXT,
    CONSTRAINT "drugs_referenceProductId_fkey" FOREIGN KEY ("referenceProductId") REFERENCES "drugs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_drugs" ("approvedForSwitch", "costPerMonth", "createdAt", "description", "id", "manufacturer", "name", "therapeuticClass", "type") SELECT "approvedForSwitch", "costPerMonth", "createdAt", "description", "id", "manufacturer", "name", "therapeuticClass", "type" FROM "drugs";
DROP TABLE "drugs";
ALTER TABLE "new_drugs" RENAME TO "drugs";
CREATE INDEX "drugs_type_therapeuticClass_idx" ON "drugs"("type", "therapeuticClass");
CREATE INDEX "drugs_activeIngredient_idx" ON "drugs"("activeIngredient");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
