import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiDollarSign, FiShoppingBag, FiTrendingUp } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { currency } from '../../utils/format.js';

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => endpoints.dashboard().then((res) => res.data.data) });
  if (isLoading) return <div className="page-shell"><Skeleton lines={6} /></div>;
  const metrics = data?.metrics || {};

  return (
    <div className="page-shell">
      <PageHeader title="Dashboard" description="Live view of sales, inventory pressure, financials, and AI insights." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Today's Sales" value={currency(metrics.todaySales)} icon={FiDollarSign} />
        <Card title="Today's Orders" value={metrics.todayOrders || 0} icon={FiShoppingBag} tone="emerald" />
        <Card title="Inventory Alerts" value={metrics.inventoryAlerts || 0} icon={FiAlertTriangle} tone="amber" />
        <Card title="Profit" value={currency(metrics.profit)} subtitle={`${currency(metrics.revenue)} revenue`} icon={FiTrendingUp} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <DataTable columns={[{ key: 'name', label: 'Low Stock Product' }, { key: 'stockQuantity', label: 'Stock' }, { key: 'lowStockThreshold', label: 'Threshold' }]} rows={data?.lowStock || []} empty="Inventory is healthy." />
        <div className="panel p-5">
          <p className="text-sm font-semibold text-slate-950">AI Insights</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Profit today is {currency(metrics.profit)}. {metrics.inventoryAlerts ? 'Review low stock items before the next sales push.' : 'No urgent inventory issues are visible.'}</p>
          <div className="mt-5 space-y-3">
            {(data?.recentActivities || []).map((activity) => <p key={activity._id} className="text-sm text-slate-500">{activity.action} {activity.entity}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
