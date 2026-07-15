import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FileText, Clock, CheckCircle, XCircle, Users,
  TrendingUp, AlertCircle, RefreshCw,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { formatCurrency, formatDate, STATUS_CONFIG } from '../utils';
import StatusPieChart from '../components/charts/StatusPieChart';
import InvoiceBarChart from '../components/charts/InvoiceBarChart';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  sub?: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor, sub }: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColor)}>
          <Icon size={20} className={color} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white mt-2">{value}</p>
        <p className="text-sm text-muted">{label}</p>
        {sub && <p className="text-xs text-muted/60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Dashboard statistics refreshed!');
    } catch (err) {
      toast.error('Failed to fetch latest statistics.');
    }
  };

  const summary = data?.summary;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AP Overview</h2>
          <p className="text-muted text-sm mt-0.5">Real-time accounts payable metrics</p>
        </div>
        <button
          onClick={handleRefresh}
          className={cn('btn-ghost flex items-center gap-2 text-sm', isRefetching && 'opacity-60')}
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-border" />
              <div className="h-8 bg-border rounded mt-2" />
              <div className="h-4 bg-border/60 rounded mt-1 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Invoices"
            value={summary?.totalInvoices ?? 0}
            icon={FileText}
            color="text-accent"
            bgColor="bg-accent/10"
          />
          <StatCard
            label="Processing"
            value={summary?.pendingCount ?? 0}
            icon={Clock}
            color="text-yellow-400"
            bgColor="bg-yellow-500/10"
            sub="In pipeline"
          />
          <StatCard
            label="Approved"
            value={summary?.approvedCount ?? 0}
            icon={CheckCircle}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
            sub={formatCurrency(summary?.approvedAmount ?? 0)}
          />
          <StatCard
            label="Failed"
            value={summary?.failedCount ?? 0}
            icon={XCircle}
            color="text-red-400"
            bgColor="bg-red-500/10"
          />
          <StatCard
            label="Human Review"
            value={
              data?.statusBreakdown?.find((statusEntry) => statusEntry.status === 'Human Review')?.count ?? 0
            }
            icon={AlertCircle}
            color="text-orange-400"
            bgColor="bg-orange-500/10"
            sub="Needs attention"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Status Distribution</h3>
          {isLoading ? (
            <div className="h-[280px] bg-border/20 rounded-xl animate-pulse" />
          ) : data?.statusBreakdown?.length ? (
            <StatusPieChart data={data.statusBreakdown} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted text-sm">
              No data yet. Upload some invoices!
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Invoice Per Day / Month</h3>
          {isLoading ? (
            <div className="h-[280px] bg-border/20 rounded-xl animate-pulse" />
          ) : data?.monthlyChart?.length ? (
            <InvoiceBarChart data={data.monthlyChart} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted text-sm">
              No monthly data available
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Count */}
        <div className="glass-card p-6 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Users size={28} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{summary?.totalVendors ?? 0}</p>
          <p className="text-muted text-sm">Total Vendors</p>
          <div className="w-full bg-border rounded-full h-1.5 mt-2">
            <div className="h-1.5 bg-emerald-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Avg Processing Time */}
        <div className="glass-card p-6 flex flex-col items-center justify-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
            <TrendingUp size={28} className="text-accent" />
          </div>
          <p className="text-3xl font-bold text-white">22 sec</p>
          <p className="text-muted text-sm">Avg Processing Time</p>
          <p className="text-xs text-muted/60">End-to-end AI pipeline</p>
        </div>

        {/* Approval Rate */}
        <div className="glass-card p-6 flex flex-col justify-center gap-3">
          <h3 className="text-sm font-semibold text-muted">Approval Rate</h3>
          {(() => {
            const total = (summary?.approvedCount ?? 0) + (summary?.failedCount ?? 0);
            const rate = total > 0 ? Math.round(((summary?.approvedCount ?? 0) / total) * 100) : 0;
            return (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white">{rate}%</span>
                  <span className="text-muted text-sm mb-1">of processed</span>
                </div>
                <div className="w-full bg-border rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-accent to-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>✓ {summary?.approvedCount ?? 0} approved</span>
                  <span>✗ {summary?.failedCount ?? 0} failed</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4">Recent Invoices</h3>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-border/20 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !data?.recentInvoices?.length ? (
          <p className="text-muted text-sm text-center py-8">No invoices uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wide">
                  <th className="text-left pb-3 font-medium">Invoice No</th>
                  <th className="text-left pb-3 font-medium">Vendor</th>
                  <th className="text-right pb-3 font-medium">Amount</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentInvoices.map((invoiceRow) => {
                  const statusStyle = STATUS_CONFIG[invoiceRow.status];
                  return (
                    <tr key={invoiceRow._id} className="table-row">
                      <td className="py-3 font-mono text-white text-xs">{invoiceRow.invoiceNumber}</td>
                      <td className="py-3 text-muted">{(invoiceRow.vendor as any)?.vendorName ?? '—'}</td>
                      <td className="py-3 text-right font-medium text-white">
                        {formatCurrency(invoiceRow.amount, invoiceRow.currency)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={cn('badge', statusStyle.bg, statusStyle.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', statusStyle.dot)} />
                          {invoiceRow.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-muted text-xs">{formatDate(invoiceRow.uploadedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
