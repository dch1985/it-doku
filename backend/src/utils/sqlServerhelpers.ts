// backend/src/utils/sqlServerHelpers.ts
// Helper functions für SQL Server (Arrays als JSON)

/**
 * Konvertiert ein Array zu JSON String für SQL Server
 */
export function arrayToJson<T>(arr: T[]): string {
  return JSON.stringify(arr);
}

/**
 * Konvertiert JSON String zurück zu Array
 */
export function jsonToArray<T>(json: string | null): T[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse JSON array:', error);
    return [];
  }
}

/**
 * Konvertiert ein Object zu JSON String
 */
export function objectToJson<T extends Record<string, any>>(obj: T): string {
  return JSON.stringify(obj);
}

/**
 * Konvertiert JSON String zurück zu Object
 */
export function jsonToObject<T extends Record<string, any>>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Failed to parse JSON object:', error);
    return null;
  }
}

/**
 * Document Helper - Tags
 */
export function serializeDocumentTags(tags: string[]): string {
  return arrayToJson(tags);
}

export function deserializeDocumentTags(tagsJson: string | null): string[] {
  return jsonToArray<string>(tagsJson);
}

/**
 * Vector Embeddings Helper
 */
export function serializeEmbedding(embedding: number[]): string {
  return arrayToJson(embedding);
}

export function deserializeEmbedding(embeddingJson: string | null): number[] {
  return jsonToArray<number>(embeddingJson);
}

/**
 * Knowledge Node Connections Helper
 */
export function serializeConnections(connections: string[]): string {
  return arrayToJson(connections);
}

export function deserializeConnections(connectionsJson: string | null): string[] {
  return jsonToArray<string>(connectionsJson);
}

/**
 * Metadata Helper
 */
export function serializeMetadata(metadata: Record<string, any>): string {
  return objectToJson(metadata);
}

export function deserializeMetadata<T extends Record<string, any>>(metadataJson: string | null): T | null {
  return jsonToObject<T>(metadataJson);
}

/**
 * Beispiel Usage in Prisma Queries:
 * 
 * // CREATE
 * const document = await prisma.document.create({
 *   data: {
 *     title: 'My Doc',
 *     tags: serializeDocumentTags(['typescript', 'azure']),
 *     metadata: serializeMetadata({ author: 'Driss' })
 *   }
 * });
 * 
 * // READ
 * const doc = await prisma.document.findUnique({ where: { id: '...' } });
 * const tags = deserializeDocumentTags(doc.tags);
 * const metadata = deserializeMetadata(doc.metadata);
 */