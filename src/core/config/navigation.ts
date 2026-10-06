import type { LucideIcon } from 'lucide-react';
import { BarChart3, Boxes, ClipboardList, CreditCard, Gauge, Package, Settings2, ShoppingCart, Store, UsersRound } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  description?: string;
}

export const clientNavigation: NavigationItem[] = [
  { label: 'Overview', href: '/dashboard', icon: Gauge, permission: 'dashboard.read', description: 'Business pulse and actions' },
  { label: 'Point of sale', href: '/pos', icon: ShoppingCart, permission: 'pos.read', description: 'Checkout workspace' },
  { label: 'Products', href: '/products', icon: Package, permission: 'products.read', description: 'Catalog and pricing' },
  { label: 'Inventory', href: '/inventory', icon: Boxes, permission: 'inventory.read', description: 'Stock intelligence' },
  { label: 'Orders', href: '/orders', icon: ClipboardList, permission: 'orders.read', description: 'Order lifecycle' },
  { label: 'Reports', href: '/reports', icon: BarChart3, permission: 'reports.read', description: 'Performance insights' },
  { label: 'Settings', href: '/settings', icon: Settings2, permission: 'settings.tenant.read', description: 'Workspace controls' },
];

export const adminNavigation: NavigationItem[] = [
  { label: 'SaaS overview', href: '/admin', icon: Gauge, description: 'Platform health' },
  { label: 'Clients', href: '/admin/clients', icon: UsersRound, description: 'Tenant directory' },
  { label: 'Packages', href: '/admin/packages', icon: CreditCard, description: 'Plan builder' },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: Store, description: 'Renewal control' },
];
