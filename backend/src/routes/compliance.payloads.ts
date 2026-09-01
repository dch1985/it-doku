import { ApplicationError } from '../middleware/errorHandler.js';

export type FindingAction = 'RESOLVE' | 'REOPEN';

export interface UpdateFindingBody {
  resolution?: string | null;
  action?: string;
}

export interface UpdateReviewBody {
  status?: string;
  comments?: string | null;
}

function hasOwnProperty(value: unknown, key: string): boolean {
  return value != null && Object.prototype.hasOwnProperty.call(value, key);
}

export function buildFindingUpdatePayload(body: UpdateFindingBody | null | undefined): {
  action?: FindingAction;
  resolution?: string | null;
} {
  const payload: {
    action?: FindingAction;
    resolution?: string | null;
  } = {};

  const action = body?.action ? body.action.toUpperCase() : undefined;
  if (action) {
    if (action !== 'RESOLVE' && action !== 'REOPEN') {
      throw new ApplicationError(`Ungültige Aktion: ${action}`, 400);
    }
    payload.action = action;
  }

  if (hasOwnProperty(body, 'resolution')) {
    if (body?.resolution !== null && typeof body?.resolution !== 'string') {
      throw new ApplicationError('resolution muss string oder null sein', 400);
    }
    payload.resolution = body?.resolution ?? null;
  }

  return payload;
}

export function buildReviewUpdatePayload(body: UpdateReviewBody | null | undefined): {
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

  if (hasOwnProperty(body, 'comments')) {
    if (body?.comments !== null && typeof body?.comments !== 'string') {
      throw new ApplicationError('comments muss string oder null sein', 400);
    }
    payload.comments = body?.comments ?? null;
  }

  return payload;
}
