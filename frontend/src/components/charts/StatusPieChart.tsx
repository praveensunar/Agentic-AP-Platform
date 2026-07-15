import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { StatusCount } from '../../types';

// Color assigned to each invoice status in the pie chart
const STATUS_COLOR_MAP: Record<string, string> = {
  Uploaded:              '#3b82f6',
  Processing:            '#f59e0b',
  'OCR Complete':        '#a855f7',
  'Extraction Complete': '#6366f1',
  'Validation Complete': '#06b6d4',
  'Human Review':        '#f97316',
  Approved:              '#10b981',
  Failed:                '#ef4444',
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (active && payload?.length) {
    const hoveredSlice = payload[0];
    return (
      <div className="glass-card px-3 py-2 text-sm">
        <p className="text-white font-medium">{hoveredSlice.name}</p>
        <p className="text-muted">{hoveredSlice.value} invoices</p>
      </div>
    );
  }
  return null;
}

interface StatusPieChartProps {
  data: StatusCount[];
}

export default function StatusPieChart({ data }: StatusPieChartProps) {
  // Transform the raw status count data into the format Recharts expects
  const chartFormattedData = data.map((statusEntry) => ({
    name:  statusEntry.status,
    value: statusEntry.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartFormattedData}
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {chartFormattedData.map((chartEntry) => (
            <Cell
              key={chartEntry.name}
              fill={STATUS_COLOR_MAP[chartEntry.name] ?? '#64748b'}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(statusLabel) => (
            <span className="text-xs text-muted">{statusLabel}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
