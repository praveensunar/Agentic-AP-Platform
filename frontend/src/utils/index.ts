import type { InvoiceStatus } from '../types';

export const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string; dot: string }> = {
  Uploaded:             { label: 'Uploaded',             color: 'text-blue-400',   bg: 'bg-blue-500/10',   dot: 'bg-blue-400' },
  Processing:           { label: 'Processing',           color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' },
  'OCR Complete':       { label: 'OCR Complete',         color: 'text-purple-400', bg: 'bg-purple-500/10', dot: 'bg-purple-400' },
  'PII Masked':         { label: 'PII Masked',           color: 'text-pink-400',   bg: 'bg-pink-500/10',   dot: 'bg-pink-400' },
  'Extraction Complete':{ label: 'Extraction Complete',  color: 'text-indigo-400', bg: 'bg-indigo-500/10', dot: 'bg-indigo-400' },
  'Validation Complete':{ label: 'Validation Complete',  color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   dot: 'bg-cyan-400' },
  'Human Review':       { label: 'Human Review',         color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' },
  Approved:             { label: 'Approved',             color: 'text-emerald-400',bg: 'bg-emerald-500/10',dot: 'bg-emerald-400' },
  Failed:               { label: 'Failed',               color: 'text-red-400',    bg: 'bg-red-500/10',    dot: 'bg-red-400' },
};

export function formatCurrency(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatRelativeTime(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export const PROCESSING_STEPS: InvoiceStatus[] = [
  'Uploaded',
  'Processing',
  'OCR Complete',
  'PII Masked',
  'Extraction Complete',
  'Validation Complete',
  'Human Review',
  'Approved',
];

export function getStepIndex(status: InvoiceStatus) {
  if (status === 'Failed') return -1;
  return PROCESSING_STEPS.indexOf(status);
}

export interface CSVHeader {
  key: string;
  label: string;
}

export function exportToCSV(data: any[], filename: string, headers: CSVHeader[]) {
  const csvRows: string[] = [];
  
  // Header row
  csvRows.push(headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(h => {
      // Handles nested keys like "vendor.vendorName"
      const val = h.key.split('.').reduce((obj, key) => obj?.[key], row);
      const strVal = val === null || val === undefined ? '' : String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // Create Blob and trigger download
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
