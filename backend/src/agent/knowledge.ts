/**
 * Trust Doc expert knowledge base.
 *
 * Encodes IT documentation best practice as data: which sections a document
 * of a given category must contain, how often it must be reviewed, and which
 * document categories every asset type needs to be considered fully covered.
 * The agent skills evaluate and generate documentation purely from these
 * rules - no generative AI involved.
 */

export const DOCUMENT_CATEGORIES = [
  'SERVER',
  'NETWORK',
  'SECURITY',
  'BACKUP',
  'MONITORING',
  'RUNBOOK',
  'GENERAL',
] as const

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

export const ASSET_TYPES = [
  'SERVER',
  'VM',
  'DATABASE',
  'SWITCH',
  'ROUTER',
  'FIREWALL',
  'STORAGE',
  'APPLICATION',
  'CLOUD_SERVICE',
] as const

export type AssetType = (typeof ASSET_TYPES)[number]

export interface SectionRule {
  /** Heading the section is matched by (case-insensitive substring). */
  heading: string
  /** Why this section matters - shown to the user in findings. */
  rationale: string
}

/** Required sections per document category, derived from common run-book / NIST style structures. */
export const REQUIRED_SECTIONS: Record<DocumentCategory, SectionRule[]> = {
  SERVER: [
    { heading: 'Overview', rationale: 'Purpose, role and business owner of the server' },
    { heading: 'System Specification', rationale: 'Hardware/VM sizing, OS and installed software' },
    { heading: 'Network Configuration', rationale: 'IP addresses, VLANs, DNS and firewall openings' },
    { heading: 'Services', rationale: 'Running services and the applications that depend on them' },
    { heading: 'Backup', rationale: 'Backup schedule, retention and restore procedure' },
    { heading: 'Maintenance', rationale: 'Patch window, update procedure and responsible team' },
    { heading: 'Contacts', rationale: 'Escalation path and vendor support contacts' },
  ],
  NETWORK: [
    { heading: 'Overview', rationale: 'Scope and purpose of the network segment or device' },
    { heading: 'Topology', rationale: 'How the device or segment connects to the rest of the network' },
    { heading: 'Addressing', rationale: 'Subnets, VLAN IDs, gateway and DNS configuration' },
    { heading: 'Configuration', rationale: 'Relevant device configuration and where it is stored' },
    { heading: 'Redundancy', rationale: 'Failover behaviour and single points of failure' },
    { heading: 'Contacts', rationale: 'Who manages this device and the carrier/vendor contacts' },
  ],
  SECURITY: [
    { heading: 'Scope', rationale: 'Systems and data covered by this policy or control' },
    { heading: 'Access Control', rationale: 'Who gets access, how it is requested and revoked' },
    { heading: 'Hardening', rationale: 'Applied baseline and deviations from it' },
    { heading: 'Incident Response', rationale: 'What to do when this control fails or is breached' },
    { heading: 'Review', rationale: 'How often the control is reviewed and by whom' },
  ],
  BACKUP: [
    { heading: 'Scope', rationale: 'Which systems and data sets are backed up' },
    { heading: 'Schedule', rationale: 'Frequency, time window and retention of backups' },
    { heading: 'Storage', rationale: 'Where backups live, including offsite/immutable copies' },
    { heading: 'Restore Procedure', rationale: 'Step-by-step recovery instructions with RTO/RPO' },
    { heading: 'Verification', rationale: 'How and when restores are tested' },
  ],
  MONITORING: [
    { heading: 'Scope', rationale: 'Monitored systems and metrics' },
    { heading: 'Alerting', rationale: 'Thresholds, alert channels and on-call routing' },
    { heading: 'Dashboards', rationale: 'Where operators can see the live state' },
    { heading: 'Escalation', rationale: 'What happens when an alert is not acknowledged' },
  ],
  RUNBOOK: [
    { heading: 'Purpose', rationale: 'The scenario this runbook solves' },
    { heading: 'Prerequisites', rationale: 'Access, tools and conditions required before starting' },
    { heading: 'Procedure', rationale: 'Numbered, unambiguous steps an engineer can follow at 3 AM' },
    { heading: 'Rollback', rationale: 'How to get back to a safe state if a step fails' },
    { heading: 'Validation', rationale: 'How to confirm the procedure succeeded' },
  ],
  GENERAL: [
    { heading: 'Overview', rationale: 'What this document covers and who it is for' },
  ],
}

