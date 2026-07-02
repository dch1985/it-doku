export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

/**
 * Build a safe update payload where omitted optional fields stay undefined.
 * This prevents status-only updates from accidentally clearing comments.
 */
export function buildReviewUpdatePayload(body: UpdateReviewBody | undefined) {
  const status = body?.status ? String(body.status).toUpperCase() : undefined;
  const hasCommentsField =
    body != null && Object.prototype.hasOwnProperty.call(body, 'comments');

  return {
    status,
    comments: hasCommentsField ? body?.comments ?? null : undefined,
  };
}
