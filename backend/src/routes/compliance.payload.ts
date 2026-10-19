type ReviewUpdateBodyLike = {
  [key: string]: unknown;
  comments?: string | null;
} | null | undefined;

/**
 * Keeps PATCH semantics for nullable review comments:
 * - omitted field => do not modify stored comment
 * - explicit null => clear stored comment
 * - string => update stored comment
 */
export function parseReviewComments(body: ReviewUpdateBodyLike): string | null | undefined {
  if (!body || !Object.prototype.hasOwnProperty.call(body, 'comments')) {
    return undefined;
  }

  return body.comments ?? null;
}
