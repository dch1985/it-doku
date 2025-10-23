-- CreateTable
CREATE TABLE "GeneratedDocumentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryUrl" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT,
    "language" TEXT NOT NULL DEFAULT 'typescript',
    "description" TEXT NOT NULL,
    "functions" JSONB,
    "dependencies" TEXT,
    "usageExamples" TEXT,
    "codeSnippet" TEXT,
    "confidence" REAL,
    "tokensUsed" INTEGER,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "GeneratedDocumentation_repositoryUrl_idx" ON "GeneratedDocumentation"("repositoryUrl");

-- CreateIndex
CREATE INDEX "GeneratedDocumentation_filePath_idx" ON "GeneratedDocumentation"("filePath");

-- CreateIndex
CREATE INDEX "GeneratedDocumentation_generatedAt_idx" ON "GeneratedDocumentation"("generatedAt");
