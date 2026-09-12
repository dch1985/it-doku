import { ApplicationError } from '../middleware/errorHandler.js';

export type UpdateFindingBody = {
  resolution?: string | null;
  action?: 'RESOLVE' | 'REOPEN' | string;
};

export type UpdateReviewBody = {
  status?: string;
  comments?: string | null;
};

function hasOwnProperty<T extends object>(value: T, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function parseUpdateFindingBody(body: UpdateFindingBody | null | undefined): {
  action?: 'RESOLVE' | 'REOPEN';
  resolution?: string | null;
} {
  const action = body?.action ? String(body.action).toUpperCase() : undefined;
  const normalizedAction = action === 'RESOLVE' || action === 'REOPEN' ? action : undefined;

  if (action && !normalizedAction) {
    throw new ApplicationError(`Ungültige Aktion: ${action}`, 400);
  }

  const payload: {
    action?: 'RESOLVE' | 'REOPEN';
    resolution?: string | null;
  } = {};

  if (normalizedAction) {
    payload.action = normalizedAction;
  }

  if (body && hasOwnProperty(body, 'resolution')) {
    payload.resolution =
      typeof body.resolution === 'string' ? body.resolution : body.resolution ?? null;
  }

  return payload;
}

export function parseUpdateReviewBody(body: UpdateReviewBody | null | undefined): {
  status?: string;
  comments?: string | null;
} {
  const payload: {
    status?: string;
    comments?: string | null;
  } = {};

  if (body?.status) {
    payload.status = String(body.status).toUpperCase();
  }

  if (body && hasOwnProperty(body, 'comments')) {
    payload.comments = body.comments ?? null;
  }

  return payload;
}
