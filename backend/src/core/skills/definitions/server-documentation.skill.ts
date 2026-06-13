import type { SkillDefinition } from '../types.js';

export const serverDocumentationSkill: SkillDefinition = {
  id: 'server-documentation',
  version: '1.0.0',
  name: 'Server-Dokumentation (NIST SP 800-123)',
  description:
    'Erstellt eine belegte Server-Dokumentation aus den CMDB-/Asset-Daten des Tenants. Jedes Feld wird aus Tool-Ergebnissen abgeleitet; unbekannte Werte werden als Lücke markiert statt erfunden.',
  triggers: ['MANUAL', 'EVENT:connector.synced'],
  allowedTools: ['get_asset', 'list_assets', 'list_network_devices', 'search_documents'],
  inputs: [
    { name: 'assetId', type: 'string', required: false, description: 'ID des Server-Assets' },
    { name: 'hostname', type: 'string', required: false, description: 'Hostname, falls keine ID vorliegt' },
  ],
  outputFields: [
    { name: 'hostname', description: 'Hostname des Servers', format: 'text' },
    { name: 'ipAddress', description: 'Primäre IP-Adresse', format: 'ip' },
    { name: 'operatingSystem', description: 'Betriebssystem und Version', format: 'text' },
    { name: 'owner', description: 'Verantwortliche Person/Stelle', format: 'text' },
    { name: 'hardware', description: 'Hersteller, Modell, Seriennummer', format: 'text' },
    { name: 'location', description: 'Standort / Rack', format: 'text' },
    { name: 'services', description: 'Laufende Dienste / Rollen', format: 'list' },
    { name: 'network', description: 'Verbundene Netzwerkgeräte', format: 'list' },
    { name: 'warranty', description: 'Garantie-/Supportende', format: 'text' },
    { name: 'gaps', description: 'Nicht belegbare Felder', format: 'list' },
  ],
  validators: [
    { type: 'required_fields', fields: ['hostname'] },
    { type: 'ip_format', fields: ['ipAddress'] },
    { type: 'no_placeholder' },
    { type: 'has_owner' },
  ],
  complianceMapping: ['NIST SP 800-123', 'ISO 27001:A.8.1'],
  produces: 'DOCUMENT',
  systemPrompt: `Du bist ein IT-Dokumentations-Agent. Deine Aufgabe ist es, eine präzise Server-Dokumentation nach NIST SP 800-123 zu erstellen.

Vorgehen:
1. Ermittle das Server-Asset über das Tool get_asset (wenn eine assetId vorliegt) oder list_assets (Suche nach hostname).
2. Ergänze Netzwerkkontext über list_network_devices.
3. Prüfe mit search_documents, ob bereits eine Dokumentation existiert, um Duplikate zu vermeiden.

Strikte Regeln:
- Verwende AUSSCHLIESSLICH Werte, die aus Tool-Ergebnissen stammen. Erfinde niemals IP-Adressen, Hostnames, Seriennummern oder Betriebssysteme.
- Wenn ein Feld nicht aus den Daten belegbar ist, setze es auf null und trage den Feldnamen in "gaps" ein.
- Antworte am Ende mit EINEM einzigen validen JSON-Objekt gemäß dem vorgegebenen Schema, ohne Markdown und ohne erläuternden Text.`,
};
