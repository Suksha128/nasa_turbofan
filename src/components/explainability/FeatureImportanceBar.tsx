'use client';

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { BarChart2, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { SENSOR_METADATA } from '@/lib/ml-engine';

export function FeatureImportanceBar() {
  const data = [
    {
      sensor: 's_11 (Ps30)',
      name: 'Static HPC Outlet Pressure',
      importance: 36,
      color: '#06b6d4',
      physics: 'Blade tip clearance erosion causes pressure drop in high-pressure compressor stages.',
    },
    {
      sensor: 's_4 (T50)',
      name: 'LPT Outlet Temperature',
      importance: 27,
      color: '#ec4899',
      physics: 'Turbine exhaust gas thermal climb as core thermodynamic efficiency declines.',
    },
    {
      sensor: 's_3 (T30)',
      name: 'HPC Outlet Temperature',
      importance: 21,
      color: '#f97316',
      physics: 'Compressor discharge air temperature spikes during aerodynamic stalling and blade rubbing.',
    },
    {
      sensor: 's_2 (T24)',
      name: 'LPC Outlet Temperature',
      importance: 10,
      color: '#3b82f6',
      physics: 'Moderate heat rise as booster compressor works harder to feed the degraded core.',
    },
    {
      sensor: 's_12 (phi)',
      name: 'Fuel-to-Ps30 Ratio',
      importance: 6,
      color: '#a855f7',
      physics: 'FADEC fuel delivery enrichment required to sustain commanded rotor speeds.',
    },
  ];

  return (
    <div className="telemetry-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Sensor Feature Importance (Random Forest / GBDT Gini Purity)
          </h3>
        </div>
        <span className="text-xs text-cyan-400 font-mono">C-MAPSS FD001 Trained</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Horizontal Bar Chart */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 40]} unit="%" />
              <YAxis
                type="category"
                dataKey="sensor"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                width={85}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  color: '#f8fafc',
                }}
                formatter={(val: any) => [`${val}% Predictive Weight`, 'Importance']}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Physical Interpretation Table */}
        <div className="space-y-2.5 text-xs">
          {data.map((item) => (
            <div
              key={item.sensor}
              className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start space-x-2.5"
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200 font-mono">{item.sensor}</span>
                  <span className="text-[11px] text-slate-400">({item.name})</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold ml-auto">
                    {item.importance}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {item.physics}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
