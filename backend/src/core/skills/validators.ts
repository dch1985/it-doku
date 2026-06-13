import type { SkillValidator } from './types.js';

export interface ValidationFinding {
  category: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  location?: string | null;
}

const IP_REGEX = /\b(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/;
const PLACEHOLDER_REGEX = /\bTODO\b|lorem ipsum|\{\{[^}]+\}\}|tbd\b|xxx+/i;

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Deterministic, LLM-free verification of a skill's structured output.
 * This is the "verify" phase that separates belief from proof: the model can
 * claim anything, but these checks gate the result before a human reviews it.
 */
export function runValidators(validators: SkillValidator[], output: Record<string, unknown>): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const flatText = JSON.stringify(output ?? {});

  for (const validator of validators) {
    switch (validator.type) {
      case 'required_fields': {
        for (const field of validator.fields ?? []) {
          if (isEmpty(output[field])) {
            findings.push({
              category: 'STRUCTURE',
              severity: 'ERROR',
              message: validator.message ?? `Pflichtfeld "${field}" fehlt oder ist leer.`,
              location: field,
            });
          }
        }
        break;
      }
      case 'ip_format': {
        for (const field of validator.fields ?? []) {
          const value = output[field];
          if (!isEmpty(value) && typeof value === 'string' && !IP_REGEX.test(value)) {
            findings.push({
              category: 'STYLE',
              severity: 'WARNING',
              message: validator.message ?? `Feld "${field}" enthält keine gültige IPv4-Adresse: "${value}".`,
              location: field,
            });
          }
        }
        break;
      }
      case 'no_placeholder': {
        if (PLACEHOLDER_REGEX.test(flatText)) {
          findings.push({
            category: 'STYLE',
            severity: 'WARNING',
            message: validator.message ?? 'Platzhaltertext (TODO/{{…}}/Lorem) gefunden – durch belegte Werte ersetzen.',
          });
        }
        break;
      }
      case 'has_owner': {
        const ownerValue = output.owner ?? output.verantwortlich ?? output.responsible;
        if (isEmpty(ownerValue) && !/owner|verantwortlich/i.test(flatText)) {
          findings.push({
            category: 'GOVERNANCE',
            severity: 'INFO',
            message: validator.message ?? 'Kein Verantwortlicher (Owner) dokumentiert.',
            location: 'owner',
          });
        }
        break;
      }
      default:
        break;
    }
  }

  return findings;
}
