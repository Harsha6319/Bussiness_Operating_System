import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartPanel } from './ChartPanel.jsx';

const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#8b5cf6'];

export function DonutChart({ title, data = [], dataKey = 'value', nameKey = '_id', formatter }) {
  return (
    <ChartPanel title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={58} outerRadius={92} paddingAngle={3}>
            {data.map((entry, index) => <Cell key={`${entry[nameKey]}-${index}`} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip formatter={formatter} />
        </PieChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
