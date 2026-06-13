import type { SkillDefinition, SkillSummary } from './types.js';
import { serverDocumentationSkill } from './definitions/server-documentation.skill.js';
import { driftCheckSkill } from './definitions/drift-check.skill.js';
import { m365TenantSkill } from './definitions/m365-tenant.skill.js';

export * from './types.js';

const SKILLS: SkillDefinition[] = [serverDocumentationSkill, driftCheckSkill, m365TenantSkill];

const SKILL_INDEX = new Map<string, SkillDefinition>(SKILLS.map((skill) => [skill.id, skill]));

export function listSkills(): SkillDefinition[] {
  return [...SKILLS];
}

export function getSkill(id: string): SkillDefinition | undefined {
  return SKILL_INDEX.get(id);
}

export function toSkillSummary(skill: SkillDefinition): SkillSummary {
  return {
    id: skill.id,
    version: skill.version,
    name: skill.name,
    description: skill.description,
    triggers: skill.triggers,
    allowedTools: skill.allowedTools,
    inputs: skill.inputs,
    complianceMapping: skill.complianceMapping ?? [],
    produces: skill.produces,
  };
}
