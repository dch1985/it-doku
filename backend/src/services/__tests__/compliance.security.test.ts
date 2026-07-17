import assert from 'node:assert/strict';
import test from 'node:test';

import { assertTenantScopedAccess, buildQualityFindingTenantScope } from '../compliance.service.js';

test('buildQualityFindingTenantScope limits results to current tenant', () => {
  assert.deepEqual(buildQualityFindingTenantScope('tenant-a'), {
    OR: [
      { document: { tenantId: 'tenant-a' } },
      { generationJob: { tenantId: 'tenant-a' } },
    ],
  });
});

test('buildQualityFindingTenantScope without tenant only includes global findings', () => {
  assert.deepEqual(buildQualityFindingTenantScope(null), {
    OR: [
      { document: { tenantId: null } },
      { generationJob: { tenantId: null } },
      {
        AND: [
          { documentId: null },
          { generationJobId: null },
        ],
      },
    ],
  });
});

test('assertTenantScopedAccess allows matching tenant access', () => {
  assert.doesNotThrow(() => assertTenantScopedAccess('tenant-a', 'tenant-a'));
  assert.doesNotThrow(() => assertTenantScopedAccess(null, 'tenant-a'));
});

test('assertTenantScopedAccess blocks cross-tenant access', () => {
  assert.throws(
    () => assertTenantScopedAccess('tenant-b', 'tenant-a'),
    (error: any) => error?.message === 'Zugriff auf diese Ressource ist nicht erlaubt',
  );
});

test('assertTenantScopedAccess blocks tenant-scoped resources without tenant context', () => {
  assert.throws(
    () => assertTenantScopedAccess('tenant-a', null),
    (error: any) => error?.message === 'Tenant-Kontext ist erforderlich',
  );
});
