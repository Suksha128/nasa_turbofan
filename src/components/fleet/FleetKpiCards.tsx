'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { Plane, Activity, ShieldAlert, AlertTriangle, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

export function FleetKpiCards() {
  const { fleet, setFilterStatus } = usePdm();

  const totalUnits = fleet.length;
  const criticalUnits = fleet.filter((u) => u.status === 'CRITICAL');
  const warningUnits = fleet.filter((u) => u.status === 'WARNING');
  const nominalUnits = fleet.filter((u) => u.status === 'NOMINAL');

  const avgHealth = totalUnits > 0 
    ? Math.round(fleet.reduce((acc, u) => acc + u.healthScore, 0) / totalUnits) 
    : 0;

  const avgCycles = totalUnits > 0
    ? Math.round(fleet.reduce((acc, u) => acc + u.currentCycle, 0) / totalUnits)
    : 0;

  // Estimated economic value: $450k per avoided unscheduled engine removal (Boeing/GE standard)
  const preventedRemovals = criticalUnits.length + warningUnits.length;
  const costSavingsMillion = (preventedRemovals * 0.45).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Active Fleet Size */}
      <div 
        onClick={() => setFilterStatus('ALL')}
        className="telemetry-card p-5 cursor-pointer transition-all hover:scale-[1.01] hover:border-cyan-500/50 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Fleet Size
          </span>
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Plane className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-white font-mono">{totalUnits}</span>
          <span className="text-xs text-cyan-400 font-medium">Turbofan Units</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
          <span>Fleet Avg Cycles: <span className="font-mono text-slate-200">{avgCycles}</span></span>
          <span className="text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> 100% Monitored
          </span>
        </div>
      </div>

      {/* 2. Fleet Health Score */}
      <div className="telemetry-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avg Fleet Health
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-white font-mono">{avgHealth}%</span>
          <span className="text-xs text-slate-400 font-medium">Operational Index</span>
        </div>
        {/* Visual health bar */}
        <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${avgHealth}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Target: &gt; 70%</span>
          <span className="text-cyan-400 font-mono">Airworthy</span>
        </div>
      </div>

      {/* 3. Critical Engines (RUL <= 20) */}
      <div 
        onClick={() => setFilterStatus('CRITICAL')}
        className="telemetry-card p-5 cursor-pointer transition-all hover:scale-[1.01] hover:border-red-500/50 bg-red-950/10 border-red-900/30 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Immediate Attention</span>
          </span>
          <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-red-400 font-mono">{criticalUnits.length}</span>
          <span className="text-xs text-red-300 font-medium">Engines (RUL &le; 20)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
          <span className="text-red-400 font-semibold">AOG Protocol Required</span>
          <span className="text-slate-400 group-hover:text-red-300 transition-colors flex items-center">
            Filter View &rarr;
          </span>
        </div>
      </div>

      {/* 4. High-Risk Warning Engines (21 <= RUL <= 50) */}
      <div 
        onClick={() => setFilterStatus('WARNING')}
        className="telemetry-card p-5 cursor-pointer transition-all hover:scale-[1.01] hover:border-amber-500/50 bg-amber-950/10 border-amber-900/30 group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Scheduled Servicing</span>
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-amber-400 font-mono">{warningUnits.length}</span>
          <span className="text-xs text-amber-300 font-medium">Engines (21-50 Cycles)</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
          <span className="text-amber-400">JIT Blade Staging</span>
          <span className="text-slate-400 group-hover:text-amber-300 transition-colors flex items-center">
            Filter View &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
