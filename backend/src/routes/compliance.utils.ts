export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

export type NormalizedReviewUpdate = {
  status?: string;
  comments?: string | null;
};

export function normalizeReviewUpdateBody(
  body: UpdateReviewBody | null | undefined,
): NormalizedReviewUpdate {
  const status = body?.status ? String(body.status).toUpperCase() : undefined;
  const hasComments = body ? Object.prototype.hasOwnProperty.call(body, 'comments') : false;

  return {
    status,
    comments: hasComments ? body?.comments ?? null : undefined,
  };
}
