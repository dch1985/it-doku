/**
 * Tool layer: the deterministic, typed surface the agent acts through.
 *
 * The agent never reads the database directly and never invents facts — it
 * calls tools, and every fact a tool returns can be recorded as Evidence so
 * the resulting documentation is traceable to a source.
 */

export interface EvidenceInput {
  sourceType: 'TOOL' | 'CONNECTOR' | 'DOCUMENT' | 'DATABASE';
  /** Tool or connector name that produced this fact. */
  source: string;
  /** Stable reference to the underlying record, e.g. `document:<id>`, `asset:<id>`. */
  reference?: string;
  /** Human-readable statement of what was observed. */
  claim?: string;
  /** Raw snapshot of the observed data (will be JSON-stringified + hashed). */
  data?: unknown;
}

export interface ToolContext {
  tenantId: string | null;
  userId: string | null;
  /** Collects evidence emitted while a tool runs. Wired by the agent runtime. */
  recordEvidence: (evidence: EvidenceInput) => void;
}

export interface ToolResult {
  ok: boolean;
  /** Structured payload returned to the model (must be JSON-serialisable). */
  data: unknown;
  error?: string;
}

export interface Tool {
  name: string;
  description: string;
  /** JSON Schema for the tool arguments. */
  parameters: Record<string, unknown>;
  /** Read-only tools never mutate state; write tools must produce drafts, not publishes. */
  readOnly: boolean;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

export function ok(data: unknown): ToolResult {
  return { ok: true, data };
}

export function fail(error: string): ToolResult {
  return { ok: false, data: null, error };
}
