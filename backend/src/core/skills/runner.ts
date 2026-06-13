import { prisma } from '../../lib/prisma.js';
import { ApplicationError } from '../../middleware/errorHandler.js';
import { runAgent } from '../agent/runtime.js';
import { getSkill, listSkills, toSkillSummary } from './index.js';
import type { SkillDefinition } from './types.js';
import { runValidators, type ValidationFinding } from './validators.js';

export interface RunSkillInput {
  skillId: string;
  input?: Record<string, unknown>;
  tenantId: string | null;
  userId: string | null;
  documentId?: string | null;
  trigger?: 'MANUAL' | 'SCHEDULE' | 'EVENT';
}

function buildOutputContract(skill: SkillDefinition): string {
  const fields = skill.outputFields
    .map((field) => `- "${field.name}": ${field.description ?? ''}${field.format ? ` [${field.format}]` : ''}`)
    .join('\n');
  return `\n\nAUSGABE-VERTRAG — antworte mit genau EINEM JSON-Objekt mit diesen Schlüsseln:\n${fields}`;
}

function buildUserMessage(skill: SkillDefinition, input: Record<string, unknown>): string {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== '');
  const inputs = entries.length ? entries.map(([key, value]) => `- ${key}: ${String(value)}`).join('\n') : '- (keine Eingaben übergeben)';
  return `Führe die Skill "${skill.name}" aus.\n\nEingaben:\n${inputs}`;
}

/** Parse the model's final answer into a structured object, tolerating fences. */
function parseStructuredOutput(content: string): Record<string, unknown> {
  const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        /* fall through */
      }
    }
  }
  return { raw: content };
}

export const skillService = {
  list() {
    return listSkills().map(toSkillSummary);
  },

  get(id: string) {
    const skill = getSkill(id);
    return skill ? toSkillSummary(skill) : null;
  },

  async run(params: RunSkillInput) {
    const skill = getSkill(params.skillId);
    if (!skill) {
      throw new ApplicationError(`Skill "${params.skillId}" nicht gefunden`, 404);
    }

    const input = params.input ?? {};
    const missing = skill.inputs
      .filter((field) => field.required)
      .filter((field) => input[field.name] === undefined || input[field.name] === null || input[field.name] === '')
      .map((field) => field.name);
    if (missing.length > 0) {
      throw new ApplicationError(`Fehlende Pflicht-Eingaben: ${missing.join(', ')}`, 400);
    }

    const documentId = params.documentId ?? (typeof input.documentId === 'string' ? input.documentId : null);

    const result = await runAgent({
      systemPrompt: skill.systemPrompt + buildOutputContract(skill),
      userMessage: buildUserMessage(skill, input),
      goal: skill.name,
      skillId: skill.id,
      skillVersion: skill.version,
      trigger: params.trigger ?? 'MANUAL',
      allowedTools: skill.allowedTools,
      tenantId: params.tenantId,
      userId: params.userId,
      documentId,
      jsonOutput: true,
    });

    const output = parseStructuredOutput(result.content);
    const findings = runValidators(skill.validators, output);
    await this.persistVerification(result.runId, output, findings, skill, documentId);

    return {
      runId: result.runId,
      skillId: skill.id,
      skillVersion: skill.version,
      produces: skill.produces,
      output,
      findings,
      evidenceCount: result.evidenceCount,
      toolCalls: result.toolCalls,
      usage: result.usage,
      complianceMapping: skill.complianceMapping ?? [],
    };
  },

  /** Record the verify phase: validation steps, final status, and compliance findings. */
  async persistVerification(
    runId: string,
    output: Record<string, unknown>,
    findings: ValidationFinding[],
    skill: SkillDefinition,
    documentId: string | null,
  ) {
    const run = await prisma.agentRun.findUnique({ where: { id: runId }, select: { stepCount: true } });
    let index = run?.stepCount ?? 0;

    for (const finding of findings) {
      await prisma.agentStep.create({
        data: {
          agentRunId: runId,
          index: index++,
          phase: 'VERIFY',
          type: 'VALIDATION',
          output: `[${finding.severity}] ${finding.message}`,
          status: finding.severity === 'ERROR' ? 'ERROR' : 'OK',
          error: finding.severity === 'ERROR' ? finding.message : null,
        },
      });
    }

    const hasError = findings.some((finding) => finding.severity === 'ERROR');
    const producesArtifact = skill.produces === 'DOCUMENT' || skill.produces === 'DRIFT_REPORT';

    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        output: JSON.stringify(output).slice(0, 16000),
        status: hasError ? 'FAILED' : producesArtifact ? 'AWAITING_REVIEW' : 'COMPLETED',
        stepCount: index,
      },
    });

    if (documentId && findings.length > 0) {
      await prisma.qualityFinding.createMany({
        data: findings.map((finding) => ({
          category: finding.category,
          severity: finding.severity,
          message: finding.message,
          location: finding.location ?? null,
          documentId,
          generationJobId: null,
        })),
      });
    }
  },
};
