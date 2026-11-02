type OptionalCommentBody = {
  comments?: string | null;
} | null | undefined;

export function normalizeOptionalComment(
  body: OptionalCommentBody,
): string | null | undefined {
  if (
    typeof body !== 'object' ||
    body === null ||
    !Object.prototype.hasOwnProperty.call(body, 'comments')
  ) {
    return undefined;
  }

  return body.comments ?? null;
}
