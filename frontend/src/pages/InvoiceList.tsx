import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, Eye, Edit2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceService } from '../services/invoiceService';
import { vendorService } from '../services/vendorService';
import { formatCurrency, formatDate, STATUS_CONFIG, exportToCSV } from '../utils';
import { cn } from '../lib/utils';
import type { Invoice, InvoiceStatus } from '../types';
import { CustomDropdown } from '../components/ui/CustomDropdown';
import { useAuthStore } from '../store/useAuthStore';

const STATUSES: InvoiceStatus[] = [
  'Uploaded', 'Processing', 'OCR Complete', 'PII Masked', 'Extraction Complete',
  'Validation Complete', 'Human Review', 'Approved', 'Failed',
];

function InvoiceDetailModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const cfg = STATUS_CONFIG[invoice.status];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-lg p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Invoice Details</h3>
          <button onClick={onClose} className="text-muted hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          {[
            ['Invoice No', invoice.invoiceNumber],
            ['Vendor', (invoice.vendor as any)?.vendorName ?? '—'],
            ['Amount', formatCurrency(invoice.amount, invoice.currency)],
            ['Currency', invoice.currency],
            ['File', invoice.fileName],
            ['Uploaded', formatDate(invoice.uploadedAt)],
            ['Confidence', invoice.confidenceScore != null ? `${invoice.confidenceScore}%` : '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm border-b border-border/40 pb-2">
              <span className="text-muted">{label}</span>
              <span className="text-white font-medium font-mono text-right">{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-1">
            <span className="text-muted">Status</span>
            <span className={cn('badge', cfg.bg, cfg.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', cfg.dot)} />
              {invoice.status}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost w-full mt-5 text-center justify-center">Close</button>
      </div>
    </div>
  );
}

interface InvoiceEditModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSaved: () => void;
  vendors: any[];
}

function InvoiceEditModal({ invoice, onClose, onSaved, vendors }: InvoiceEditModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoiceNumber);
  const [amount, setAmount] = useState(invoice.amount.toString());
  const [currency, setCurrency] = useState(invoice.currency);
  const [vendorId, setVendorId] = useState((invoice.vendor as any)?._id || invoice.vendor || '');
  const [status, setStatus] = useState<InvoiceStatus>(invoice.status);
  const [confidence, setConfidence] = useState(invoice.confidenceScore != null ? invoice.confidenceScore.toString() : '');
  const [isSaving, setIsSaving] = useState(false);


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return toast.error('Invoice number is required');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Enter a valid positive amount');
    
    const confidenceVal = confidence.trim() === '' ? null : parseInt(confidence);
    if (confidenceVal !== null && (isNaN(confidenceVal) || confidenceVal < 0 || confidenceVal > 100)) {
      return toast.error('Confidence score must be between 0 and 100');
    }

    setIsSaving(true);
    try {
      await invoiceService.update(invoice._id, {
        invoiceNumber,
        amount: parseFloat(amount),
        currency,
        vendor: vendorId || null,
        status,
        confidenceScore: confidenceVal,
      });
      toast.success('Invoice updated successfully!');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-lg p-6 animate-slide-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Edit Invoice</h3>
          <button onClick={onClose} className="text-muted hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-muted font-medium mb-1.5 block">Invoice Number *</label>
            <input
              className="input-field"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">Amount *</label>
              <div className="relative">
                <input
                  type="number"
                  className="input-field pr-16"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <CustomDropdown
                  inline
                  className="absolute right-0 top-0 h-full"
                  value={currency}
                  onChange={setCurrency}
                  options={['INR', 'USD', 'EUR', 'GBP', 'AED'].map((c) => ({ value: c, label: c }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">Confidence Score (%)</label>
              <input
                type="number"
                className="input-field"
                placeholder="—"
                value={confidence}
                onChange={(e) => setConfidence(e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted font-medium mb-1.5 block">Vendor</label>
            <CustomDropdown
              value={vendorId}
              onChange={setVendorId}
              placeholder="— Select vendor —"
              options={[
                { value: '', label: '— Select vendor —' },
                ...vendors.map((v) => ({ value: v._id, label: `${v.vendorName} (${v.vendorCode})` })),
              ]}
            />
          </div>

          <div>
            <label className="text-xs text-muted font-medium mb-1.5 block">Status *</label>
            <CustomDropdown
              value={status}
              onChange={(val) => setStatus(val as InvoiceStatus)}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InvoiceList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState('uploadedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['invoices', search, statusFilter, vendorFilter, page, sortField, sortDir],
    queryFn: () =>
      invoiceService.getAll({
        search,
        status: statusFilter,
        vendor: vendorFilter,
        page,
        limit: 15,
        sort: sortDir === 'desc' ? `-${sortField}` : sortField,
      }).then((apiResponse) => apiResponse.data),
    refetchInterval: 8000,
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Invoices list refreshed!');
    } catch {
      toast.error('Failed to refresh invoices.');
    }
  };

  const { data: vendorsRes } = useQuery({
    queryKey: ['vendors-select'],
    queryFn: () => vendorService.getAll({ limit: 100 }).then((apiResponse) => apiResponse.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoiceService.delete(id),
    onSuccess: () => {
      toast.success('Invoice deleted');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleExportCSV = () => {
    if (!data?.data || data.data.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    exportToCSV(data.data, 'invoices.csv', [
      { key: 'invoiceNumber', label: 'Invoice Number' },
      { key: 'vendor.vendorName', label: 'Vendor Name' },
      { key: 'vendor.vendorCode', label: 'Vendor Code' },
      { key: 'amount', label: 'Amount' },
      { key: 'currency', label: 'Currency' },
      { key: 'status', label: 'Status' },
      { key: 'confidenceScore', label: 'Confidence Score (%)' },
      { key: 'uploadedAt', label: 'Upload Date' },
    ]);
    toast.success('Invoices exported successfully.');
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="inline-flex flex-col ml-1 opacity-40">
      <ChevronUp size={10} className={cn(sortField === field && sortDir === 'asc' && 'opacity-100 text-accent')} />
      <ChevronDown size={10} className={cn('-mt-1', sortField === field && sortDir === 'desc' && 'opacity-100 text-accent')} />
    </span>
  );

  const pagination = data?.pagination;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Invoice Catalog</h2>
          <p className="text-muted text-sm mt-0.5">Manage and track accounts payable pipeline</p>
        </div>
        <button
          onClick={handleRefresh}
          className={cn('btn-ghost flex items-center gap-2 text-sm', isRefetching && 'opacity-60')}
          title="Refresh latest data"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-muted shrink-0" />
          <input
            className="bg-transparent outline-none text-sm text-white placeholder-muted w-full"
            placeholder="Search invoice number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <CustomDropdown
          className="w-auto min-w-[160px]"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          placeholder="All Statuses"
          options={[
            { value: '', label: 'All Statuses' },
            ...STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />
        <CustomDropdown
          className="w-auto min-w-[160px]"
          value={vendorFilter}
          onChange={(v) => { setVendorFilter(v); setPage(1); }}
          placeholder="All Vendors"
          options={[
            { value: '', label: 'All Vendors' },
            ...(vendorsRes?.data?.map((v) => ({ value: v._id, label: v.vendorName })) ?? []),
          ]}
        />
        {(search || statusFilter || vendorFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setVendorFilter(''); setPage(1); }}
            className="btn-ghost text-sm flex items-center gap-1"
          >
            <X size={14} /> Clear
          </button>
        )}
        <button
          onClick={handleExportCSV}
          className="btn-ghost flex items-center gap-1.5 text-xs text-accent hover:bg-accent/10 py-1.5 px-3.5 border border-accent/20 rounded-xl transition-all ml-auto"
        >
          <Download size={13} />
          Export CSV
        </button>
        <span className="text-muted text-sm">{pagination?.total ?? 0} invoices</span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3.5 font-medium cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => toggleSort('invoiceNumber')}>
                  <div className="flex items-center gap-1">
                    <span>Invoice No</span>
                    <SortIcon field="invoiceNumber" />
                  </div>
                </th>
                <th className="text-left px-4 py-3.5 font-medium whitespace-nowrap">Vendor</th>
                <th className="text-right px-4 py-3.5 font-medium cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => toggleSort('amount')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <SortIcon field="amount" />
                  </div>
                </th>
                <th className="text-center px-4 py-3.5 font-medium whitespace-nowrap">Currency</th>
                <th className="text-center px-4 py-3.5 font-medium cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => toggleSort('confidenceScore')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Confidence</span>
                    <SortIcon field="confidenceScore" />
                  </div>
                </th>
                <th className="text-center px-4 py-3.5 font-medium cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => toggleSort('status')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    <SortIcon field="status" />
                  </div>
                </th>
                <th className="text-right px-4 py-3.5 font-medium cursor-pointer hover:text-white transition-colors whitespace-nowrap" onClick={() => toggleSort('uploadedAt')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Uploaded</span>
                    <SortIcon field="uploadedAt" />
                  </div>
                </th>
                <th className="text-center px-4 py-3.5 font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-border/30 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-16 text-sm">
                    No invoices found.{' '}
                    <a href="/invoice-upload" className="text-accent hover:underline">Upload one?</a>
                  </td>
                </tr>
              ) : (
                data.data.map((invoiceRow) => {
                  const statusStyle = STATUS_CONFIG[invoiceRow.status];
                  return (
                    <tr key={invoiceRow._id} className="table-row">
                      <td className="px-5 py-3.5 font-mono text-white text-xs font-semibold">{invoiceRow.invoiceNumber}</td>
                      <td className="px-4 py-3.5 text-muted text-sm">
                        {(invoiceRow.vendor as any)?.vendorName ?? <span className="italic opacity-50">No vendor</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-white">
                        {formatCurrency(invoiceRow.amount, invoiceRow.currency)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="badge bg-border/40 text-muted text-xs">{invoiceRow.currency}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {invoiceRow.confidenceScore != null ? (
                          <span className={cn('font-semibold text-sm',
                            invoiceRow.confidenceScore >= 80 ? 'text-emerald-400' :
                            invoiceRow.confidenceScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {invoiceRow.confidenceScore}%
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={cn('badge', statusStyle.bg, statusStyle.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', statusStyle.dot,
                            ['Processing', 'OCR Complete', 'Extraction Complete'].includes(invoiceRow.status) && 'animate-pulse'
                          )} />
                          {invoiceRow.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-muted text-xs">{formatDate(invoiceRow.uploadedAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewInvoice(invoiceRow)}
                            className="p-1.5 text-muted hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          {user?.role === 'Admin' && (
                            <>
                              <button
                                onClick={() => setEditInvoice(invoiceRow)}
                                className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete invoice ${invoiceRow.invoiceNumber}?`)) {
                                    deleteMutation.mutate(invoiceRow._id);
                                  }
                                }}
                                className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <p className="text-muted text-xs">
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-muted hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, pageIndex) => pageIndex + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                    pageNumber === page ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-white/5'
                  )}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="p-1.5 text-muted hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {viewInvoice && <InvoiceDetailModal invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}
      
      {editInvoice && (
        <InvoiceEditModal
          invoice={editInvoice}
          onClose={() => setEditInvoice(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }}
          vendors={vendorsRes?.data ?? []}
        />
      )}
    </div>
  );
}
