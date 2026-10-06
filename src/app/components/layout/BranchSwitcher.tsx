import { ChevronsUpDown, MapPin } from 'lucide-react';
import { useAuth } from '@/core/hooks/use-auth';
import { cn } from '@/core/lib/utils';

export function BranchSwitcher({ compact = false }: { compact?: boolean }) {
  const { tenant, currentBranchId, switchBranch } = useAuth();
  if (!tenant || tenant.branches.length === 0) return <div className="text-xs text-muted-foreground">No branches configured</div>;
  return <label className={cn('group flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-primary/40', compact ? 'max-w-[180px]' : 'max-w-[240px]')}><MapPin className="h-4 w-4 shrink-0 text-primary" /><span className="sr-only">Active branch</span><select value={currentBranchId ?? ''} onChange={(event) => switchBranch(event.target.value)} className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-left text-xs font-semibold text-foreground outline-none"><option value="" disabled>Select branch</option>{tenant.branches.filter((branch) => branch.status === 'ACTIVE').map((branch) => <option key={branch.id} value={branch.id}>{branch.name} · {branch.code}</option>)}</select><ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" /></label>;
}
