import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Building2, CheckCircle, XCircle,
  Eye, AlertTriangle, Mail, Phone, Globe, Hash, FileText, Calendar, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { vendorService } from '../services/vendorService';
import { formatDate, exportToCSV } from '../utils';
import { cn } from '../lib/utils';
import type { Vendor } from '../types';
import { CustomDropdown } from '../components/ui/CustomDropdown';
import { useSettingsStore } from '../store/useSettingsStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'United Arab Emirates',
  'Singapore', 'Australia', 'Canada', 'Germany', 'France', 'Japan',
  'China', 'Brazil', 'South Africa', 'Saudi Arabia', 'Netherlands',
];

// ── Validation ────────────────────────────────────────────────────────────────

interface VendorFormData {
  vendorName: string;
  vendorCode: string;
  gstNumber:  string;
  panNumber:  string;
  email:      string;
  phone:      string;
  country:    string;
  status:     'Active' | 'Inactive' | 'Pending';
}

type FormErrors = Partial<Record<keyof VendorFormData, string>>;

const EMPTY_FORM: VendorFormData = {
  vendorName: '',
  vendorCode: '',
  gstNumber:  '',
  panNumber:  '',
  email:      '',
  phone:      '',
  country:    'India',
  status:     'Active',
};

function validateForm(data: VendorFormData): FormErrors {
  const errors: FormErrors = {};

  /* Vendor Name */
  if (!data.vendorName.trim()) {
    errors.vendorName = 'Vendor name is required.';
  } else if (data.vendorName.trim().length < 2) {
    errors.vendorName = 'Vendor name must be at least 2 characters.';
  } else if (data.vendorName.trim().length > 100) {
    errors.vendorName = 'Vendor name must not exceed 100 characters.';
  }

  /* Vendor Code */
  if (!data.vendorCode.trim()) {
    errors.vendorCode = 'Vendor code is required.';
  } else if (!/^[A-Z0-9_-]{2,20}$/i.test(data.vendorCode.trim())) {
    errors.vendorCode = 'Code must be 2–20 alphanumeric characters (A-Z, 0-9, -, _).';
  }

  /* Email */
  if (!data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  /* GST Number (optional but validated if provided) */
  if (data.gstNumber.trim() && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(data.gstNumber.trim())) {
    errors.gstNumber = 'GST must follow format: 22AAAAA0000A1Z5';
  }

  /* PAN Number (optional but validated if provided) */
  if (data.panNumber.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(data.panNumber.trim())) {
    errors.panNumber = 'PAN must follow format: AAAAA0000A';
  }

  /* Phone (optional but validated if provided) */
  if (data.phone.trim() && !/^[+\d\s\-().]{7,20}$/.test(data.phone.trim())) {
    errors.phone = 'Enter a valid phone number (7–20 digits).';
  }

  /* Country */
  if (!data.country) {
    errors.country = 'Please select a country.';
  }

  return errors;
}

// ── Field Error Message ───────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
      <AlertTriangle size={10} className="shrink-0" />
      {message}
    </p>
  );
}

// ── Vendor Form Modal ─────────────────────────────────────────────────────────

interface VendorFormModalProps {
  existingVendor?: Vendor | null;
  onClose: () => void;
  onSaved: () => void;
}