/** Maximum age in days before a document of this category counts as stale. */
export const REVIEW_INTERVAL_DAYS: Record<DocumentCategory, number> = {
  SERVER: 180,
  NETWORK: 180,
  SECURITY: 90,
  BACKUP: 90,
  MONITORING: 180,
  RUNBOOK: 365,
  GENERAL: 365,
}

/** Document categories every asset of a given type needs for full coverage. */
export const COVERAGE_REQUIREMENTS: Record<AssetType, DocumentCategory[]> = {
  SERVER: ['SERVER', 'BACKUP'],
  VM: ['SERVER', 'BACKUP'],
  DATABASE: ['SERVER', 'BACKUP', 'RUNBOOK'],
  SWITCH: ['NETWORK'],
  ROUTER: ['NETWORK'],
  FIREWALL: ['NETWORK', 'SECURITY'],
  STORAGE: ['SERVER', 'BACKUP'],
  APPLICATION: ['SERVER', 'RUNBOOK'],
  CLOUD_SERVICE: ['SERVER', 'SECURITY'],
}

/** Additional requirement: critical assets must also have a runbook. */
export const CRITICAL_EXTRA_CATEGORY: DocumentCategory = 'RUNBOOK'

/** Words that signal unfinished documentation. */
export const PLACEHOLDER_PATTERNS = [/\{\{[^}]*\}\}/i, /\bTBD\b/i, /\bTODO\b/i, /\bFIXME\b/i, /\bXXX\b/]

/** Minimum amount of real text (tags stripped) for a document to count as substantive. */
export const MIN_CONTENT_LENGTH = 280

export interface AssetLike {
  id: string
  name: string
  type: string
  hostname: string | null
  ipAddress: string | null
  os: string | null
  location: string | null
  owner: string | null
  criticality: string
  status: string
  notes: string | null
}

const esc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const field = (label: string, value: string | null | undefined) =>
  `<tr><td><strong>${label}</strong></td><td>${value ? esc(value) : '<em>to be completed</em>'}</td></tr>`

/**
 * Generates a complete, pre-filled documentation skeleton for an asset.
 * Every required section for the target category is present so the document
 * passes the structure audit from day one; asset facts are filled in from
 * the inventory.
 */
