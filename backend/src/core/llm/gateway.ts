import OpenAI from 'openai';
import {
  EMPTY_USAGE,
  type LlmCompleteOptions,
  type LlmCompletion,
  type LlmMessage,
  type LlmToolCall,
  type LlmUsage,
} from './types.js';

/**
 * Single entry point for every LLM call in the backend.
 *
 * Previously each route built its own OpenAI client (chat.ts, analyze.ts) and
 * the automation pipeline used a hard-coded placeholder. The gateway unifies
 * configuration, supports tool-calling for the agent runtime, exposes token
 * usage for per-tenant accounting, and degrades gracefully when no credentials
 * are configured so the app still boots offline.
 */

export class LlmNotConfiguredError extends Error {
  constructor() {
    super('LLM ist nicht konfiguriert. Bitte AZURE_OPENAI_ENDPOINT und AZURE_OPENAI_KEY setzen.');
    this.name = 'LlmNotConfiguredError';
  }
}

interface LlmConfig {
  endpoint: string | undefined;
  key: string | undefined;
  deployment: string;
  apiVersion: string;
}

function readConfig(): LlmConfig {
  return {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    key: process.env.AZURE_OPENAI_KEY || process.env.AZURE_OPENAI_API_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
  };
}

let cachedClient: OpenAI | null = null;
let cachedSignature = '';

function getClient(): OpenAI {
  const config = readConfig();
  if (!config.endpoint || !config.key) {
    throw new LlmNotConfiguredError();
  }

  const signature = `${config.endpoint}|${config.deployment}|${config.apiVersion}`;
  if (!cachedClient || cachedSignature !== signature) {
    const baseURL = `${config.endpoint.replace(/\/$/, '')}/openai/deployments/${config.deployment}`;
    cachedClient = new OpenAI({
      apiKey: config.key,
      baseURL,
      defaultQuery: { 'api-version': config.apiVersion },
      defaultHeaders: { 'api-key': config.key },
    });
    cachedSignature = signature;
  }

  return cachedClient;
}

function mapUsage(usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined): LlmUsage {
  if (!usage) return { ...EMPTY_USAGE };
  const promptTokens = usage.prompt_tokens ?? 0;
  const completionTokens = usage.completion_tokens ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: usage.total_tokens ?? promptTokens + completionTokens,
  };
}

/** Convert our provider-agnostic messages into the OpenAI wire format. */
function toOpenAiMessages(messages: LlmMessage[]): unknown[] {
  return messages.map((message) => {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        content: message.content ?? '',
        tool_call_id: message.toolCallId,
      };
    }

    if (message.role === 'assistant' && message.toolCalls?.length) {
      return {
        role: 'assistant',
        content: message.content,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: call.arguments },
        })),
      };
    }

    return { role: message.role, content: message.content ?? '' };
  });
}

export const llmGateway = {
  isConfigured(): boolean {
    const config = readConfig();
    return Boolean(config.endpoint && config.key);
  },

  model(): string {
    return readConfig().deployment;
  },

  /** Single completion. Returns content, any requested tool calls, and token usage. */
  async complete(options: LlmCompleteOptions): Promise<LlmCompletion> {
    const client = getClient();

    const body: Record<string, unknown> = {
      model: readConfig().deployment,
      messages: toOpenAiMessages(options.messages),
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1500,
    };

    if (options.tools?.length) {
      body.tools = options.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
      body.tool_choice = 'auto';
    }

    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    // The OpenAI SDK request union is overloaded across streaming/tool variants;
    // we keep our public surface typed and cast only at this boundary.
    const response: any = await client.chat.completions.create(body as any);
    const choice = response.choices?.[0];
    const message = choice?.message;

    const toolCalls: LlmToolCall[] = (message?.tool_calls ?? [])
      .filter((call: any) => call?.function?.name)
      .map((call: any) => ({
        id: call.id,
        name: call.function.name,
        arguments: call.function.arguments ?? '{}',
      }));

    return {
      content: message?.content ?? '',
      toolCalls,
      usage: mapUsage(response.usage),
      finishReason: choice?.finish_reason ?? null,
    };
  },

  /** Streaming completion for the chat UI. Yields text deltas. */
  async *stream(options: LlmCompleteOptions): AsyncGenerator<string, void, unknown> {
    const client = getClient();

    const stream: any = await client.chat.completions.create({
      model: readConfig().deployment,
      messages: toOpenAiMessages(options.messages),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
      stream: true,
    } as any);

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        yield content as string;
      }
    }
  },
};
