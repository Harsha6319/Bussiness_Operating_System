import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FiAlertTriangle, FiBarChart2, FiBox, FiDollarSign, FiShoppingCart, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { AreaMetricChart } from '../../components/charts/AreaMetricChart.jsx';
import { BarMetricChart } from '../../components/charts/BarMetricChart.jsx';
import { DonutChart } from '../../components/charts/DonutChart.jsx';
import { Heatmap } from '../../components/charts/Heatmap.jsx';
import { currency } from '../../utils/format.js';

const ranges = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' }
];

function exportCsv(rows, filename) {
  const csv = rows.map((row) => Object.values(row).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsPage() {
  const [range, setRange] = useState('last30');
  const dashboard = useQuery({ queryKey: ['analytics-dashboard', range], queryFn: () => endpoints.analytics.dashboard({ range }).then((res) => res.data.data) });
  const sales = useQuery({ queryKey: ['analytics-sales', range], queryFn: () => endpoints.analytics.sales({ range }).then((res) => res.data.data) });
  const customers = useQuery({ queryKey: ['analytics-customers', range], queryFn: () => endpoints.analytics.customers({ range }).then((res) => res.data.data) });
  const inventory = useQuery({ queryKey: ['analytics-inventory'], queryFn: () => endpoints.analytics.inventory().then((res) => res.data.data) });
  const finance = useQuery({ queryKey: ['analytics-finance', range], queryFn: () => endpoints.analytics.finance({ range }).then((res) => res.data.data) });
  const employees = useQuery({ queryKey: ['analytics-employees'], queryFn: () => endpoints.analytics.employees().then((res) => res.data.data) });
  const predictions = useQuery({ queryKey: ['analytics-predictions'], queryFn: () => endpoints.analytics.predictions().then((res) => res.data.data) });
  const score = useQuery({ queryKey: ['business-score'], queryFn: () => endpoints.analytics.businessScore().then((res) => res.data.data) });
  const recommendations = useQuery({ queryKey: ['analytics-recommendations'], queryFn: () => endpoints.analytics.recommendations().then((res) => res.data.data) });

  if (dashboard.isLoading) return <div className="page-shell"><Skeleton lines={8} /></div>;
  const data = dashboard.data || {};
  const kpis = data.kpis || {};
  const charts = data.charts || {};

  return (
    <div className="page-shell">
      <PageHeader
        title="Executive BI Dashboard"
        description="Understand what happened, why it happened, what may happen next, and what action to take."
        action={<select className="input w-44" value={range} onChange={(event) => setRange(event.target.value)}>{ranges.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card title="Today's Revenue" value={currency(kpis.todayRevenue)} icon={FiDollarSign} />
        <Card title="Today's Orders" value={kpis.todayOrders || 0} icon={FiShoppingCart} tone="emerald" />
        <Card title="Monthly Revenue" value={currency(kpis.monthlyRevenue)} icon={FiTrendingUp} />
        <Card title="Monthly Profit" value={currency(kpis.monthlyProfit)} icon={FiBarChart2} tone={kpis.monthlyProfit >= 0 ? 'emerald' : 'rose'} />
        <Card title="Growth" value={`${kpis.growthPercentage || 0}%`} icon={FiTrendingUp} tone={kpis.growthPercentage >= 0 ? 'emerald' : 'rose'} />
        <Card title="Pending Orders" value={kpis.pendingOrders || 0} icon={FiShoppingCart} tone="amber" />
        <Card title="Inventory Value" value={currency(kpis.inventoryValue)} icon={FiBox} />
        <Card title="Low Stock" value={kpis.lowStockProducts || 0} icon={FiAlertTriangle} tone="amber" />
        <Card title="Outstanding" value={currency(kpis.outstandingPayments)} icon={FiDollarSign} tone="rose" />
        <Card title="Active Customers" value={kpis.activeCustomers || 0} icon={FiUsers} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <div className="panel p-5">
          <p className="text-sm font-semibold text-slate-950">Business Health Score</p>
          <div className="mt-5 flex items-center gap-5">
            <div className="grid h-32 w-32 place-items-center rounded-full border-[12px] border-brand-600 text-3xl font-bold text-slate-950">{score.data?.score || 0}</div>
            <div>
              <p className="text-sm leading-6 text-slate-600">{score.data?.explanation}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">{score.data?.improvements?.map((item) => <p key={item}>{item}</p>)}</div>
            </div>
          </div>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-semibold text-slate-950">AI Decision Intelligence</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(recommendations.data || []).slice(0, 4).map((item) => (
              <div key={item._id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase text-brand-700">{item.category} - {item.severity}</p>
                <p className="mt-2 font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm text-slate-600">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AreaMetricChart title="Revenue Trend" data={charts.revenueTrend || []} formatter={(value) => currency(value)} />
        <AreaMetricChart title="Profit Trend" data={charts.profitTrend || []} color="#10b981" formatter={(value) => currency(value)} />
        <BarMetricChart title="Orders Trend" data={charts.ordersTrend || []} color="#64748b" />
        <BarMetricChart title="Expense Trend" data={charts.expenseTrend || []} color="#ef4444" formatter={(value) => currency(value)} />
        <BarMetricChart title="Sales by Category" data={charts.salesByCategory || []} dataKey="revenue" color="#2563eb" formatter={(value) => currency(value)} />
        <DonutChart title="Payment Methods" data={charts.paymentMethods || []} dataKey="amount" formatter={(value) => currency(value)} />
        <Heatmap title="Sales Heatmap" data={sales.data?.dailySales || []} />
        <BarMetricChart title="Customer Growth" data={charts.customerGrowth || []} color="#10b981" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm font-semibold text-slate-950">Predictive Analytics</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Expected revenue next month: <strong>{currency(predictions.data?.expectedRevenueNextMonth)}</strong></p>
            <p>Profit forecast: <strong>{currency(predictions.data?.profitForecast)}</strong></p>
            <p>Customer churn risk: <strong>{Math.round(predictions.data?.customerChurnRisk || 0)}%</strong></p>
            <p>Employee workload: <strong>{predictions.data?.employeeWorkloadPrediction}</strong></p>
          </div>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-semibold text-slate-950">Inventory Intelligence</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Inventory value: <strong>{currency(inventory.data?.inventoryValue)}</strong></p>
            <p>Low stock: <strong>{inventory.data?.lowStock || 0}</strong></p>
            <p>Out of stock: <strong>{inventory.data?.outOfStock || 0}</strong></p>
            <p>Inventory turnover signal: <strong>{inventory.data?.inventoryTurnover || 0}</strong></p>
          </div>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-semibold text-slate-950">Financial Health</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Revenue: <strong>{currency(finance.data?.revenue)}</strong></p>
            <p>Expenses: <strong>{currency(finance.data?.expenses)}</strong></p>
            <p>Net margin: <strong>{finance.data?.netMargin || 0}%</strong></p>
            <p>Status: <strong>{finance.data?.financialHealth}</strong></p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <DataTable columns={[{ key: 'name', label: 'Top Product' }, { key: 'quantity', label: 'Units' }, { key: 'revenue', label: 'Revenue', render: (row) => currency(row.revenue) }]} rows={charts.topProducts || []} empty="No product sales yet." />
        <DataTable columns={[{ key: 'name', label: 'Top Customer' }, { key: 'totalSpend', label: 'CLV', render: (row) => currency(row.totalSpend) }, { key: 'lastPurchaseAt', label: 'Last Purchase' }]} rows={charts.topCustomers || []} empty="No customer spend yet." />
        <DataTable columns={[{ key: 'name', label: 'Employee' }, { key: 'role', label: 'Role' }, { key: 'ordersProcessed', label: 'Orders' }, { key: 'revenue', label: 'Revenue', render: (row) => currency(row.revenue) }]} rows={employees.data || []} empty="No employee activity yet." />
        <DataTable columns={[{ key: 'product', label: 'Forecast Product' }, { key: 'expectedUnits', label: 'Expected Units' }, { key: 'confidence', label: 'Confidence', render: (row) => `${Math.round(row.confidence * 100)}%` }]} rows={predictions.data?.demandForecast || []} empty="Predictions appear after sales history grows." />
      </div>

      <div className="mt-6 flex justify-end">
        <button className="btn-secondary" onClick={() => exportCsv(charts.topProducts || [], 'top-products.csv')}>Export CSV</button>
      </div>
    </div>
  );
}
