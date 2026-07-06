import { ChartPanel } from './ChartPanel.jsx';

export function Heatmap({ title, data = [] }) {
  const max = Math.max(...data.map((item) => item.value || item.revenue || item.orders || 0), 1);
  return (
    <ChartPanel title={title}>
      <div className="grid h-full grid-cols-7 gap-2">
        {data.slice(0, 35).map((item, index) => {
          const value = item.value || item.revenue || item.orders || 0;
          const opacity = Math.max(0.12, value / max);
          return <div key={`${item._id}-${index}`} className="rounded-md bg-brand-600 p-2 text-[10px] text-white" style={{ opacity }} title={`${item._id}: ${value}`}>{String(item._id).slice(5)}</div>;
        })}
      </div>
    </ChartPanel>
  );
}
