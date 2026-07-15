import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { VendorStat } from '../../types';

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm space-y-1">
        <p className="text-white font-medium">{label}</p>
        <p className="text-emerald-400">Invoices: {payload[0]?.value}</p>
      </div>
    );
  }
  return null;
}

interface VendorInvoiceChartProps {
  data: VendorStat[];
}

export default function VendorInvoiceChart({ data }: VendorInvoiceChartProps) {
  // Take the top 10 vendors and truncate long names so they fit in the chart
  const top10Vendors = data.slice(0, 10).map((vendorStat) => ({
    name:     vendorStat.vendorName.length > 12
                ? vendorStat.vendorName.slice(0, 12) + '…'
                : vendorStat.vendorName,
    invoices: vendorStat.invoiceCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={top10Vendors}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2d45" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
        <Bar dataKey="invoices" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
