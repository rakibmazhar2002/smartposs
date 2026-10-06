import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { ProtectedRoute, AdminRoute } from './ProtectedRoute';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/modules/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/modules/auth/pages/ResetPasswordPage';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { SettingsPage } from '@/modules/settings/SettingsPage';
import { ModulePlaceholderPage } from '@/modules/placeholder/ModulePlaceholderPage';
import { AdminOverviewPage } from '@/modules/admin/AdminOverviewPage';
import { ClientsPage } from '@/modules/admin/ClientsPage';
import { PackagesPage } from '@/modules/admin/PackagesPage';
import { SubscriptionsPage } from '@/modules/admin/SubscriptionsPage';

export function AppRouter() {
  return <Routes><Route path="/" element={<LandingPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route element={<ProtectedRoute />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/settings" element={<SettingsPage />} /><Route path="/pos" element={<ModulePlaceholderPage module="Point of sale" eyebrow="Operational workspace" icon="pos" />} /><Route path="/products" element={<ModulePlaceholderPage module="Products" eyebrow="Catalog foundation" icon="products" />} /><Route path="/inventory" element={<ModulePlaceholderPage module="Inventory" eyebrow="Stock intelligence" icon="inventory" />} /><Route path="/orders" element={<ModulePlaceholderPage module="Orders" eyebrow="Order lifecycle" icon="orders" />} /><Route path="/reports" element={<ModulePlaceholderPage module="Reports" eyebrow="Decision layer" icon="reports" />} /></Route><Route element={<AdminRoute />}><Route path="/admin" element={<AdminOverviewPage />} /><Route path="/admin/clients" element={<ClientsPage />} /><Route path="/admin/packages" element={<PackagesPage />} /><Route path="/admin/subscriptions" element={<SubscriptionsPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
