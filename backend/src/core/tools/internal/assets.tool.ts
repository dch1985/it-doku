import { prisma } from '../../../lib/prisma.js';
import { ok, fail, type Tool } from '../types.js';

export const listAssetsTool: Tool = {
  name: 'list_assets',
  description:
    'Listet IT-Assets (Server, Workstations, Firewalls, etc.) aus der CMDB des Tenants. Optional gefiltert nach Typ, Status oder Suchbegriff (Name/Hostname/IP).',
  readOnly: true,
  parameters: {
    type: 'object',
    properties: {
      type: { type: 'string', description: 'Asset-Typ, z.B. SERVER, FIREWALL, WORKSTATION' },
      status: { type: 'string', description: 'ACTIVE, RETIRED, SPARE, MAINTENANCE' },
      search: { type: 'string', description: 'Suchbegriff für Name, Hostname oder IP' },
      limit: { type: 'number', description: 'Maximale Trefferzahl (Standard 25)' },
    },
  },
  async execute(args, context) {
    const limit = Math.min(Number(args.limit) || 25, 100);
    const search = args.search ? String(args.search).trim() : '';

    const assets = await prisma.asset.findMany({
      where: {
        tenantId: context.tenantId ?? undefined,
        ...(args.type ? { type: String(args.type).toUpperCase() } : {}),
        ...(args.status ? { status: String(args.status).toUpperCase() } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { hostname: { contains: search } },
                { ipAddress: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        manufacturer: true,
        model: true,
        ipAddress: true,
        hostname: true,
        location: true,
        warrantyExp: true,
        lastScannedAt: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    for (const asset of assets) {
      context.recordEvidence({
        sourceType: 'DATABASE',
        source: 'list_assets',
        reference: `asset:${asset.id}`,
        claim: `Asset "${asset.name}" (${asset.type}, ${asset.status}${asset.ipAddress ? `, ${asset.ipAddress}` : ''})`,
        data: asset,
      });
    }

    return ok({ count: assets.length, assets });
  },
};

export const getAssetTool: Tool = {
  name: 'get_asset',
  description: 'Liest ein einzelnes Asset vollständig anhand seiner ID, inkl. Metadaten.',
  readOnly: true,
  parameters: {
    type: 'object',
    properties: { id: { type: 'string', description: 'Asset-ID' } },
    required: ['id'],
  },
  async execute(args, context) {
    const id = String(args.id ?? '').trim();
    if (!id) return fail('id ist erforderlich');

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return fail('Asset nicht gefunden');
    if (context.tenantId && asset.tenantId && asset.tenantId !== context.tenantId) {
      return fail('Zugriff auf das Asset ist nicht erlaubt');
    }

    context.recordEvidence({
      sourceType: 'DATABASE',
      source: 'get_asset',
      reference: `asset:${asset.id}`,
      claim: `Asset "${asset.name}" vollständig gelesen`,
      data: asset,
    });

    return ok({ asset });
  },
};
