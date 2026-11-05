import { ApplicationError } from '../middleware/errorHandler.js';

export type UpdateFindingBody = {
  resolution?: string | null;
  action?: string | null;
};

export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

function hasOwnProperty<T extends object, K extends PropertyKey>(
  value: T | null | undefined,
  key: K,
): value is T & Record<K, unknown> {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);
}

export function buildQualityFindingUpdatePayload(body: UpdateFindingBody | null | undefined) {
  const payload: {
    resolution?: string | null;
    action?: 'RESOLVE' | 'REOPEN';
  } = {};

  const action = typeof body?.action === 'string' ? body.action.toUpperCase() : undefined;
  if (action) {
    if (action !== 'RESOLVE' && action !== 'REOPEN') {
      throw new ApplicationError(`Ungültige Aktion: ${action}`, 400);
    }
    payload.action = action;
  }

  if (hasOwnProperty(body, 'resolution')) {
    payload.resolution = typeof body.resolution === 'string' ? body.resolution : body.resolution ?? null;
  }

  return payload;
}

export function buildReviewUpdatePayload(body: UpdateReviewBody | null | undefined) {
  const payload: {
    status?: string;
    comments?: string | null;
  } = {};

  if (typeof body?.status === 'string' && body.status.trim() !== '') {
    payload.status = body.status.toUpperCase();
  }

  if (hasOwnProperty(body, 'comments')) {
    payload.comments = typeof body.comments === 'string' ? body.comments : body.comments ?? null;
  }

  return payload;
}
