import { prisma } from '../../../lib/prisma.js';
import { ok, type Tool } from '../types.js';

export const listNetworkDevicesTool: Tool = {
  name: 'list_network_devices',
  description:
    'Listet im Netzwerk entdeckte Geräte (Switches, Router, Firewalls, Access Points, etc.) des Tenants. Quelle für Netzwerk-Topologie-Dokumentation und Drift-Erkennung.',
  readOnly: true,
  parameters: {
    type: 'object',
    properties: {
      deviceType: { type: 'string', description: 'z.B. SWITCH, ROUTER, FIREWALL, ACCESS_POINT' },
      activeOnly: { type: 'boolean', description: 'Nur aktive Geräte (Standard true)' },
      limit: { type: 'number', description: 'Maximale Trefferzahl (Standard 50)' },
    },
  },
  async execute(args, context) {
    const limit = Math.min(Number(args.limit) || 50, 200);
    const activeOnly = args.activeOnly === undefined ? true : Boolean(args.activeOnly);

    const devices = await prisma.networkDevice.findMany({
      where: {
        tenantId: context.tenantId ?? undefined,
        ...(args.deviceType ? { deviceType: String(args.deviceType).toUpperCase() } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      select: {
        id: true,
        name: true,
        ipAddress: true,
        macAddress: true,
        hostname: true,
        deviceType: true,
        manufacturer: true,
        model: true,
        firmware: true,
        subnet: true,
        gateway: true,
        isActive: true,
        lastSeen: true,
      },
      orderBy: { ipAddress: 'asc' },
      take: limit,
    });

    for (const device of devices) {
      context.recordEvidence({
        sourceType: 'DATABASE',
        source: 'list_network_devices',
        reference: `network_device:${device.id}`,
        claim: `${device.deviceType} "${device.name}" @ ${device.ipAddress}${device.firmware ? ` (FW ${device.firmware})` : ''}`,
        data: device,
      });
    }

    return ok({ count: devices.length, devices });
  },
};
