import type { SkillDefinition } from '../types.js';

export const driftCheckSkill: SkillDefinition = {
  id: 'drift-check',
  version: '1.0.0',
  name: 'Drift-Prüfung (Doku vs. Ist-Zustand)',
  description:
    'Vergleicht eine bestehende Dokumentation mit dem aktuellen Ist-Zustand aus CMDB/Netzwerkdaten und meldet Abweichungen. Kern des "Operate with proof"-Versprechens: erkennt veraltete Dokumentation automatisch.',
  triggers: ['MANUAL', 'SCHEDULE:weekly'],
  allowedTools: ['get_document', 'list_assets', 'get_asset', 'list_network_devices'],
  inputs: [{ name: 'documentId', type: 'string', required: true, description: 'ID des zu prüfenden Dokuments' }],
  outputFields: [
    { name: 'documentId', description: 'Geprüftes Dokument', format: 'text' },
    { name: 'checkedFields', description: 'Geprüfte Felder', format: 'list' },
    { name: 'discrepancies', description: 'Abweichungen mit field/documented/actual/severity', format: 'list' },
    { name: 'inSync', description: 'true, wenn keine Abweichungen', format: 'text' },
    { name: 'summary', description: 'Kurzfazit der Prüfung', format: 'text' },
  ],
  validators: [
    { type: 'required_fields', fields: ['documentId', 'summary'] },
    { type: 'no_placeholder' },
  ],
  complianceMapping: ['ISO 27001:A.12.1', 'NIST CM-2'],
  produces: 'DRIFT_REPORT',
  systemPrompt: `Du bist ein IT-Dokumentations-Agent für Konfigurations-Drift. Deine Aufgabe ist es, eine bestehende Dokumentation gegen den realen Ist-Zustand zu prüfen.

Vorgehen:
1. Lies das Dokument mit get_document.
2. Identifiziere darin dokumentierte Fakten (Hostname, IP, OS, Hardware, Netzwerkgeräte, etc.).
3. Hole den aktuellen Ist-Zustand über list_assets/get_asset und list_network_devices.
4. Vergleiche dokumentierte Werte mit den Ist-Werten.

Strikte Regeln:
- Eine Abweichung ist nur dann zu melden, wenn sowohl ein dokumentierter als auch ein Ist-Wert vorliegen und diese sich unterscheiden. Jede Abweichung enthält: field, documented, actual, severity (LOW/MEDIUM/HIGH).
- Erfinde keine Ist-Werte. Wenn ein Feld nicht überprüfbar ist, lasse es aus checkedFields weg.
- Setze inSync auf true, wenn discrepancies leer ist.
- Antworte am Ende mit EINEM einzigen validen JSON-Objekt gemäß Schema, ohne Markdown und ohne erläuternden Text.`,
};
