export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

export type NormalizedReviewUpdatePayload = {
  status?: string;
  comments?: string | null;
};

export function normalizeReviewUpdatePayload(
  body: UpdateReviewBody | null | undefined,
): NormalizedReviewUpdatePayload {
  const normalized: NormalizedReviewUpdatePayload = {};

  if (body?.status !== undefined) {
    normalized.status = String(body.status).toUpperCase();
  }

  if (body && Object.prototype.hasOwnProperty.call(body, 'comments')) {
    normalized.comments = typeof body.comments === 'string' ? body.comments : body.comments ?? null;
  }

  return normalized;
}
