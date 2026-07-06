import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartPanel } from './ChartPanel.jsx';

export function AreaMetricChart({ title, data = [], dataKey = 'value', color = '#2563eb', formatter }) {
  return (
    <ChartPanel title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs><linearGradient id={`area-${dataKey}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.28} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="_id" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip formatter={formatter} />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#area-${dataKey})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
