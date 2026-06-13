export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

export type NormalizedReviewUpdate = {
  status?: string;
  comments?: string | null;
};

export function normalizeReviewUpdateBody(body: UpdateReviewBody | undefined): NormalizedReviewUpdate {
  const status = body?.status ? String(body.status).toUpperCase() : undefined;
  const hasCommentsField =
    !!body && Object.prototype.hasOwnProperty.call(body, 'comments');

  return {
    status,
    comments: hasCommentsField ? body.comments ?? null : undefined,
  };
}
