'use client';

import React from 'react';
import { HealthStatus } from '@/lib/types';
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

export function StatusBadge({ status, size = 'md' }: { status: HealthStatus; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-semibold',
  }[size];

  if (status === 'NOMINAL') {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-medium ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>NOMINAL (RUL &gt; 50)</span>
      </span>
    );
  }

  if (status === 'WARNING') {
    return (
      <span className={`inline-flex items-center rounded-full bg-amber-950/70 border border-amber-500/50 text-amber-300 font-medium animate-warning-pulse ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        <span>WARNING (21-50)</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-red-950/80 border border-red-500/60 text-red-300 font-medium animate-critical-pulse ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
      <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>CRITICAL (RUL &le; 20)</span>
    </span>
  );
}

export function ClearanceBadge({ clearance }: { clearance: 'UNRESTRICTED' | 'CONDITIONAL_RESTRICTED' | 'GROUNDED' }) {
  if (clearance === 'UNRESTRICTED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-900/40 text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>CLEARED (LONG-HAUL)</span>
      </span>
    );
  }

  if (clearance === 'CONDITIONAL_RESTRICTED') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-900/40 text-amber-300 border border-amber-500/30">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>RESTRICTED (MAX 25 CYCLES)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-900/50 text-red-200 border border-red-500/50">
      <Ban className="w-3.5 h-3.5" />
      <span>AOG (GROUNDED)</span>
    </span>
  );
}
