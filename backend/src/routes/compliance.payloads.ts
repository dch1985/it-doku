export type UpdateFindingBody = {
  resolution?: string | null;
  action?: string;
};

export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

function hasOwnField(body: unknown, field: string): boolean {
  return Object.prototype.hasOwnProperty.call(body ?? {}, field);
}

export function buildQualityFindingChanges(body: UpdateFindingBody | null | undefined) {
  const action = body?.action ? String(body.action).toUpperCase() : undefined;
  const resolution = hasOwnField(body, 'resolution')
    ? typeof body?.resolution === 'string'
      ? body.resolution
      : body?.resolution ?? null
    : undefined;

  return {
    action,
    resolution,
  };
}

export function buildReviewRequestChanges(body: UpdateReviewBody | null | undefined) {
  const status = body?.status ? String(body.status).toUpperCase() : undefined;
  const comments = hasOwnField(body, 'comments') ? body?.comments ?? null : undefined;

  return {
    status,
    comments,
  };
}
