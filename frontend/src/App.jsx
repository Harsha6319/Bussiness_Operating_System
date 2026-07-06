import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';

const LoginPage = React.lazy(() => import('./features/auth/LoginPage.jsx').then(module => ({ default: module.LoginPage })));
const RegisterPage = React.lazy(() => import('./features/auth/RegisterPage.jsx').then(module => ({ default: module.RegisterPage })));
const CopilotPage = React.lazy(() => import('./features/ai/CopilotPage.jsx').then(module => ({ default: module.CopilotPage })));
const KnowledgePage = React.lazy(() => import('./features/ai/KnowledgePage.jsx').then(module => ({ default: module.KnowledgePage })));
const ReportsPage = React.lazy(() => import('./features/ai/ReportsPage.jsx').then(module => ({ default: module.ReportsPage })));
const AnalyticsPage = React.lazy(() => import('./features/analytics/AnalyticsPage.jsx').then(module => ({ default: module.AnalyticsPage })));
const AutomationPage = React.lazy(() => import('./features/automation/AutomationPage.jsx').then(module => ({ default: module.AutomationPage })));
const CustomerPage = React.lazy(() => import('./features/customers/CustomerPage.jsx').then(module => ({ default: module.CustomerPage })));
const DashboardPage = React.lazy(() => import('./features/dashboard/DashboardPage.jsx').then(module => ({ default: module.DashboardPage })));
const FinancePage = React.lazy(() => import('./features/finance/FinancePage.jsx').then(module => ({ default: module.FinancePage })));
const InventoryPage = React.lazy(() => import('./features/inventory/InventoryPage.jsx').then(module => ({ default: module.InventoryPage })));
const OrdersPage = React.lazy(() => import('./features/orders/OrdersPage.jsx').then(module => ({ default: module.OrdersPage })));
const SettingsPage = React.lazy(() => import('./features/settings/SettingsPage.jsx').then(module => ({ default: module.SettingsPage })));

const SuspenseFallback = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/copilot" element={<CopilotPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/ai-reports" element={<ReportsPage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
