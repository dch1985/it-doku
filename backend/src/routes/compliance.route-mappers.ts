import type { ReviewRequestUpdatePayload } from '../services/compliance.service.js';

type ReviewUpdateBody = {
  status?: string;
  comments?: string | null;
};

export function mapReviewUpdateBody(
  body: ReviewUpdateBody | null | undefined,
  tenantId?: string | null,
): ReviewRequestUpdatePayload {
  const payload: ReviewRequestUpdatePayload = {
    tenantId: tenantId ?? null,
  };

  if (body?.status) {
    payload.status = String(body.status).toUpperCase() as ReviewRequestUpdatePayload['status'];
  }

  if (body && Object.prototype.hasOwnProperty.call(body, 'comments')) {
    payload.comments = body.comments ?? null;
  }

  return payload;
}
