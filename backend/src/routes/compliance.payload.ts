export type UpdateFindingBody = {
  resolution?: string | null;
  action?: 'RESOLVE' | 'REOPEN';
};

export type CreateReviewBody = {
  documentId: string;
  reviewerId: string;
  comments?: string | null;
};

export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

type FindingAction = 'RESOLVE' | 'REOPEN';

function hasOwnProperty(value: unknown, propertyName: string): boolean {
  return Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, propertyName));
}

export function normalizeQualityFindingBody(body: UpdateFindingBody | null | undefined): {
  action?: FindingAction;
  resolution?: string | null;
} {
  const action = body?.action ? String(body.action).toUpperCase() : undefined;
  const resolution = hasOwnProperty(body, 'resolution')
    ? typeof body?.resolution === 'string'
      ? body.resolution
      : body?.resolution ?? null
    : undefined;

  return {
    action: action as FindingAction | undefined,
    resolution,
  };
}

export function normalizeReviewUpdateBody(body: UpdateReviewBody | null | undefined): {
  status?: string;
  comments?: string | null;
} {
  const status = body?.status ? String(body.status).toUpperCase() : undefined;
  const comments = hasOwnProperty(body, 'comments') ? body?.comments ?? null : undefined;

  return {
    status,
    comments,
  };
}
