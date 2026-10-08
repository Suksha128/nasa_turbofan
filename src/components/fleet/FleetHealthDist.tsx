'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { BarChart3, Info, AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';

export function FleetHealthDist() {
  const { fleet, setFilterStatus } = usePdm();

  // Aggregate engines into RUL brackets
  const brackets = [
    { name: '0 - 20 (Critical)', range: 'RUL <= 20', count: 0, color: '#ef4444', status: 'CRITICAL' },
    { name: '21 - 50 (Warning)', range: '21 <= RUL <= 50', count: 0, color: '#f59e0b', status: 'WARNING' },
    { name: '51 - 80 (Nominal)', range: '51 <= RUL <= 80', count: 0, color: '#06b6d4', status: 'NOMINAL' },
    { name: '81 - 125 (Optimal)', range: '81 <= RUL <= 125', count: 0, color: '#10b981', status: 'NOMINAL' },
  ];

  fleet.forEach((u) => {
    if (u.predictedRul <= 20) brackets[0].count++;
    else if (u.predictedRul <= 50) brackets[1].count++;
    else if (u.predictedRul <= 80) brackets[2].count++;
    else brackets[3].count++;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart: Fleet RUL Distribution Histogram */}
      <div className="telemetry-card p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Fleet Remaining Useful Life (RUL) Distribution
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">100 Turbofans (FD001)</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brackets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                formatter={(val: any) => [`${val} Engines`, 'Count']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {brackets.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setFilterStatus(entry.status as any)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
          <span>Click any bar to filter the fleet status table above.</span>
          <span className="font-mono text-cyan-400">Target: Minimize Left-Skew (&lt; 20 Cycles)</span>
        </div>
      </div>

      {/* Decision Threshold Policy Card */}
      <div className="telemetry-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Info className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Maintenance Decision Policy
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Turbofan operational reliability is governed by strict cycle-to-failure bounds matching FAA airworthiness directives:
          </p>

          <div className="mt-3 space-y-2.5 text-xs">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-emerald-300">RUL &gt; 50 Cycles (Nominal)</div>
                <div className="text-[11px] text-slate-300">Unrestricted long-haul flights. Standard 100-cycle line checks.</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-start space-x-2">
              <AlertOctagon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-amber-300">21 - 50 Cycles (Warning)</div>
                <div className="text-[11px] text-slate-300">Schedule borescope inspection. Pre-order HPC stage 3-5 replacement blades in JIT inventory.</div>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-red-950/50 border border-red-800/50 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-red-300">RUL &le; 20 Cycles (Critical)</div>
                <div className="text-[11px] text-slate-300">Ground engine immediately (AOG). Hot section disassembly to avoid in-flight shutdown (IFSD).</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between items-center">
          <span>Evaluator: NASA Asymmetric Loss</span>
          <span className="text-cyan-400 font-semibold">FD001 Baseline</span>
        </div>
      </div>
    </div>
  );
}
