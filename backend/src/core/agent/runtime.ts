import { createHash } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { llmGateway } from '../llm/gateway.js';
import { recordLlmUsage } from '../llm/usage.js';
import { EMPTY_USAGE, type LlmMessage, type LlmUsage } from '../llm/types.js';
import { defaultRegistry } from '../tools/index.js';
import type { ToolRegistry } from '../tools/registry.js';
import type { EvidenceInput } from '../tools/types.js';
import type { AgentRunInput, AgentRunResult } from './types.js';

const DEFAULT_MAX_ITERATIONS = 6;

interface PendingEvidence extends EvidenceInput {
  agentStepId: string | null;
}

function safeJsonParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function truncate(value: string, max = 8000): string {
  return value.length > max ? `${value.slice(0, max)}…[gekürzt]` : value;
}

function hashData(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data ?? null)).digest('hex');
}

/**
 * Run the agent loop: the model plans, calls read-only tools, observes their
 * results, and produces a final answer. Every tool result is captured as
 * Evidence so the output is traceable. The whole run is persisted as an
 * AgentRun with its AgentSteps.
 */
export async function runAgent(
  input: AgentRunInput,
  registry: ToolRegistry = defaultRegistry,
): Promise<AgentRunResult> {
  if (!llmGateway.isConfigured()) {
    const error = new Error('LLM ist nicht konfiguriert');
    (error as any).code = 'LLM_NOT_CONFIGURED';
    throw error;
  }

  const maxIterations = Math.min(Math.max(input.maxIterations ?? DEFAULT_MAX_ITERATIONS, 1), 12);
  const toolDefinitions = registry.definitions(input.allowedTools);

  const run = await prisma.agentRun.create({
    data: {
      skillId: input.skillId ?? null,
      skillVersion: input.skillVersion ?? null,
      status: 'RUNNING',
      trigger: input.trigger ?? 'MANUAL',
      goal: input.goal ?? null,
      input: JSON.stringify({ userMessage: input.userMessage, allowedTools: input.allowedTools ?? null }),
      tenantId: input.tenantId,
      userId: input.userId,
      documentId: input.documentId ?? null,
      conversationId: input.conversationId ?? null,
    },
  });

  const messages: LlmMessage[] = [
    { role: 'system', content: input.systemPrompt },
    { role: 'user', content: input.userMessage },
  ];

  const usage: LlmUsage = { ...EMPTY_USAGE };
  const pendingEvidence: PendingEvidence[] = [];
  let stepIndex = 0;
  let toolCallCount = 0;
  let finalContent = '';

  try {
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      const completion = await llmGateway.complete({
        messages,
        tools: toolDefinitions.length ? toolDefinitions : undefined,
        temperature: input.temperature,
        jsonMode: input.jsonOutput && iteration > 0 ? undefined : input.jsonOutput,
      });

      usage.promptTokens += completion.usage.promptTokens;
      usage.completionTokens += completion.usage.completionTokens;
      usage.totalTokens += completion.usage.totalTokens;

      if (completion.toolCalls.length === 0) {
        finalContent = completion.content;
        await prisma.agentStep.create({
          data: {
            agentRunId: run.id,
            index: stepIndex++,
            phase: 'FINALIZE',
            type: 'MESSAGE',
            output: truncate(finalContent),
            promptTokens: completion.usage.promptTokens,
            completionTokens: completion.usage.completionTokens,
          },
        });
        break;
      }

      // The model decided to call tools — record that decision, then execute each.
      messages.push({ role: 'assistant', content: completion.content || null, toolCalls: completion.toolCalls });
      await prisma.agentStep.create({
        data: {
          agentRunId: run.id,
          index: stepIndex++,
          phase: 'ACT',
          type: 'MESSAGE',
          output: truncate(
            completion.content || `Plant ${completion.toolCalls.length} Tool-Aufruf(e): ${completion.toolCalls.map((c) => c.name).join(', ')}`,
          ),
          promptTokens: completion.usage.promptTokens,
          completionTokens: completion.usage.completionTokens,
        },
      });

      for (const toolCall of completion.toolCalls) {
        toolCallCount += 1;
        const args = safeJsonParse(toolCall.arguments);
        const evidenceBuffer: EvidenceInput[] = [];

        const result = await registry.execute(toolCall.name, args, {
          tenantId: input.tenantId,
          userId: input.userId,
          recordEvidence: (evidence) => evidenceBuffer.push(evidence),
        });

        const step = await prisma.agentStep.create({
          data: {
            agentRunId: run.id,
            index: stepIndex++,
            phase: 'OBSERVE',
            type: 'TOOL_CALL',
            toolName: toolCall.name,
            input: truncate(JSON.stringify(args)),
            output: truncate(JSON.stringify(result.ok ? result.data : { error: result.error })),
            status: result.ok ? 'OK' : 'ERROR',
            error: result.ok ? null : result.error ?? null,
          },
        });

        for (const evidence of evidenceBuffer) {
          pendingEvidence.push({ ...evidence, agentStepId: step.id });
        }

        messages.push({
          role: 'tool',
          toolCallId: toolCall.id,
          content: truncate(JSON.stringify(result.ok ? result.data : { error: result.error }), 6000),
        });
      }
    }

    if (pendingEvidence.length > 0) {
      await prisma.evidence.createMany({
        data: pendingEvidence.map((evidence) => ({
          agentRunId: run.id,
          agentStepId: evidence.agentStepId,
          sourceType: evidence.sourceType,
          source: evidence.source,
          reference: evidence.reference ?? null,
          claim: evidence.claim ?? null,
          data: evidence.data === undefined ? null : truncate(JSON.stringify(evidence.data)),
          dataHash: evidence.data === undefined ? null : hashData(evidence.data),
          tenantId: input.tenantId,
        })),
      });
    }

    const completed = await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        output: truncate(finalContent),
        summary: finalContent ? truncate(finalContent.split('\n')[0] ?? '', 280) : null,
        stepCount: stepIndex,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        completedAt: new Date(),
      },
    });

    await recordLlmUsage(
      { tenantId: input.tenantId, userId: input.userId, feature: 'AGENT', model: llmGateway.model(), agentRunId: run.id },
      usage,
    );

    return {
      runId: completed.id,
      status: completed.status,
      content: finalContent,
      steps: stepIndex,
      toolCalls: toolCallCount,
      evidenceCount: pendingEvidence.length,
      usage,
    };
  } catch (error: any) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        error: error?.message ?? 'Unbekannter Fehler im Agent-Lauf',
        stepCount: stepIndex,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