function VendorFormModal({ existingVendor, onClose, onSaved }: VendorFormModalProps) {
  const isEdit = !!existingVendor;
  const [formData, setFormData] = useState<VendorFormData>(
    existingVendor
      ? {
          vendorName: existingVendor.vendorName,
          vendorCode: existingVendor.vendorCode,
          gstNumber:  existingVendor.gstNumber ?? '',
          panNumber:  existingVendor.panNumber  ?? '',
          email:      existingVendor.email,
          phone:      existingVendor.phone      ?? '',
          country:    existingVendor.country    ?? 'India',
          status:     existingVendor.status,
        }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof VendorFormData, boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const set = (field: keyof VendorFormData, val: string) => {
    setFormData((p) => ({ ...p, [field]: val }));
    /* Clear error as user types */
    if (errors[field]) setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const blur = (field: keyof VendorFormData) => {
    setTouched((p) => ({ ...p, [field]: true }));
    const errs = validateForm({ ...formData });
    setErrors((p) => ({ ...p, [field]: errs[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(formData);
    setErrors(errs);
    /* Mark all fields as touched */
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }
    setIsSaving(true);
    try {
      if (isEdit && existingVendor) {
        await vendorService.update(existingVendor._id, formData);
        toast.success('Vendor updated successfully!');
      } else {
        await vendorService.create(formData as any);
        toast.success('Vendor created successfully!');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save vendor.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (field: keyof VendorFormData) =>
    cn('input-field', touched[field] && errors[field] && 'border-red-500/70 focus:border-red-500');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-2xl p-6 animate-slide-in max-h-[92vh] overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
              <Building2 size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isEdit ? 'Edit Vendor' : 'Add New Vendor'}
              </h3>
              <p className="text-xs text-muted">
                {isEdit ? 'Update vendor information below.' : 'Fill in all required fields to register a new vendor.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* Row 1: Name + Code */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">
                Vendor Name <span className="text-accent">*</span>
              </label>
              <input
                className={inputClass('vendorName')}
                placeholder="Acme Corporation"
                value={formData.vendorName}
                onChange={(e) => set('vendorName', e.target.value)}
                onBlur={() => blur('vendorName')}
              />
              <FieldError message={touched.vendorName ? errors.vendorName : undefined} />
            </div>
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">
                Vendor Code <span className="text-accent">*</span>
              </label>
              <input
                className={inputClass('vendorCode')}
                placeholder="ACME001"
                value={formData.vendorCode}
                onChange={(e) => set('vendorCode', e.target.value.toUpperCase())}
                onBlur={() => blur('vendorCode')}
              />
              <FieldError message={touched.vendorCode ? errors.vendorCode : undefined} />
            </div>
          </div>

          {/* Row 2: Email (full width) */}
          <div>
            <label className="text-xs text-muted font-medium mb-1.5 block">
              Email Address <span className="text-accent">*</span>
            </label>
            <input
              type="email"
              className={inputClass('email')}
              placeholder="billing@vendor.com"
              value={formData.email}
              onChange={(e) => set('email', e.target.value)}
              onBlur={() => blur('email')}
            />
            <FieldError message={touched.email ? errors.email : undefined} />
          </div>

          {/* Row 3: GST + PAN */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">
                GST Number
                <span className="ml-1.5 text-[10px] text-muted/60 font-normal">(optional)</span>
              </label>
              <input
                className={inputClass('gstNumber')}
                placeholder="22AAAAA0000A1Z5"
                value={formData.gstNumber}
                onChange={(e) => set('gstNumber', e.target.value.toUpperCase())}
                onBlur={() => blur('gstNumber')}
                maxLength={15}
              />
              <FieldError message={touched.gstNumber ? errors.gstNumber : undefined} />
            </div>
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">
                PAN Number
                <span className="ml-1.5 text-[10px] text-muted/60 font-normal">(optional)</span>
              </label>
              <input
                className={inputClass('panNumber')}
                placeholder="AAAAA0000A"
                value={formData.panNumber}
                onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                onBlur={() => blur('panNumber')}
                maxLength={10}
              />
              <FieldError message={touched.panNumber ? errors.panNumber : undefined} />
            </div>
          </div>

          {/* Row 4: Phone + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">
                Phone
                <span className="ml-1.5 text-[10px] text-muted/60 font-normal">(optional)</span>
              </label>
              <input
                className={inputClass('phone')}
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => set('phone', e.target.value)}
                onBlur={() => blur('phone')}
              />
              <FieldError message={touched.phone ? errors.phone : undefined} />
            </div>
            <div>
              <label className="text-xs text-muted font-medium mb-1.5 block">
                Country <span className="text-accent">*</span>
              </label>
              <CustomDropdown
                value={formData.country}
                onChange={(v) => { set('country', v); blur('country'); }}
                placeholder="Select country"
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              />
              <FieldError message={touched.country ? errors.country : undefined} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs text-muted font-medium mb-2 block">Status</label>
            <div className="flex gap-3">
              {(['Active', 'Inactive', 'Pending'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 flex items-center justify-center gap-2',
                    formData.status === s
                      ? s === 'Active'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : s === 'Inactive'
                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                        : 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                      : 'bg-surface border-border text-muted hover:border-accent/30',
                  )}
                >
                  {s === 'Active' ? <CheckCircle size={14} /> : s === 'Inactive' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Validation summary if multiple errors */}
          {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/25 rounded-xl">
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-400">
                  {Object.keys(errors).length} validation error{Object.keys(errors).length > 1 ? 's' : ''} — please review the fields above.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSaving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : isEdit ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── View Vendor Modal ─────────────────────────────────────────────────────────

function VendorViewModal({ vendor, onClose, onEdit }: { vendor: Vendor; onClose: () => void; onEdit: () => void }) {
  const statusColor = vendor.status === 'Active'
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : vendor.status === 'Inactive'
    ? 'text-red-400 bg-red-500/10 border-red-500/20'
    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';

  const rows = [
    { icon: Building2,  label: 'Vendor Name',  value: vendor.vendorName },
    { icon: Hash,       label: 'Vendor Code',  value: vendor.vendorCode },
    { icon: Mail,       label: 'Email',        value: vendor.email },
    { icon: FileText,   label: 'GST Number',   value: vendor.gstNumber || '—' },
    { icon: FileText,   label: 'PAN Number',   value: vendor.panNumber || '—' },
    { icon: Phone,      label: 'Phone',        value: vendor.phone || '—' },
    { icon: Globe,      label: 'Country',      value: vendor.country || '—' },
    { icon: Calendar,   label: 'Registered',   value: formatDate(vendor.createdAt) },
    { icon: Calendar,   label: 'Last Updated', value: formatDate(vendor.updatedAt) },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-md p-6 animate-slide-in max-h-[92vh] overflow-y-auto no-scrollbar">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
              <Building2 size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{vendor.vendorName}</h3>
              <code className="text-xs text-accent font-mono">{vendor.vendorCode}</code>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Status badge */}
        <div className="mb-5">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border', statusColor)}>
            {vendor.status === 'Active'
              ? <CheckCircle size={12} />
              : vendor.status === 'Inactive'
              ? <XCircle size={12} />
              : <AlertTriangle size={12} />}
            {vendor.status}
          </span>
        </div>

        {/* Detail rows */}
        <div className="space-y-2.5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-2 text-muted">
                <Icon size={13} />
                <span className="text-xs">{label}</span>
              </div>
              <span className="text-xs text-white font-medium text-right max-w-[55%] truncate">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost flex-1">Close</button>
          <button
            onClick={() => { onClose(); onEdit(); }}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Edit2 size={14} />
            Edit Vendor
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ vendor, onCancel, onConfirm, isDeleting }: {
  vendor: Vendor;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card w-full max-w-sm p-6 animate-slide-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
            <AlertTriangle size={26} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Delete Vendor?</h3>
            <p className="text-sm text-muted mt-1">
              You are about to permanently delete{' '}
              <span className="text-white font-semibold">"{vendor.vendorName}"</span>.
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2 px-4 rounded-xl text-sm font-medium bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            {isDeleting
              ? <><span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> Deleting…</>
              : <><Trash2 size={14} /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Vendors Page ─────────────────────────────────────────────────────────

export default function Vendors() {
  const queryClient = useQueryClient();
  const { compactTableView } = useSettingsStore();

  const [searchText, setSearchText]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [sortField, setSortField]         = useState('vendorName');
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('asc');

  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [editVendor, setEditVendor]       = useState<Vendor | null>(null);
  const [viewVendor, setViewVendor]       = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Vendor | null>(null);

  const { data: vendorPageData, isLoading } = useQuery({
    queryKey: ['vendors', searchText, statusFilter, currentPage, sortField, sortDir],
    queryFn: () =>
      vendorService.getAll({
        search: searchText,
        status: statusFilter,
        page:   currentPage,
        limit:  12,
        sort:   sortField,
        order:  sortDir,
      }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.delete(id),
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
  };

  const openAdd = () => { setEditVendor(null); setIsFormOpen(true); };
  const openEdit = (v: Vendor) => { setEditVendor(v); setIsFormOpen(true); };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleExportCSV = () => {
    if (!vendorPageData?.data || vendorPageData.data.length === 0) {
      toast.error('No vendors to export');
      return;
    }
    exportToCSV(vendorPageData.data, 'vendors.csv', [
      { key: 'vendorName', label: 'Vendor Name' },
      { key: 'vendorCode', label: 'Vendor Code' },
      { key: 'email', label: 'Email' },
      { key: 'gstNumber', label: 'GST Number' },
      { key: 'panNumber', label: 'PAN Number' },
      { key: 'phone', label: 'Phone' },
      { key: 'country', label: 'Country' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created At' },
    ]);
    toast.success('Vendors exported successfully.');
  };

  const SortIcon = ({ field }: { field: string }) => (
    <span className="inline-flex flex-col ml-1 opacity-40">
      <ChevronUp   size={10} className={cn(sortField === field && sortDir === 'asc'  && 'opacity-100 text-accent')} />
      <ChevronDown size={10} className={cn('-mt-1', sortField === field && sortDir === 'desc' && 'opacity-100 text-accent')} />
    </span>
  );

  const pagination = vendorPageData?.pagination;
  const hasFilters = !!(searchText || statusFilter);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Vendor Management</h2>
          <p className="text-muted text-sm mt-0.5">
            {pagination?.total ?? 0} vendor{pagination?.total !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center justify-center p-2.5 sm:px-4 sm:py-2 gap-2 shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Vendor</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 flex-1 min-w-[220px]">
          <Search size={14} className="text-muted shrink-0" />
          <input
            className="bg-transparent outline-none text-sm text-white placeholder-muted w-full"
            placeholder="Search by name, code, or email…"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} className="text-muted hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        <CustomDropdown
          className="w-auto min-w-[150px]"
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
          placeholder="All Statuses"
          options={[
            { value: '',         label: 'All Statuses' },
            { value: 'Active',   label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Pending',  label: 'Pending' },
          ]}
        />

        {hasFilters && (
          <button
            onClick={() => { setSearchText(''); setStatusFilter(''); setCurrentPage(1); }}
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
        <span className="text-muted text-xs">
          {pagination?.total ?? 0} result{(pagination?.total ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted text-xs uppercase tracking-wide">
                {[
                  { label: 'Vendor',  field: 'vendorName', className: '' },
                  { label: 'Code',    field: 'vendorCode', className: '' },
                  { label: 'Email',   field: 'email',      className: 'hidden lg:table-cell' },
                  { label: 'GST No.', field: 'gstNumber',  className: 'hidden xl:table-cell' },
                  { label: 'PAN No.', field: 'panNumber',  className: 'hidden xl:table-cell' },
                  { label: 'Phone',   field: 'phone',      className: 'hidden lg:table-cell' },
                  { label: 'Country', field: 'country',    className: 'hidden md:table-cell' },
                  { label: 'Status',  field: 'status',     className: '' },
                  { label: 'Added',   field: 'createdAt',  className: 'hidden md:table-cell' },
                ].map(({ label, field, className }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={cn("text-left px-4 py-3.5 font-medium cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap", className)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{label}</span>
                      <SortIcon field={field} />
                    </div>
                  </th>
                ))}
                <th className="text-center px-4 py-3.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 bg-border/30 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !vendorPageData?.data?.length ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-muted text-sm">
                    <Building2 size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No vendors found</p>
                    {hasFilters
                      ? <p className="text-xs mt-1">Try clearing your filters.</p>
                      : <button onClick={openAdd} className="text-accent hover:underline text-xs mt-1">Add your first vendor?</button>
                    }
                  </td>
                </tr>
              ) : (
                vendorPageData.data.map((v) => {
                  const cellPadding = compactTableView ? 'py-1.5' : 'py-3.5';
                  return (
                    <tr key={v._id} className="table-row">
                      <td className={cn('px-4 font-medium text-white', cellPadding)}>{v.vendorName}</td>
                      <td className={cn('px-4 font-mono text-accent text-xs font-semibold', cellPadding)}>{v.vendorCode}</td>
                      <td className={cn('px-4 text-muted text-xs hidden lg:table-cell', cellPadding)}>{v.email}</td>
                      <td className={cn('px-4 text-muted text-xs font-mono hidden xl:table-cell', cellPadding)}>{v.gstNumber || '—'}</td>
                      <td className={cn('px-4 text-muted text-xs font-mono hidden xl:table-cell', cellPadding)}>{v.panNumber || '—'}</td>
                      <td className={cn('px-4 text-muted text-xs hidden lg:table-cell', cellPadding)}>{v.phone || '—'}</td>
                      <td className={cn('px-4 text-muted text-xs hidden md:table-cell', cellPadding)}>{v.country || '—'}</td>
                      <td className={cn('px-4', cellPadding)}>
                        <span className={cn(
                          'badge text-xs',
                          v.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : v.status === 'Inactive'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400',
                        )}>
                          {v.status === 'Active'
                            ? <CheckCircle size={10} className="mr-1" />
                            : v.status === 'Inactive'
                            ? <XCircle size={10} className="mr-1" />
                            : <AlertTriangle size={10} className="mr-1" />}
                          {v.status}
                        </span>
                      </td>
                      <td className={cn('px-4 text-muted text-xs hidden md:table-cell', cellPadding)}>{formatDate(v.createdAt)}</td>
                      <td className={cn('px-4', cellPadding)}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewVendor(v)}
                            className="p-1.5 text-muted hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(v)}
                            className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Edit vendor"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(v)}
                            className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete vendor"
                          >
                            <Trash2 size={15} />
                          </button>
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
              Page {pagination.page} of {pagination.pages} · {pagination.total} vendors
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-muted hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={cn(
                    'w-7 h-7 rounded-lg text-xs font-medium transition-colors',
                    n === currentPage ? 'bg-accent text-white' : 'text-muted hover:text-white hover:bg-white/5',
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={currentPage === pagination.pages}
                className="p-1.5 text-muted hover:text-white hover:bg-white/5 rounded-lg disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {isFormOpen && (
        <VendorFormModal
          existingVendor={editVendor}
          onClose={() => setIsFormOpen(false)}
          onSaved={invalidateAll}
        />
      )}
      {viewVendor && (
        <VendorViewModal
          vendor={viewVendor}
          onClose={() => setViewVendor(null)}
          onEdit={() => openEdit(viewVendor)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          vendor={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
