import { ToolRegistry } from './registry.js';
import { getDocumentTool, searchDocumentsTool } from './internal/documents.tool.js';
import { getAssetTool, listAssetsTool } from './internal/assets.tool.js';
import { listNetworkDevicesTool } from './internal/network.tool.js';
import { listExpiringContractsTool } from './internal/contracts.tool.js';
import { searchKnowledgeTool } from './internal/knowledge.tool.js';

export { ToolRegistry } from './registry.js';
export * from './types.js';

/**
 * Default registry: read-only tools over the tenant's own IT data. Connector
 * tools (Microsoft Graph, network scan, GitHub) plug in here as they are built.
 */
export function buildDefaultRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(searchDocumentsTool);
  registry.register(getDocumentTool);
  registry.register(listAssetsTool);
  registry.register(getAssetTool);
  registry.register(listNetworkDevicesTool);
  registry.register(listExpiringContractsTool);
  registry.register(searchKnowledgeTool);
  return registry;
}

/** Process-wide singleton registry. */
export const defaultRegistry = buildDefaultRegistry();
