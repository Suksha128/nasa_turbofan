'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { ARCHITECTURE_STAGES } from '@/lib/architecture-data';
import { 
  Radio, 
  Filter, 
  Cpu, 
  Layers, 
  Scale, 
  SendHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';

export function ArchitectureDiagram() {
  const { setSelectedArchitectureStage } = usePdm();

  const stageIcons = [
    <Radio key="1" className="w-5 h-5 text-cyan-400" />,
    <Filter key="2" className="w-5 h-5 text-blue-400" />,
    <Layers key="3" className="w-5 h-5 text-indigo-400" />,
    <Cpu key="4" className="w-5 h-5 text-amber-400" />,
    <Scale key="5" className="w-5 h-5 text-rose-400" />,
    <SendHorizontal key="6" className="w-5 h-5 text-emerald-400" />,
  ];

  return (
    <div className="telemetry-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              End-to-End Predictive Maintenance Pipeline Architecture
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data pipeline and ML inference lifecycle from avionics sensor bus to ERP maintenance work order dispatch.
          </p>
        </div>
        <span className="text-xs text-cyan-400 font-mono flex items-center">
          <Info className="w-3.5 h-3.5 mr-1" /> Click any stage node to inspect technical specifications
        </span>
      </div>

      {/* Interactive Flow Diagram Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {ARCHITECTURE_STAGES.map((stage, idx) => {
          return (
            <div
              key={stage.id}
              onClick={() => setSelectedArchitectureStage(stage)}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/70 hover:bg-slate-850 hover:shadow-lg hover:shadow-cyan-950/40 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              {/* Stage Step Badge */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {stageIcons[idx]}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 group-hover:text-cyan-300 transition-colors">
                    Stage 0{stage.stepNumber}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {stage.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                  {stage.shortDesc}
                </p>
              </div>

              {/* Action Hint */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Architectural Flow Connection Bar */}
      <div className="hidden xl:flex items-center justify-between px-6 py-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono text-slate-400">
        <span>Raw ARINC 429 Bus (21 Sensors)</span>
        <span className="text-cyan-400">&rarr;</span>
        <span>Zero-Variance Filtering (Prune 7 Flatlines)</span>
        <span className="text-cyan-400">&rarr;</span>
        <span>5-Cycle Rolling Features (\bar&#123;s&#125;_i, \sigma_i)</span>
        <span className="text-cyan-400">&rarr;</span>
        <span>Surrogate ML Engine (Piecewise 125 Cyc Cap)</span>
        <span className="text-cyan-400">&rarr;</span>
        <span>NASA Asymmetric Loss (Late Penalty)</span>
        <span className="text-cyan-400">&rarr;</span>
        <span>Automated Maintenance ERP Action</span>
      </div>
    </div>
  );
}
