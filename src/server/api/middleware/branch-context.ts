import type { MiddlewareHandler } from 'hono';
import { AppError } from '../../lib/errors';
import { D1UserRepository } from '../../db/repositories/user-repository';
import { D1TenantRepository } from '../../db/repositories/tenant-repository';
import type { AppEnv } from '../../types/env';

export const branchContextMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get('authUser');
  const tenantId = c.get('tenantId');
  if (!user || !tenantId) throw new AppError(401, 'AUTH_REQUIRED', 'A valid SmartPOS session is required.');

  const requestedBranch = c.req.header('X-Branch-ID')?.trim() || null;
  const tenantRepository = new D1TenantRepository(c.env.DB);
  const primaryBranchId = (await tenantRepository.getTenant(tenantId))?.branches.find((branch) => branch.isPrimary)?.id ?? null;
  let branchId = requestedBranch || user.branchId || primaryBranchId;
  const userRepository = new D1UserRepository(c.env.DB);
  if (branchId && !(await userRepository.hasBranch(tenantId, branchId))) {
    if (requestedBranch) throw new AppError(403, 'BRANCH_FORBIDDEN', 'The selected branch does not belong to this tenant or is inactive.');
    branchId = primaryBranchId;
  }
  c.set('branchId', branchId);
  await next();
};
