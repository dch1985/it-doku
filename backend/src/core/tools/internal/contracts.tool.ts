import { prisma } from '../../../lib/prisma.js';
import { ok, type Tool } from '../types.js';

export const listExpiringContractsTool: Tool = {
  name: 'list_contracts_expiring',
  description:
    'Listet Verträge/Lizenzen, die innerhalb der nächsten N Tage auslaufen oder zur Verlängerung anstehen. Nützlich für Onboarding-, Audit- und Renewal-Dokumentation.',
  readOnly: true,
  parameters: {
    type: 'object',
    properties: {
      withinDays: { type: 'number', description: 'Zeitfenster in Tagen (Standard 90)' },
      type: { type: 'string', description: 'z.B. SOFTWARE, SUPPORT, SSL, DOMAIN, LICENSE' },
    },
  },
  async execute(args, context) {
    const withinDays = Math.min(Math.max(Number(args.withinDays) || 90, 1), 730);
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + withinDays);

    const contracts = await prisma.contract.findMany({
      where: {
        tenantId: context.tenantId ?? undefined,
        ...(args.type ? { type: String(args.type).toUpperCase() } : {}),
        endDate: { lte: horizon },
      },
      select: {
        id: true,
        name: true,
        type: true,
        vendor: true,
        contractNumber: true,
        startDate: true,
        endDate: true,
        renewalDate: true,
        autoRenew: true,
        monthlyCost: true,
        annualCost: true,
        currency: true,
      },
      orderBy: { endDate: 'asc' },
      take: 100,
    });

    for (const contract of contracts) {
      context.recordEvidence({
        sourceType: 'DATABASE',
        source: 'list_contracts_expiring',
        reference: `contract:${contract.id}`,
        claim: `Vertrag "${contract.name}" (${contract.type}) läuft ${contract.endDate?.toISOString().slice(0, 10) ?? 'unbekannt'} aus`,
        data: contract,
      });
    }

    return ok({ count: contracts.length, withinDays, contracts });
  },
};
