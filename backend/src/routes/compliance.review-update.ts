export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

function hasOwnField<T extends object>(value: T | null | undefined, field: keyof T): value is T {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(value, field);
}

/**
 * Preserves existing review comments when the request updates only the status.
 * Only explicit `comments` updates should alter the stored value.
 */
export function extractReviewUpdateComments(body: UpdateReviewBody | null | undefined): string | null | undefined {
  if (!hasOwnField(body, 'comments')) {
    return undefined;
  }

  return body.comments ?? null;
}
