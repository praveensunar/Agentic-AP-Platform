import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inline?: boolean;
  maxHeight?: string;
}

interface PanelPos {
  top: number;
  left: number;
  width: number;
}

function isLightMode() {
  return document.documentElement.classList.contains('light');
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select\u2026',
  className,
  inline = false,
  maxHeight = '180px',
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);

  const computePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPanelPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  const handleOpen = () => {
    computePos();
    setOpen((p) => !p);
  };

  useEffect(() => {
    if (!open) return;
    const onScroll = () => computePos();
    const onResize = () => computePos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, computePos]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        const panel = document.getElementById('custom-dropdown-portal-panel');
        if (panel && panel.contains(target)) return;
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  /* Theme-aware panel */
  const light = isLightMode();

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: panelPos.top,
    left: panelPos.left,
    width: inline ? undefined : panelPos.width,
    minWidth: inline ? 90 : undefined,
    zIndex: 99999,
    backgroundColor: light ? '#ffffff' : '#1a2236',
    border: `1px solid ${light ? '#cbd5e1' : '#1f2d45'}`,
    borderRadius: '0.75rem',
    boxShadow: light
      ? '0 4px 16px rgba(0,0,0,0.12)'
      : '0 4px 24px rgba(0,0,0,0.4)',
    overflow: 'hidden',
    animation: 'fadeIn 0.15s ease-out',
  };

  const optionBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    /* Match input-field padding exactly: 0.625rem top/bottom, 1rem sides */
    padding: '0.5rem 0.875rem',
    fontSize: '0.875rem',
    textAlign: 'left' as const,
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    transition: 'background 0.1s',
  };

  const panel = open
    ? createPortal(
        <div id="custom-dropdown-portal-panel" style={panelStyle}>
          <div style={{ maxHeight, overflowY: 'auto' }}>
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  style={{
                    ...optionBase,
                    color: isSelected ? '#6366f1' : light ? '#0f172a' : '#ffffff',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected
                      ? 'rgba(99,102,241,0.08)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = light
                        ? 'rgba(0,0,0,0.04)'
                        : 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected
                      ? 'rgba(99,102,241,0.08)'
                      : 'transparent';
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <Check size={13} style={{ color: '#6366f1', flexShrink: 0, marginLeft: '0.5rem' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )
    : null;

  /* Inline variant (currency pill) */
  if (inline) {
    return (
      <div className={cn('relative', className)}>
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          className={cn(
            'flex items-center gap-1 h-full px-2.5 text-xs font-semibold',
            'border-l border-border rounded-r-xl outline-none transition-colors duration-150',
            light
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-white/10 text-white hover:bg-white/20',
          )}
        >
          {selected?.label ?? placeholder}
          <ChevronDown
            size={11}
            className={cn('transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
        {panel}
      </div>
    );
  }

  /* Standard dropdown — trigger must match <input class="input-field"> height exactly.
     input-field uses: padding 0.625rem 1rem, font-size inherited (0.875rem via text-sm).
     We reset button appearance and pin to the same box model. */
  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          /* Exactly replicate .input-field box model on a <button> */
          appearance: 'none',
          WebkitAppearance: 'none',
          padding: '0.625rem 1rem',
          lineHeight: '1.5rem',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          fontSize: '0.875rem',
          borderRadius: '0.75rem',
          border: `1px solid ${open ? '#6366f1' : light ? '#cbd5e1' : '#1f2d45'}`,
          backgroundColor: light ? '#ffffff' : '#111827',
          color: selected ? (light ? '#0f172a' : '#ffffff') : '#64748b',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxSizing: 'border-box',
          boxShadow: open ? '0 0 0 1px rgba(99,102,241,0.5)' : 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            color: open ? '#6366f1' : '#64748b',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s, color 0.2s',
          }}
        />
      </button>
      {panel}
    </div>
  );
}
