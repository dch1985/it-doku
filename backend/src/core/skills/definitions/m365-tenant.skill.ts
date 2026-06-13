import type { SkillDefinition } from '../types.js';

/**
 * Connector-backed skill template. The Microsoft Graph tools (msgraph.*) are
 * not yet registered, so this skill currently documents what is known from the
 * tenant's own data and explicitly flags the missing live sources. It exists to
 * pin the pattern for connector-driven skills once the Graph connector lands.
 */
export const m365TenantSkill: SkillDefinition = {
  id: 'm365-tenant-documentation',
  version: '0.1.0',
  name: 'Microsoft 365 Tenant-Dokumentation',
  description:
    'Dokumentiert die Microsoft-365-/Entra-ID-Konfiguration eines Tenants. Benötigt den Microsoft-Graph-Connector für Live-Daten (Conditional Access, Intune-Policies). Ohne Connector werden bekannte Daten zusammengefasst und Lücken markiert.',
  triggers: ['MANUAL', 'SCHEDULE:weekly', 'EVENT:connector.synced'],
  allowedTools: ['search_documents', 'search_knowledge'],
  inputs: [{ name: 'tenantDomain', type: 'string', required: false, description: 'Primäre Tenant-Domain' }],
  outputFields: [
    { name: 'tenantDomain', description: 'Primäre Domain', format: 'text' },
    { name: 'identityProvider', description: 'Entra ID / Hybrid', format: 'text' },
    { name: 'conditionalAccess', description: 'Conditional-Access-Richtlinien', format: 'list' },
    { name: 'intunePolicies', description: 'Intune Compliance-/Konfigurationsrichtlinien', format: 'list' },
    { name: 'gaps', description: 'Felder, die einen Connector erfordern', format: 'list' },
  ],
  validators: [
    { type: 'required_fields', fields: ['gaps'] },
    { type: 'no_placeholder' },
  ],
  complianceMapping: ['ISO 27001:A.9.4', 'NIST AC-2'],
  produces: 'DOCUMENT',
  systemPrompt: `Du bist ein IT-Dokumentations-Agent für Microsoft 365 / Entra ID.

Wichtig: Der Microsoft-Graph-Connector ist in dieser Umgebung NICHT verfügbar. Du hast daher keinen Live-Zugriff auf Conditional Access oder Intune.

Vorgehen:
1. Durchsuche mit search_documents und search_knowledge die vorhandene Dokumentation nach M365-/Entra-Informationen.
2. Fasse zusammen, was belegbar ist.
3. Trage ALLE Felder, die einen Live-Connector erfordern (z.B. conditionalAccess, intunePolicies, sofern nicht dokumentiert), in "gaps" ein mit dem Hinweis "Microsoft-Graph-Connector erforderlich".

Strikte Regeln:
- Erfinde keine Richtlinien oder Werte.
- Antworte am Ende mit EINEM validen JSON-Objekt gemäß Schema, ohne Markdown.`,
};
