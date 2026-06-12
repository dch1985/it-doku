/**
 * Seeds a realistic small IT environment so the agent skills have
 * something meaningful to analyze on first start.
 */
import { PrismaClient } from '@prisma/client'
import { buildAssetDocument } from '../src/agent/knowledge.js'

const prisma = new PrismaClient()

async function main() {
  const docCount = await prisma.document.count()
  const assetCount = await prisma.asset.count()
  if (docCount > 0 || assetCount > 0) {
    console.log('Database already contains data - skipping seed.')
    return
  }

  const web01 = await prisma.asset.create({
    data: {
      name: 'web-01',
      type: 'SERVER',
      hostname: 'web-01.corp.local',
      ipAddress: '10.0.10.11',
      os: 'Ubuntu 24.04 LTS',
      location: 'DC1 / Rack A3',
      owner: 'Platform Team',
      criticality: 'HIGH',
      notes: 'Primary nginx reverse proxy for all public web traffic.',
    },
  })

  const db01 = await prisma.asset.create({
    data: {
      name: 'db-01',
      type: 'DATABASE',
      hostname: 'db-01.corp.local',
      ipAddress: '10.0.20.21',
      os: 'Windows Server 2022',
      location: 'DC1 / Rack B1',
      owner: 'Data Team',
      criticality: 'CRITICAL',
      notes: 'SQL Server cluster node hosting the ERP database.',
    },
  })

  const fw01 = await prisma.asset.create({
    data: {
      name: 'fw-edge-01',
      type: 'FIREWALL',
      hostname: 'fw-edge-01.corp.local',
      ipAddress: '10.0.0.1',
      os: 'OPNsense 24.7',
      location: 'DC1 / Rack A1',
      owner: 'Network Team',
      criticality: 'CRITICAL',
      notes: 'Edge firewall, terminates site-to-site VPNs.',
    },
  })

  await prisma.asset.create({
    data: {
      name: 'sw-core-01',
      type: 'SWITCH',
      hostname: 'sw-core-01.corp.local',
      ipAddress: '10.0.0.2',
      os: 'Cisco IOS XE 17.12',
      location: 'DC1 / Rack A2',
      owner: 'Network Team',
      criticality: 'HIGH',
    },
  })

  await prisma.asset.create({
    data: {
      name: 'backup-nas',
      type: 'STORAGE',
      hostname: 'backup-nas.corp.local',
      ipAddress: '10.0.30.5',
      os: 'TrueNAS Scale 24.10',
      location: 'DC2 / Rack C1',
      owner: 'Platform Team',
      criticality: 'MEDIUM',
      notes: 'Offsite backup target, immutable snapshots enabled.',
    },
  })

  // Complete, fresh document for web-01 (generated structure, then "reviewed").
  const webDoc = buildAssetDocument(
    { ...web01, notes: web01.notes ?? null },
    'SERVER'
  )
  await prisma.document.create({
    data: {
      title: webDoc.title,
      content: webDoc.content.replace(/<em>to be completed<\/em>/g, 'documented'),
      category: 'SERVER',
      status: 'PUBLISHED',
      assetId: web01.id,
      tags: JSON.stringify(['nginx', 'production']),
      reviewedAt: new Date(),
    },
  })

  // Incomplete legacy doc for db-01: missing sections + placeholders, old.
  await prisma.document.create({
    data: {
      title: 'db-01 notes',
      content:
        '<h1>db-01 notes</h1><h2>Overview</h2><p>SQL Server box for ERP. TODO: document the cluster failover. Restore steps TBD.</p>',
      category: 'SERVER',
      status: 'PUBLISHED',
      assetId: db01.id,
      tags: JSON.stringify(['sql-server', 'erp']),
      createdAt: new Date(Date.now() - 400 * 86_400_000),
      updatedAt: new Date(Date.now() - 400 * 86_400_000),
    },
  })

  // Stale firewall security policy.
  await prisma.document.create({
    data: {
      title: 'Edge Firewall Security Policy',
      content:
        '<h1>Edge Firewall Security Policy</h1><h2>Scope</h2><p>Covers fw-edge-01 and all VPN tunnels.</p><h2>Access Control</h2><p>Only the network team has admin access via the management VLAN. Access requests go through the service desk and require team-lead approval.</p><h2>Hardening</h2><p>CIS benchmark applied; deviations documented in the change log.</p><h2>Incident Response</h2><p>On suspected compromise, isolate the WAN uplink and page the on-call network engineer.</p><h2>Review</h2><p>Reviewed quarterly by the security owner.</p>',
      category: 'SECURITY',
      status: 'PUBLISHED',
      assetId: fw01.id,
      tags: JSON.stringify(['firewall', 'policy']),
      createdAt: new Date(Date.now() - 200 * 86_400_000),
      updatedAt: new Date(Date.now() - 200 * 86_400_000),
    },
  })

  // A general onboarding doc, healthy.
  await prisma.document.create({
    data: {
      title: 'IT Operations Onboarding',
      content:
        '<h1>IT Operations Onboarding</h1><h2>Overview</h2><p>This guide walks new operations engineers through the environment: data centers DC1 and DC2, the core network, the virtualization platform and the backup landscape. Read the linked system documentation for each asset before taking on-call duty. Access is requested through the service desk; the on-call rotation is managed in the scheduling tool. Always follow the runbooks for routine procedures and record every manual change in the change log.</p>',
      category: 'GENERAL',
      status: 'PUBLISHED',
      tags: JSON.stringify(['onboarding']),
      reviewedAt: new Date(),
    },
  })

  console.log('Seeded 5 assets and 4 documents.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
