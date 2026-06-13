import type { LlmUsage } from '../llm/types.js';

export type AgentTrigger = 'MANUAL' | 'SCHEDULE' | 'EVENT';

export interface AgentRunInput {
  /** System prompt that defines the agent's role and procedure. */
  systemPrompt: string;
  /** The concrete task / question for this run. */
  userMessage: string;
  goal?: string;
  skillId?: string;
  skillVersion?: string;
  trigger?: AgentTrigger;
  /** Restrict the agent to this subset of registered tools. */
  allowedTools?: string[];
  tenantId: string | null;
  userId: string | null;
  documentId?: string | null;
  conversationId?: string | null;
  maxIterations?: number;
  temperature?: number;
  /** Ask the model to return a JSON object as its final answer. */
  jsonOutput?: boolean;
}

export interface AgentRunResult {
  runId: string;
  status: string;
  content: string;
  steps: number;
  toolCalls: number;
  evidenceCount: number;
  usage: LlmUsage;
}
