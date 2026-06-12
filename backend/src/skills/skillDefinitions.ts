/**
 * Trust Doc Agent Skills
 * Task-oriented IT documentation expertise — no free-form chat.
 */

export interface SkillField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: 'server' | 'network' | 'security' | 'backup' | 'compliance' | 'operations';
  icon: string;
  fields: SkillField[];
  outputType: 'document' | 'checklist' | 'report' | 'findings';
}

export const agentSkills: AgentSkill[] = [
  {
    id: 'draft-server-doc',
    name: 'Server Documentation',
    description: 'Generate NIST-compliant server documentation from structured inputs.',
    category: 'server',
    icon: 'server',
    outputType: 'document',
    fields: [
      { key: 'hostname', label: 'Hostname', type: 'text', required: true, placeholder: 'srv-prod-01' },
      { key: 'ipAddress', label: 'IP Address', type: 'text', required: true, placeholder: '10.0.1.50' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'DC Frankfurt' },
      { key: 'environment', label: 'Environment', type: 'select', required: true, options: [
        { value: 'production', label: 'Production' },
        { value: 'staging', label: 'Staging' },
        { value: 'development', label: 'Development' },
        { value: 'test', label: 'Test' },
      ]},
      { key: 'operatingSystem', label: 'Operating System', type: 'text', required: true, placeholder: 'Windows Server 2022' },
      { key: 'serverRole', label: 'Server Role(s)', type: 'textarea', placeholder: 'Domain Controller, DNS, DHCP' },
      { key: 'owner', label: 'Responsible Owner', type: 'text', placeholder: 'IT Infrastructure Team' },
    ],
  },
  {
    id: 'gap-analysis',
    name: 'Documentation Gap Analysis',
    description: 'Analyze existing documentation against NIST/ISO standards and identify missing sections.',
    category: 'compliance',
    icon: 'search',
    outputType: 'findings',
    fields: [
      { key: 'documentTitle', label: 'Document Title', type: 'text', required: true },
      { key: 'documentContent', label: 'Document Content', type: 'textarea', required: true, placeholder: 'Paste document content here...' },
      { key: 'standard', label: 'Compliance Standard', type: 'select', required: true, options: [
        { value: 'nist-800-123', label: 'NIST SP 800-123 (Server)' },
        { value: 'nist-800-53', label: 'NIST SP 800-53 (Security)' },
        { value: 'iso-27001', label: 'ISO 27001' },
        { value: 'nist-csf', label: 'NIST Cybersecurity Framework' },
      ]},
    ],
  },
  {
    id: 'network-topology-doc',
    name: 'Network Topology Documentation',
    description: 'Create structured network documentation with VLANs, subnets, and device inventory.',
    category: 'network',
    icon: 'network',
    outputType: 'document',
    fields: [
      { key: 'networkName', label: 'Network Name', type: 'text', required: true, placeholder: 'Corporate LAN' },
      { key: 'subnets', label: 'Subnets & VLANs', type: 'textarea', required: true, placeholder: 'VLAN 10: 10.0.10.0/24 - Management\nVLAN 20: 10.0.20.0/24 - Servers' },
      { key: 'coreDevices', label: 'Core Devices', type: 'textarea', placeholder: 'Core Switch: Cisco Catalyst 9300\nFirewall: FortiGate 100F' },
      { key: 'wanConnections', label: 'WAN / Internet', type: 'textarea', placeholder: 'Primary: 1Gbps fiber, Provider XYZ' },
      { key: 'dnsServers', label: 'DNS Servers', type: 'text', placeholder: '10.0.1.10, 10.0.1.11' },
    ],
  },
  {
    id: 'backup-procedure',
    name: 'Backup & Recovery Procedure',
    description: 'Draft a backup and disaster recovery procedure document.',
    category: 'backup',
    icon: 'hard-drive',
    outputType: 'document',
    fields: [
      { key: 'systemName', label: 'System / Service', type: 'text', required: true, placeholder: 'SQL Server Cluster' },
      { key: 'backupTool', label: 'Backup Solution', type: 'text', required: true, placeholder: 'Veeam Backup & Replication' },
      { key: 'schedule', label: 'Backup Schedule', type: 'text', required: true, placeholder: 'Full: Sunday 02:00, Incremental: Daily 02:00' },
      { key: 'retention', label: 'Retention Policy', type: 'text', placeholder: '30 days daily, 12 months monthly' },
      { key: 'rto', label: 'RTO (Recovery Time Objective)', type: 'text', placeholder: '4 hours' },
      { key: 'rpo', label: 'RPO (Recovery Point Objective)', type: 'text', placeholder: '1 hour' },
    ],
  },
  {
    id: 'security-audit-checklist',
    name: 'Security Audit Checklist',
    description: 'Generate a security audit checklist for servers or network infrastructure.',
    category: 'security',
    icon: 'shield',
    outputType: 'checklist',
    fields: [
      { key: 'scope', label: 'Audit Scope', type: 'select', required: true, options: [
        { value: 'server', label: 'Server Security' },
        { value: 'network', label: 'Network Security' },
        { value: 'endpoint', label: 'Endpoint Security' },
        { value: 'cloud', label: 'Cloud Infrastructure' },
      ]},
      { key: 'targetSystems', label: 'Target Systems', type: 'textarea', placeholder: 'List systems to audit...' },
      { key: 'framework', label: 'Security Framework', type: 'select', options: [
        { value: 'cis', label: 'CIS Benchmarks' },
        { value: 'nist-800-53', label: 'NIST 800-53' },
        { value: 'iso-27001', label: 'ISO 27001' },
      ]},
    ],
  },
  {
    id: 'incident-runbook',
    name: 'Incident Response Runbook',
    description: 'Create a structured incident response runbook for common IT scenarios.',
    category: 'operations',
    icon: 'alert-triangle',
    outputType: 'document',
    fields: [
      { key: 'incidentType', label: 'Incident Type', type: 'select', required: true, options: [
        { value: 'server-down', label: 'Server Unreachable' },
        { value: 'network-outage', label: 'Network Outage' },
        { value: 'security-breach', label: 'Security Incident' },
        { value: 'data-loss', label: 'Data Loss / Corruption' },
        { value: 'service-degradation', label: 'Service Degradation' },
      ]},
      { key: 'affectedSystems', label: 'Affected Systems', type: 'textarea', required: true },
      { key: 'escalationContacts', label: 'Escalation Contacts', type: 'textarea', placeholder: 'L1: helpdesk@company.com\nL2: infra@company.com' },
      { key: 'severity', label: 'Default Severity', type: 'select', options: [
        { value: 'critical', label: 'Critical (P1)' },
        { value: 'high', label: 'High (P2)' },
        { value: 'medium', label: 'Medium (P3)' },
        { value: 'low', label: 'Low (P4)' },
      ]},
    ],
  },
];

export function getSkillById(id: string): AgentSkill | undefined {
  return agentSkills.find((s) => s.id === id);
}
