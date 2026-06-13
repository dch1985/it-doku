import type { LlmToolDefinition } from '../llm/types.js';
import { fail, type Tool, type ToolContext, type ToolResult } from './types.js';

/**
 * Registry of tools available to the agent. A skill restricts the agent to a
 * named subset (its `allowedTools`) so each run only touches what it should.
 */
export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" ist bereits registriert`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  /** Resolve a list of tools, optionally filtered to an allow-list of names. */
  list(allowed?: string[]): Tool[] {
    if (!allowed) {
      return [...this.tools.values()];
    }
    return allowed
      .map((name) => this.tools.get(name))
      .filter((tool): tool is Tool => Boolean(tool));
  }

  /** Tool definitions in the shape the LLM gateway expects. */
  definitions(allowed?: string[]): LlmToolDefinition[] {
    return this.list(allowed).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  async execute(name: string, args: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return fail(`Unbekanntes Tool: ${name}`);
    }

    try {
      return await tool.execute(args, context);
    } catch (error: any) {
      return fail(error?.message ?? `Tool "${name}" ist fehlgeschlagen`);
    }
  }
}
