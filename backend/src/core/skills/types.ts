/**
 * A Skill is a versioned, declarative procedure for an IT-documentation task.
 * It is not a prompt — it binds an allow-list of tools, a typed output shape,
 * deterministic validators, and a compliance mapping to a goal. The agent
 * runtime executes it; the validators verify it.
 */

export type SkillValidatorType = 'required_fields' | 'ip_format' | 'no_placeholder' | 'has_owner';

export interface SkillValidator {
  type: SkillValidatorType;
  /** Field names this validator applies to (for required_fields / ip_format). */
  fields?: string[];
  message?: string;
}

export interface SkillInputField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  description?: string;
}

export interface SkillOutputField {
  name: string;
  description?: string;
  format?: 'ip' | 'text' | 'list';
}

export type SkillProduces = 'DOCUMENT' | 'DRIFT_REPORT' | 'ANALYSIS';

export interface SkillDefinition {
  id: string;
  version: string;
  name: string;
  description: string;
  /** e.g. MANUAL, SCHEDULE:weekly, EVENT:connector.synced */
  triggers: string[];
  allowedTools: string[];
  inputs: SkillInputField[];
  outputFields: SkillOutputField[];
  /** Role + procedure for the agent. The runner appends output-contract instructions. */
  systemPrompt: string;
  validators: SkillValidator[];
  complianceMapping?: string[];
  produces: SkillProduces;
}

export interface SkillSummary {
  id: string;
  version: string;
  name: string;
  description: string;
  triggers: string[];
  allowedTools: string[];
  inputs: SkillInputField[];
  complianceMapping: string[];
  produces: SkillProduces;
}
