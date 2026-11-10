type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

function hasOwnProperty<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function mapReviewUpdateBody(body: UpdateReviewBody | null | undefined) {
  const payload: { status?: string; comments?: string | null } = {};

  if (body?.status) {
    payload.status = String(body.status).toUpperCase();
  }

  if (body && hasOwnProperty(body, 'comments')) {
    payload.comments = body.comments ?? null;
  }

  return payload;
}
