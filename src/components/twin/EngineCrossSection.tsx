'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { Cpu, Thermometer, Wind, AlertCircle } from 'lucide-react';
import { SENSOR_BASELINES } from '@/lib/ml-engine';

export function EngineCrossSection() {
  const { currentTelemetryPoint, selectedEngine } = usePdm();
  const { s_2, s_3, s_4, s_11, s_12, status } = currentTelemetryPoint;

  // Compute thermal and pressure stress intensity for component hotspot coloring
  const hpcThermalStress = Math.min(1, Math.max(0, (s_3 - 1575) / 40));
  const hpcPressureStress = Math.min(1, Math.max(0, (48.2 - s_11) / 1.5));
  const lptThermalStress = Math.min(1, Math.max(0, (s_4 - 1395) / 35));
  const lpcThermalStress = Math.min(1, Math.max(0, (s_2 - 642) / 3));

  // Dynamic colors (cyan/emerald for healthy, transitioning to amber and crimson under stress)
  const getHotspotColor = (stress: number) => {
    if (stress > 0.75) return 'bg-red-500/30 border-red-500 text-red-300';
    if (stress > 0.35) return 'bg-amber-500/25 border-amber-500 text-amber-300';
    return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
  };

  const stages = [
    {
      id: 'fan',
      name: 'Fan & Intake',
      code: 'Stage 1',
      temp: 'Ambient',
      status: 'Nominal',
      stress: 0.05,
      sensor: 's_1 (T2)',
      desc: 'Clean sea-level intake air. Zero variance channel pruned.',
    },
    {
      id: 'lpc',
      name: 'Low-Pressure Compressor',
      code: 'LPC (Booster)',
      temp: `${s_2.toFixed(1)} K`,
      status: lpcThermalStress > 0.6 ? 'Elevated' : 'Nominal',
      stress: lpcThermalStress,
      sensor: 's_2 (T24)',
      desc: 'Initial multi-stage compression prior to high-pressure core.',
    },
    {
      id: 'hpc',
      name: 'High-Pressure Compressor',
      code: 'HPC (Core)',
      temp: `${s_3.toFixed(1)} K / ${s_11.toFixed(2)} psia`,
      status: hpcThermalStress > 0.5 || hpcPressureStress > 0.5 ? 'CRITICAL DEGRADATION' : 'Nominal',
      stress: Math.max(hpcThermalStress, hpcPressureStress),
      sensor: 's_3 (T30) & s_11 (Ps30)',
      desc: 'C-MAPSS FD001 Primary Failure Root Cause: Tip clearance erosion and aerodynamic fouling.',
      isHotspot: true,
    },
    {
      id: 'combustor',
      name: 'Combustor',
      code: 'Burner',
      temp: `${s_12.toFixed(1)} ratio`,
      status: 'Active Flame',
      stress: (s_12 - 518) / 6,
      sensor: 's_12 (phi)',
      desc: 'Fuel delivery ratio adjusted to maintain demanded turbine thrust.',
    },
    {
      id: 'hpt',
      name: 'High-Pressure Turbine',
      code: 'HPT',
      temp: 'Active Bleed',
      status: 'Stressed',
      stress: 0.3,
      sensor: 's_20 (W31)',
      desc: 'Single-stage cooled turbine driving the HPC spool.',
    },
    {
      id: 'lpt',
      name: 'Low-Pressure Turbine',
      code: 'LPT',
      temp: `${s_4.toFixed(1)} K`,
      status: lptThermalStress > 0.6 ? 'Warning' : 'Nominal',
      stress: lptThermalStress,
      sensor: 's_4 (T50)',
      desc: 'Multi-stage turbine driving the front fan. Measures exhaust thermal margin.',
    },
    {
      id: 'exhaust',
      name: 'Exhaust Nozzle',
      code: 'Nozzle',
      temp: 'Jet Thrust',
      status: 'Discharge',
      stress: 0.1,
      sensor: 'Thrust',
      desc: 'Core and bypass exhaust gas velocity discharge.',
    },
  ];

  return (
    <div className="telemetry-card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Turbofan Mechanical Cross-Section &amp; Thermal Hotspots
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">Unit #{selectedEngine?.unitId}</span>
          <span className="text-cyan-400">{selectedEngine?.aircraftModel}</span>
        </div>
      </div>

      {/* Turbofan Stages Flow Diagram */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((st) => {
          const colorClasses = getHotspotColor(st.stress);
          return (
            <div
              key={st.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${colorClasses} ${
                st.isHotspot && status !== 'NOMINAL' ? 'ring-2 ring-red-500/50 animate-pulse' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">
                  <span>{st.code}</span>
                  {st.isHotspot && <span className="text-red-400 font-black">CORE</span>}
                </div>
                <div className="text-xs font-bold text-slate-100 leading-snug">
                  {st.name}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60">
                <div className="text-[10px] text-slate-400 font-mono">
                  {st.sensor}
                </div>
                <div className="text-xs font-mono font-black mt-0.5 text-slate-200">
                  {st.temp}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Physical Failure Context */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-300">
        <AlertCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-100">Thermodynamic Degradation Coupling:</span> HPC blade clearance degradation induces aerodynamic recirculation, driving Static HPC Pressure (<span className="text-cyan-300 font-mono">s_11</span>) down and forcing core temperatures (<span className="text-amber-300 font-mono">s_3</span> &amp; <span className="text-rose-300 font-mono">s_4</span>) to escalate to maintain requested takeoff thrust.
        </div>
      </div>
    </div>
  );
}
