import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload, X, CheckCircle, AlertCircle, FileText, Image as ImageIcon,
  Clock, Calendar, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { invoiceService } from '../services/invoiceService';
import { vendorService } from '../services/vendorService';
import { STATUS_CONFIG, PROCESSING_STEPS } from '../utils';
import { cn } from '../lib/utils';
import type { Invoice, InvoiceStatus } from '../types';
import { CustomDropdown } from '../components/ui/CustomDropdown';

type FileState = { file: File; preview: string | null; selectedAt: Date };



// ── File Info Card ────────────────────────────────────────────────────────────
function FileInfoCard({ fileState, onRemove }: { fileState: FileState; onRemove: () => void }) {
  const isPDF = fileState.file.type === 'application/pdf';
  const sizeKb = (fileState.file.size / 1024).toFixed(1);
  const sizeMb = (fileState.file.size / (1024 * 1024)).toFixed(2);
  const ext = fileState.file.type.split('/')[1]?.toUpperCase() ?? 'FILE';
  const selectedTime = fileState.selectedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="border border-accent/30 bg-accent/5 rounded-2xl p-4 flex items-center gap-4">
      {/* Thumbnail / Icon */}
      <div className="shrink-0">
        {fileState.preview ? (
          <img
            src={fileState.preview}
            alt="preview"
            className="w-14 h-14 object-cover rounded-xl border border-border"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            {isPDF
              ? <FileText size={28} className="text-red-400" />
              : <ImageIcon size={28} className="text-blue-400" />}
          </div>
        )}
      </div>

      {/* File metadata */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-white font-semibold text-sm truncate">{fileState.file.name}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Layers size={10} />
            {ext} · {sizeKb} KB ({sizeMb} MB)
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            Selected at {selectedTime}
          </span>
        </div>
        {/* Supported badge */}
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
          <CheckCircle size={9} />
          Supported format
        </span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
        title="Remove file"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ── Processing Step Tracker ───────────────────────────────────────────────────
function StepTracker({ status }: { status: InvoiceStatus }) {
  const currentIdx = status === 'Failed' ? -1 : PROCESSING_STEPS.indexOf(status);
  const isFailed = status === 'Failed';

  return (
    <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-2">
      {PROCESSING_STEPS.map((step, idx) => {
        const done   = currentIdx >= idx && !isFailed;
        const active = currentIdx === idx && !isFailed;
        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-500',
              done && !active && 'bg-emerald-500/20 text-emerald-400',
              active && 'bg-accent/20 text-accent border border-accent/40 shadow-glow-sm',
              !done && !active && !isFailed && 'bg-border/40 text-muted',
              isFailed && 'bg-red-500/10 text-red-400/50',
            )}>
              {done && !active && <CheckCircle size={10} />}
              {active && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
              {!done && !active && <span className="w-2 h-2 rounded-full bg-muted/40" />}
              <span className="hidden sm:inline">{step}</span>
            </div>
            {idx < PROCESSING_STEPS.length - 1 && (
              <div className={cn('w-4 h-px shrink-0', done && !active ? 'bg-emerald-500/40' : 'bg-border')} />
            )}
          </div>
        );
      })}
      {isFailed && (
        <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
          <AlertCircle size={10} />
          Failed
        </div>
      )}
    </div>
  );
}



// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoiceUpload() {
  const queryClient = useQueryClient();
  const [fileState, setFileState]           = useState<FileState | null>(null);
  const [dragging, setDragging]             = useState(false);
  const [vendorId, setVendorId]             = useState('');
  const [invoiceNumber, setInvoiceNumber]   = useState('');
  const [amount, setAmount]                 = useState('');
  const [currency, setCurrency]             = useState('INR');
  const [uploadedInvoice, setUploadedInvoice] = useState<Invoice | null>(null);
  const [uploadTimestamp, setUploadTimestamp] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live status polling
  const { data: liveInvoice } = useQuery({
    queryKey: ['invoice', uploadedInvoice?._id],
    queryFn: () => invoiceService.getById(uploadedInvoice!._id).then((r) => r.data.data),
    enabled: !!uploadedInvoice && !['Approved', 'Failed'].includes(uploadedInvoice.status),
    refetchInterval: 3000,
  });

  const currentStatus = liveInvoice?.status ?? uploadedInvoice?.status;

  const { data: vendorsRes } = useQuery({
    queryKey: ['vendors-select'],
    queryFn: () => vendorService.getAll({ limit: 100, status: 'Active' }).then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      return invoiceService.upload(formData);
    },
    onSuccess: (apiResponse) => {
      const invoice = apiResponse.data.data;
      setUploadedInvoice(invoice);
      setUploadTimestamp(new Date());
      toast.success(`Invoice ${invoice.invoiceNumber} uploaded! Processing started.`);
      
      /* Log the complete API return response to the console */
      console.log('UPLOAD INVOICE API RESPONSE (201 Created):', {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: 'UPLOADED',
        uploadedAt: invoice.uploadedAt ?? new Date().toISOString(),
        fileName: invoice.fileName,
        amount: invoice.amount,
        currency: invoice.currency,
      });

      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });



  const handleFile = (file: File) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, PNG, or JPG files allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB');
      return;
    }
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setFileState({ file, preview, selectedAt: new Date() });
    setUploadedInvoice(null);
    setUploadTimestamp(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileState) return toast.error('Please select a file');
    if (!invoiceNumber.trim()) return toast.error('Invoice number is required');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Valid amount is required');
    if (!vendorId) return toast.error('Vendor is required');



    const fd = new FormData();
    fd.append('file', fileState.file);
    fd.append('invoiceNumber', invoiceNumber);
    fd.append('amount', amount);
    fd.append('currency', currency);
    if (vendorId) fd.append('vendor', vendorId);
    mutation.mutate(fd);
  };

  const reset = () => {
    setFileState(null);
    setUploadedInvoice(null);
    setUploadTimestamp(null);
    setInvoiceNumber('');
    setAmount('');
    setVendorId('');
  };

  const isUploading = mutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Upload Invoice</h2>
          <p className="text-muted text-sm mt-0.5">Supports PDF, PNG, JPG — max 10 MB per file</p>
        </div>
        <div className="flex gap-2">
          {['PDF', 'PNG', 'JPG'].map((ext) => (
            <span key={ext} className="badge bg-border/40 text-muted text-xs px-3 py-1">{ext}</span>
          ))}
        </div>
      </div>

      {/* ── Two column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — Upload form (wider) */}
        <div className="lg:col-span-3 flex flex-col">
          <div className="glass-card p-6 flex-1 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">

              {/* Drop Zone */}
              <div
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onClick={() => !fileState && fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200',
                  !fileState && 'cursor-pointer',
                  dragging
                    ? 'border-accent bg-accent/10 scale-[1.01]'
                    : fileState
                    ? 'border-accent/30 bg-accent/5 cursor-default'
                    : 'border-border hover:border-accent/50 hover:bg-white/[0.02]',
                )}
              >
                {!fileState ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                      'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
                      dragging ? 'bg-accent/30 scale-110' : 'bg-accent/10',
                    )}>
                      <Upload size={28} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Drag &amp; drop your invoice here</p>
                      <p className="text-muted text-sm mt-1">or <span className="text-accent underline underline-offset-2">click to browse files</span></p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {['PDF', 'PNG', 'JPG'].map((ext) => (
                        <span key={ext} className="badge bg-border/40 text-muted px-3 py-1 text-xs">{ext}</span>
                      ))}
                    </div>
                    <p className="text-xs text-muted/60">Maximum file size: 10 MB</p>
                  </div>
                ) : (
                  <FileInfoCard
                    fileState={fileState}
                    onRemove={() => { setFileState(null); }}
                  />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />



              {/* Upload timestamp */}
              {uploadTimestamp && (
                <div className="flex items-center gap-2 text-xs text-muted bg-surface/60 border border-border rounded-xl px-3.5 py-2.5">
                  <Calendar size={12} className="text-accent shrink-0" />
                  <span>
                    Uploaded on{' '}
                    <span className="text-white font-medium">
                      {uploadTimestamp.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>{' '}
                    at{' '}
                    <span className="text-white font-medium font-mono">
                      {uploadTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </span>
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted font-medium mb-1.5 block">
                    Invoice Number <span className="text-accent">*</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="INV-2024-001"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-medium mb-1.5 block">
                    Amount <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="input-field pr-16"
                      placeholder="0.00"
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
              </div>

              <div>
                <label className="text-xs text-muted font-medium mb-1.5 block">Vendor <span className="text-accent">*</span></label>
                <CustomDropdown
                  value={vendorId}
                  onChange={setVendorId}
                  placeholder="— Select vendor —"
                  maxHeight="80px"
                  options={[
                    { value: '', label: '— Select vendor —' },
                    ...(vendorsRes?.data?.map((v) => ({ value: v._id, label: `${v.vendorName} (${v.vendorCode})` })) ?? []),
                  ]}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isUploading || !fileState}
                  className={cn(
                    'btn-primary flex-1 flex items-center justify-center gap-2',
                    (isUploading || !fileState) && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {isUploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Invoice
                    </>
                  )}
                </button>
                {uploadedInvoice && (
                  <button type="button" onClick={reset} className="btn-ghost">
                    New Upload
                  </button>
                )}
              </div>
            </form>
          </div>


        </div>

        {/* Right — Info (combines into a single card of equal height) */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="glass-card p-6 flex-1 flex flex-col justify-between">
            {/* Supported formats info card */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Supported Formats</h3>
              <div className="space-y-2.5">
                {[
                  { ext: 'PDF',  color: 'text-red-400',  bg: 'bg-red-500/10',  border: 'border-red-500/20',  desc: 'Best for scanned & digital invoices' },
                  { ext: 'PNG',  color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', desc: 'High-quality image invoices' },
                  { ext: 'JPG',  color: 'text-amber-400',bg: 'bg-amber-500/10',border: 'border-amber-500/20',desc: 'Compressed photo invoices' },
                ].map(({ ext, color, bg, border, desc }) => (
                  <div key={ext} className={cn('flex items-center gap-3 p-3 rounded-xl border', bg, border)}>
                    <span className={cn('text-xs font-bold font-mono w-8', color)}>{ext}</span>
                    <span className="text-xs text-muted">{desc}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3.5 border-t border-border flex items-center justify-between text-xs text-muted">
                <span>Max file size</span>
                <span className="font-semibold text-white">10 MB</span>
              </div>
            </div>

            {/* Visual Separator */}
            <div className="border-t border-border/40 my-5" />

            {/* How it works */}
            <div className="space-y-3.5 flex-1">
              <h3 className="text-sm font-semibold text-white">How it works</h3>
              <ol className="space-y-3">
                {[
                  { step: '01', text: 'Drop or select your invoice file' },
                  { step: '02', text: 'Fill in invoice number, amount & vendor' },
                  { step: '03', text: 'Click Upload — file goes to the server' },
                  { step: '04', text: 'API responds with invoiceId + UPLOADED status' },
                  { step: '05', text: 'AI pipeline processes & extracts data automatically' },
                ].map(({ step, text }) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="text-[10px] font-bold font-mono text-accent bg-accent/10 border border-accent/20 rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">
                      {step}
                    </span>
                    <span className="text-xs text-muted leading-relaxed">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Status — appears after upload (Full Width) */}
      {uploadedInvoice && currentStatus && (
        <div className="glass-card p-5 animate-slide-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Processing Status</h3>
            <span className={cn(
              'badge text-xs',
              STATUS_CONFIG[currentStatus]?.bg,
              STATUS_CONFIG[currentStatus]?.color,
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block animate-pulse', STATUS_CONFIG[currentStatus]?.dot)} />
              {currentStatus}
            </span>
          </div>

          <p className="text-xs text-muted mb-1">
            Invoice: <span className="text-white font-mono">{uploadedInvoice.invoiceNumber}</span>
          </p>
          <p className="text-xs text-muted">
            File: <span className="text-white">{uploadedInvoice.fileName}</span>
          </p>

          <StepTracker status={currentStatus} />

          {currentStatus === 'Approved' && (
            <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-emerald-400 font-semibold text-sm">Invoice Approved!</p>
                <p className="text-muted text-xs">
                  Confidence: {liveInvoice?.confidenceScore ?? uploadedInvoice.confidenceScore}%
                </p>
              </div>
            </div>
          )}
          {currentStatus === 'Failed' && (
            <div className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <div>
                <p className="text-red-400 font-semibold text-sm">Processing Failed</p>
                <p className="text-muted text-xs">Manual review required</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
