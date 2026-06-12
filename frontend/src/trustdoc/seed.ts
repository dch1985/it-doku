import type { Asset, TrustDocument } from './types'

const now = Date.now()
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString()

export const seedAssets: Asset[] = [
  {
    id: 'as-dc01',
    name: 'DC01',
    type: 'Virtual Machine',
    environment: 'Production',
    status: 'Operational',
    ip: '10.10.1.10',
    os: 'Windows Server 2022',
    location: 'DC Frankfurt / Rack A1',
    owner: 'Platform Team',
    notes: 'Primary domain controller, DNS + AD DS.',
  },
  {
    id: 'as-app01',
    name: 'APP-PROD-01',
    type: 'Virtual Machine',
    environment: 'Production',
    status: 'Operational',
    ip: '10.10.2.21',
    os: 'Ubuntu Server 24.04 LTS',
    location: 'DC Frankfurt / Rack B2',
    owner: 'Application Team',
    notes: 'Hosts the core ERP web tier behind the load balancer.',
  },
  {
    id: 'as-db01',
    name: 'SQL-PROD-01',
    type: 'Physical Server',
    environment: 'Production',
    status: 'Degraded',
    ip: '10.10.2.40',
    os: 'Windows Server 2022',
    location: 'DC Frankfurt / Rack B3',
    owner: 'Database Team',
    notes: 'Primary SQL Server, AlwaysOn availability group node 1.',
  },
  {
    id: 'as-esxi01',
    name: 'ESXi-Cluster-01',
    type: 'Hypervisor',
    environment: 'Production',
    status: 'Operational',
    ip: '10.10.0.5',
    os: 'VMware ESXi 8.0',
    location: 'DC Frankfurt / Rack A2',
    owner: 'Platform Team',
    notes: '4-node vSphere cluster, HA + DRS enabled.',
  },
  {
    id: 'as-fw01',
    name: 'FW-EDGE-01',
    type: 'Firewall',
    environment: 'Production',
    status: 'Operational',
    ip: '10.10.0.1',
    os: 'Fortinet FortiOS 7.4',
    location: 'DC Frankfurt / Rack A1',
    owner: 'Network Team',
    notes: 'Perimeter firewall, HA active/passive pair.',
  },
  {
    id: 'as-sw-core',
    name: 'SW-CORE-01',
    type: 'Switch',
    environment: 'Production',
    status: 'Operational',
    ip: '10.10.0.2',
    os: 'Cisco IOS-XE 17.9',
    location: 'DC Frankfurt / Rack A1',
    owner: 'Network Team',
    notes: 'Core L3 switch stack.',
  },
  {
    id: 'as-bkp01',
    name: 'BACKUP-01',
    type: 'Physical Server',
    environment: 'Production',
    status: 'Maintenance',
    ip: '10.10.3.50',
    os: 'Veeam Backup & Replication 12',
    location: 'DC Frankfurt / Rack C1',
    owner: 'Platform Team',
    notes: 'Backup repository + proxy.',
  },
  {
    id: 'as-stg01',
    name: 'APP-STG-01',
    type: 'Virtual Machine',
    environment: 'Staging',
    status: 'Operational',
    ip: '10.20.2.21',
    os: 'Ubuntu Server 24.04 LTS',
    location: 'DC Frankfurt / Rack B2',
    owner: 'Application Team',
    notes: 'Pre-production mirror of APP-PROD-01.',
  },
]

export const seedDocuments: TrustDocument[] = [
  {
    id: 'doc-dc01',
    title: 'DC01 — Domain Controller Runbook',
    category: 'Server',
    status: 'Published',
    owner: 'Platform Team',
    linkedAssetId: 'as-dc01',
    tags: ['active-directory', 'dns', 'windows'],
    createdAt: daysAgo(40),
    updatedAt: daysAgo(4),
    content: `# DC01 — Domain Controller Runbook

## 1. Overview
DC01 is the **primary domain controller** for the \`corp.local\` forest. It provides Active Directory Domain Services, DNS, and time synchronization for all production workloads.

| Property | Value |
| --- | --- |
| Hostname | DC01 |
| Role | Primary Domain Controller |
| Environment | Production |
| IP Address | 10.10.1.10 |
| Operating System | Windows Server 2022 |

## 2. Services
- Active Directory Domain Services (AD DS)
- DNS (AD-integrated zones)
- Network Time Protocol (authoritative)

## 3. Maintenance
- Patch window: monthly, second Tuesday, 02:00–04:00 CET.
- Reboots require confirmation that DC02 is healthy and replicating.

## 4. Recovery
1. Verify DC02 is holding FSMO roles or seize roles if DC01 is unrecoverable.
2. Restore from system state backup (BACKUP-01).
3. Validate replication with \`repadmin /replsummary\`.`,
  },
  {
    id: 'doc-fw01',
    title: 'FW-EDGE-01 — Perimeter Firewall Configuration',
    category: 'Network',
    status: 'Published',
    owner: 'Network Team',
    linkedAssetId: 'as-fw01',
    tags: ['firewall', 'fortinet', 'security'],
    createdAt: daysAgo(60),
    updatedAt: daysAgo(12),
    content: `# FW-EDGE-01 — Perimeter Firewall

## Overview
Perimeter firewall protecting the Frankfurt data center. Deployed as an **active/passive HA pair**.

## High Availability
- Mode: Active/Passive
- Heartbeat interface: port15/port16
- Failover tested: quarterly

## Key Policies
| ID | Source | Destination | Service | Action |
| --- | --- | --- | --- | --- |
| 12 | Internal | Internet | HTTPS | Allow |
| 20 | DMZ | App tier | 8443 | Allow |
| 99 | Any | Any | Any | Deny (log) |`,
  },
  {
    id: 'doc-backup',
    title: 'Backup & Disaster Recovery Plan',
    category: 'Backup & DR',
    status: 'In Review',
    owner: 'Platform Team',
    linkedAssetId: 'as-bkp01',
    tags: ['veeam', 'dr', 'rpo', 'rto'],
    createdAt: daysAgo(25),
    updatedAt: daysAgo(2),
    content: `# Backup & Disaster Recovery Plan

## Objectives
- **RPO:** 1 hour for tier-1 systems.
- **RTO:** 4 hours for tier-1 systems.

## Backup Schedule
| System | Frequency | Retention |
| --- | --- | --- |
| Domain Controllers | Daily | 30 days |
| SQL databases | Hourly log + daily full | 35 days |
| File shares | Daily | 90 days |

## Restore Test
Restore drills are performed monthly against an isolated network.`,
  },
  {
    id: 'doc-net-topology',
    title: 'Core Network Topology',
    category: 'Infrastructure',
    status: 'Outdated',
    owner: 'Network Team',
    linkedAssetId: null,
    tags: ['topology', 'vlan', 'network'],
    createdAt: daysAgo(120),
    updatedAt: daysAgo(95),
    content: `# Core Network Topology

## VLANs
| VLAN | Purpose | Subnet |
| --- | --- | --- |
| 10 | Management | 10.10.1.0/24 |
| 20 | Servers | 10.10.2.0/24 |
| 30 | Backup | 10.10.3.0/24 |

> This document is overdue for review after the Q1 switch refresh.`,
  },
]
