import { useQuery } from '@tanstack/react-query';
import { Users, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { formatCurrency } from '../utils';
import { cn } from '../lib/utils';
import VendorInvoiceChart from '../components/charts/VendorInvoiceChart';
import CountryVendorChart from '../components/charts/CountryVendorChart';
import MonthlyVendorChart from '../components/charts/MonthlyVendorChart';
import type { VendorStat } from '../types';

// ── Summary Card Component ────────────────────────────────────────────────────

interface SummaryCardProps {
  cardLabel: string;
  cardValue: string | number;
  cardIcon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
}

function SummaryCard({ cardLabel, cardValue, cardIcon: IconComponent, iconColor, iconBgColor }: SummaryCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBgColor)}>
        <IconComponent size={20} className={iconColor} />
      </div>
      <p className="text-2xl font-bold text-white mt-2">{cardValue}</p>
      <p className="text-sm text-muted">{cardLabel}</p>
    </div>
  );
}

export default function VendorDashboard() {
  const { data: dashboardData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-dashboard'],
    queryFn: () =>
      dashboardService.getVendorDashboard().then((apiResponse) => apiResponse.data.data),
    refetchInterval: 30000,
  });

  const summary = dashboardData?.summary;
  const countryDistribution = dashboardData?.countryDistribution || [];
  const monthlyCreation = dashboardData?.monthlyCreation || [];
  const performance = dashboardData?.performance || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Vendor Dashboard</h2>
          <p className="text-muted text-sm mt-0.5">Analytics and insights across all vendors</p>
        </div>
        <button
          onClick={() => refetch()}
          className={cn('btn-ghost flex items-center gap-2 text-sm', isRefetching && 'opacity-60')}
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Cards Row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, cardIndex) => (
            <div key={cardIndex} className="stat-card animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-border" />
              <div className="h-8 bg-border rounded mt-2" />
              <div className="h-4 bg-border/60 rounded mt-1 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            cardLabel="Total Vendors"
            cardValue={summary?.totalVendors ?? 0}
            cardIcon={Users}
            iconColor="text-accent"
            iconBgColor="bg-accent/10"
          />
          <SummaryCard
            cardLabel="Active Vendors"
            cardValue={summary?.activeVendors ?? 0}
            cardIcon={CheckCircle}
            iconColor="text-emerald-400"
            iconBgColor="bg-emerald-500/10"
          />
          <SummaryCard
            cardLabel="Inactive Vendors"
            cardValue={summary?.inactiveVendors ?? 0}
            cardIcon={XCircle}
            iconColor="text-red-400"
            iconBgColor="bg-red-500/10"
          />
          <SummaryCard
            cardLabel="Pending Vendors"
            cardValue={summary?.pendingVendors ?? 0}
            cardIcon={Clock}
            iconColor="text-yellow-400"
            iconBgColor="bg-yellow-500/10"
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Top Vendors by Invoice Count</h3>
          {isLoading ? (
            <div className="h-[280px] bg-border/20 rounded-xl animate-pulse" />
          ) : performance.length ? (
            <VendorInvoiceChart data={performance} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted text-sm">
              No vendor data available
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Country-wise Distribution</h3>
          {isLoading ? (
            <div className="h-[280px] bg-border/20 rounded-xl animate-pulse" />
          ) : countryDistribution.length ? (
            <CountryVendorChart data={countryDistribution} />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted text-sm">
              No country data available
            </div>
          )}
        </div>
      </div>

      {/* Monthly Creation Chart */}
      <div className="glass-card p-6">
        <h3 className="section-title mb-4">Monthly Vendor Registration</h3>
        {isLoading ? (
          <div className="h-[280px] bg-border/20 rounded-xl animate-pulse" />
        ) : monthlyCreation.length ? (
          <MonthlyVendorChart data={monthlyCreation} />
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted text-sm">
            No registration history available
          </div>
        )}
      </div>

      {/* Vendor Stats Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="section-title">Vendor Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3.5 font-medium">Vendor</th>
                <th className="text-right px-4 py-3.5 font-medium">Invoices</th>
                <th className="text-right px-4 py-3.5 font-medium">Total Amount</th>
                <th className="text-right px-4 py-3.5 font-medium">Approved</th>
                <th className="text-right px-4 py-3.5 font-medium">Failed</th>
                <th className="text-center px-4 py-3.5 font-medium">Approval Rate</th>
                <th className="text-center px-4 py-3.5 font-medium">Avg Confidence</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/30">
                    {Array.from({ length: 7 }).map((_, colIndex) => (
                      <td key={colIndex} className="px-4 py-3.5">
                        <div className="h-4 bg-border/30 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !performance.length ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-12 text-sm">
                    No vendor statistics available yet.
                  </td>
                </tr>
              ) : (
                performance.map((vendorStat: VendorStat) => {
                  const approvalRateColor =
                    vendorStat.approvalRate >= 80 ? 'text-emerald-400' :
                      vendorStat.approvalRate >= 60 ? 'text-yellow-400' :
                        'text-red-400';

                  return (
                    <tr key={vendorStat._id} className="table-row">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-white font-medium">{vendorStat.vendorName}</p>
                          <p className="text-muted text-xs font-mono">{vendorStat.vendorCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-white">
                        {vendorStat.invoiceCount}
                      </td>
                      <td className="px-4 py-3.5 text-right text-white">
                        {formatCurrency(vendorStat.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-emerald-400 font-medium">
                        {vendorStat.approvedCount}
                      </td>
                      <td className="px-4 py-3.5 text-right text-red-400 font-medium">
                        {vendorStat.failedCount}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn('font-semibold', approvalRateColor)}>
                            {vendorStat.approvalRate}%
                          </span>
                          <div className="w-16 bg-border rounded-full h-1">
                            <div
                              className={cn('h-1 rounded-full transition-all duration-700',
                                vendorStat.approvalRate >= 80 ? 'bg-emerald-500' :
                                  vendorStat.approvalRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              )}
                              style={{ width: `${vendorStat.approvalRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {vendorStat.avgConfidenceScore != null ? (
                          <span className={cn('font-semibold',
                            vendorStat.avgConfidenceScore >= 80 ? 'text-emerald-400' :
                              vendorStat.avgConfidenceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {vendorStat.avgConfidenceScore}%
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
