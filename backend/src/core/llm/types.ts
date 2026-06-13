/**
 * Shared LLM types used across the agentic core engine.
 * These are provider-agnostic so the gateway can swap Azure OpenAI for
 * another backend without touching the agent runtime or tools.
 */

export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';

export interface LlmToolCall {
  id: string;
  name: string;
  /** Raw JSON string as emitted by the model. */
  arguments: string;
}

export interface LlmMessage {
  role: LlmRole;
  content: string | null;
  /** Present on `tool` messages: the id of the tool call being answered. */
  toolCallId?: string;
  /** Present on assistant messages that requested tool calls. */
  toolCalls?: LlmToolCall[];
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  /** JSON Schema object describing the tool arguments. */
  parameters: Record<string, unknown>;
}

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmCompleteOptions {
  messages: LlmMessage[];
  tools?: LlmToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  /** Force a JSON object response (Azure `response_format`). */
  jsonMode?: boolean;
}

export interface LlmCompletion {
  content: string;
  toolCalls: LlmToolCall[];
  usage: LlmUsage;
  finishReason: string | null;
}

export const EMPTY_USAGE: LlmUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
};