export function buildAssetDocument(asset: AssetLike, category: DocumentCategory): { title: string; content: string } {
  const sections = REQUIRED_SECTIONS[category]
  const titlePrefix: Record<DocumentCategory, string> = {
    SERVER: 'System Documentation',
    NETWORK: 'Network Documentation',
    SECURITY: 'Security Documentation',
    BACKUP: 'Backup & Recovery Plan',
    MONITORING: 'Monitoring Setup',
    RUNBOOK: 'Operations Runbook',
    GENERAL: 'Documentation',
  }
  const title = `${titlePrefix[category]} – ${asset.name}`

  const factTable = `<table>
${field('Asset', asset.name)}
${field('Type', asset.type)}
${field('Hostname', asset.hostname)}
${field('IP Address', asset.ipAddress)}
${field('Operating System', asset.os)}
${field('Location', asset.location)}
${field('Owner', asset.owner)}
${field('Criticality', asset.criticality)}
${field('Status', asset.status)}
</table>`

  const sectionBodies: Record<string, (a: AssetLike) => string> = {
    Overview: (a) =>
      `<p>${esc(a.name)} is a ${esc(a.type.toLowerCase().replace(/_/g, ' '))} with criticality <strong>${esc(a.criticality)}</strong>${a.location ? ` located in ${esc(a.location)}` : ''}.${a.notes ? ` ${esc(a.notes)}` : ''}</p>${factTable}`,
    'System Specification': () =>
      `<p>Document CPU, memory, disk layout and installed software baseline here.</p><ul><li>CPU / vCPU: <em>to be completed</em></li><li>Memory: <em>to be completed</em></li><li>Disks &amp; mount points: <em>to be completed</em></li><li>Installed software baseline: <em>to be completed</em></li></ul>`,
    'Network Configuration': (a) =>
      `<table>${field('Hostname', a.hostname)}${field('IP Address', a.ipAddress)}${field('VLAN', null)}${field('Gateway', null)}${field('DNS', null)}</table><p>List required firewall openings (source, destination, port, purpose).</p>`,
    Services: () =>
      `<p>List the services running on this system and the applications depending on them.</p><ul><li>Service – port – depends on – consumed by</li></ul>`,
    Backup: () =>
      `<p>Reference the backup plan for this system: schedule, retention and how to restore.</p>`,
    Maintenance: (a) =>
      `<p>Patch window: <em>to be completed</em>. Responsible: ${a.owner ? esc(a.owner) : '<em>to be completed</em>'}.</p>`,
    Contacts: (a) =>
      `<table>${field('Primary owner', a.owner)}${field('Escalation', null)}${field('Vendor support', null)}</table>`,
    Topology: () =>
      `<p>Describe uplinks, downlinks and the role of this device in the topology. Link the network diagram.</p>`,
    Addressing: (a) =>
      `<table>${field('Management IP', a.ipAddress)}${field('Subnets / VLANs', null)}${field('Gateway', null)}${field('DNS', null)}</table>`,
    Configuration: () =>
      `<p>Where the configuration is stored, how changes are made and how the config is backed up.</p>`,
    Redundancy: () =>
      `<p>Failover partner, protocol (HSRP/VRRP/stacking) and known single points of failure.</p>`,
    Scope: (a) => `<p>This document covers ${esc(a.name)} and directly dependent systems.</p>${factTable}`,
    'Access Control': () =>
      `<p>Who has access, on which level, and the request/revocation procedure.</p>`,
    Hardening: () => `<p>Applied hardening baseline and documented deviations.</p>`,
    'Incident Response': () =>
      `<p>First steps when a security incident involving this system is suspected, and who to alert.</p>`,
    Review: () => `<p>This document is reviewed every 90 days by the security owner.</p>`,
    Schedule: () =>
      `<table><tr><td><strong>Full backup</strong></td><td><em>to be completed</em></td></tr><tr><td><strong>Incremental</strong></td><td><em>to be completed</em></td></tr><tr><td><strong>Retention</strong></td><td><em>to be completed</em></td></tr></table>`,
    Storage: () =>
      `<p>Backup target, offsite copy and immutability/air-gap protection.</p>`,
    'Restore Procedure': () =>
      `<ol><li>Identify restore point.</li><li>Restore to staging.</li><li>Validate integrity.</li><li>Promote to production.</li></ol><p>RTO: <em>to be completed</em> · RPO: <em>to be completed</em></p>`,
    Verification: () => `<p>Restore tests are performed quarterly; record results here.</p>`,
    Alerting: () => `<p>Thresholds, alert channels and on-call routing for this system.</p>`,
    Dashboards: () => `<p>Links to the dashboards showing the live state of this system.</p>`,
    Escalation: () => `<p>Escalation chain when an alert is not acknowledged within 15 minutes.</p>`,
    Purpose: (a) => `<p>Standard operating procedure for ${esc(a.name)}.</p>`,
    Prerequisites: () => `<ul><li>Required access/roles</li><li>Required tools</li><li>Safe execution window</li></ul>`,
    Procedure: () => `<ol><li>Step one…</li><li>Step two…</li></ol>`,
    Rollback: () => `<p>How to return to a safe state if any step fails.</p>`,
    Validation: () => `<p>Checks that confirm the procedure succeeded.</p>`,
  }

  const body = sections
    .map((s) => {
      const renderer = sectionBodies[s.heading]
      const inner = renderer ? renderer(asset) : `<p>${esc(s.rationale)}.</p>`
      return `<h2>${esc(s.heading)}</h2>\n${inner}`
    })
    .join('\n')

  const content = `<h1>${esc(title)}</h1>\n<p><em>Generated by the Trust Doc agent from the asset inventory. Sections marked "to be completed" need engineer input.</em></p>\n${body}`

  return { title, content }
}
