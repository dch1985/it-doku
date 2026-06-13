import { prisma } from '../../lib/prisma.js';
import type { LlmUsage } from './types.js';

export type LlmFeature = 'CHAT' | 'ANALYZE' | 'AGENT' | 'DRAFT' | 'ASSISTANT';

export interface UsageContext {
  tenantId?: string | null;
  userId?: string | null;
  feature: LlmFeature;
  model?: string | null;
  agentRunId?: string | null;
}

/**
 * Persist token usage per tenant/feature. Best-effort: accounting must never
 * break a user-facing request, so failures are logged and swallowed.
 */
export async function recordLlmUsage(context: UsageContext, usage: LlmUsage): Promise<void> {
  try {
    await prisma.llmUsage.create({
      data: {
        tenantId: context.tenantId ?? null,
        userId: context.userId ?? null,
        feature: context.feature,
        model: context.model ?? null,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        agentRunId: context.agentRunId ?? null,
      },
    });
  } catch (error) {
    console.warn('[LlmUsage] Failed to record usage', error);
  }
}
