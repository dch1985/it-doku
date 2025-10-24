-- Initialize database schema manually
-- This is a workaround for Prisma generation issues

-- Drop existing tables if they exist
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS GeneratedDocumentation;

-- Create Document table
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    tags TEXT DEFAULT '[]',
    author TEXT DEFAULT 'System',
    status TEXT DEFAULT 'draft',
    priority TEXT DEFAULT 'MEDIUM',
    version INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create GeneratedDocumentation table
CREATE TABLE GeneratedDocumentation (
    id TEXT PRIMARY KEY,
    repositoryUrl TEXT NOT NULL,
    filePath TEXT NOT NULL,
    fileName TEXT,
    language TEXT DEFAULT 'typescript',
    description TEXT,
    functions TEXT,
    dependencies TEXT,
    usageExamples TEXT,
    codeSnippet TEXT,
    confidence REAL,
    tokensUsed INTEGER,
    generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_generated_docs_repo ON GeneratedDocumentation(repositoryUrl);
CREATE INDEX idx_generated_docs_file ON GeneratedDocumentation(filePath);
CREATE INDEX idx_generated_docs_date ON GeneratedDocumentation(generatedAt);
