import type { DocType, DocTypeMeta } from './types'
import { Server, Network, AppWindow, HardDrive, ShieldCheck, DatabaseBackup, type LucideIcon } from 'lucide-react'

export const DOC_TYPE_META: Record<DocType, DocTypeMeta> = {
  server: {
    type: 'server',
    label: 'Server',
    description: 'Physical or virtual server documentation',
    requiredFields: ['hostname', 'ipAddress', 'os', 'role', 'location', 'cpu', 'memory', 'storage'],
    requiredSections: ['Overview', 'Hardware & OS', 'Network', 'Services & Roles', 'Access & Accounts', 'Backup', 'Monitoring', 'Dependencies', 'Maintenance'],
  },
  network: {
    type: 'network',
    label: 'Network Device',
    description: 'Firewalls, switches, routers and network gear',
    requiredFields: ['hostname', 'mgmtIp', 'vendor', 'model', 'deviceRole', 'location', 'firmware'],
    requiredSections: ['Overview', 'Interfaces & VLANs', 'Routing & Firewall', 'Access & Accounts', 'Configuration Backup', 'Monitoring', 'Dependencies'],
  },
  application: {
    type: 'application',
    label: 'Application',
    description: 'Business and line-of-business applications',
    requiredFields: ['appName', 'vendor', 'version', 'url', 'hostingServer', 'dbBackend'],
    requiredSections: ['Overview', 'Architecture', 'Hosting & Dependencies', 'Access & Licensing', 'Backup & Recovery', 'Support & SLA'],
  },
  storage: {
    type: 'storage',
    label: 'Storage',
    description: 'SAN/NAS, volumes and file shares',
    requiredFields: ['systemName', 'mgmtIp', 'vendor', 'capacity', 'raidLevel', 'location'],
    requiredSections: ['Overview', 'Volumes & Shares', 'Capacity & Performance', 'Access & Permissions', 'Backup & Replication', 'Monitoring'],
  },
  security: {
    type: 'security',
    label: 'Security Policy',
    description: 'Security policies, controls and procedures',
    requiredFields: ['policyArea', 'scope', 'owner', 'reviewCycle', 'standard'],
    requiredSections: ['Purpose', 'Scope', 'Policy Statement', 'Controls', 'Roles & Responsibilities', 'Review & Exceptions'],
  },
  backup: {
    type: 'backup',
    label: 'Backup Job',
    description: 'Backup & disaster recovery procedures',
    requiredFields: ['jobName', 'source', 'destination', 'schedule', 'retention', 'rpo', 'rto'],
    requiredSections: ['Overview', 'Scope & Targets', 'Schedule & Retention', 'Restore Procedure', 'Verification', 'Responsibilities'],
  },
}

export const DOC_TYPE_ICON: Record<DocType, LucideIcon> = {
  server: Server,
  network: Network,
  application: AppWindow,
  storage: HardDrive,
  security: ShieldCheck,
  backup: DatabaseBackup,
}

export const DOC_TYPE_LIST = Object.values(DOC_TYPE_META)

/** Human-friendly labels for field keys used across the app. */
export const FIELD_LABELS: Record<string, string> = {
  hostname: 'Hostname',
  ipAddress: 'IP Address',
  mgmtIp: 'Management IP',
  os: 'Operating System',
  role: 'Server Role',
  deviceRole: 'Device Role',
  location: 'Location / Datacenter',
  cpu: 'CPU',
  memory: 'Memory (RAM)',
  storage: 'Storage',
  vendor: 'Vendor',
  model: 'Model',
  firmware: 'Firmware Version',
  appName: 'Application Name',
  version: 'Version',
  url: 'URL / Endpoint',
  hostingServer: 'Hosting Server',
  dbBackend: 'Database Backend',
  systemName: 'System Name',
  capacity: 'Capacity',
  raidLevel: 'RAID Level',
  policyArea: 'Policy Area',
  scope: 'Scope',
  owner: 'Owner',
  reviewCycle: 'Review Cycle',
  standard: 'Aligned Standard',
  jobName: 'Job Name',
  source: 'Source',
  destination: 'Destination',
  schedule: 'Schedule',
  retention: 'Retention',
  rpo: 'RPO',
  rto: 'RTO',
}

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}
