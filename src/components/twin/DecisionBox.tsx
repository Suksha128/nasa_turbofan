'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { ClearanceBadge } from '@/components/common/Badge';
import { 
  ClipboardList, 
  Wrench, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  PlaneTakeoff,
  Clock,
  SendHorizontal
} from 'lucide-react';

export function DecisionBox() {
  const { currentTelemetryPoint, selectedEngine } = usePdm();
  const { predictedRul, status, primaryStress } = currentTelemetryPoint;

  let clearance: 'UNRESTRICTED' | 'CONDITIONAL_RESTRICTED' | 'GROUNDED';
  let commandTitle: string;
  let commandDetail: string;
  let partSku: string;
  let partName: string;
  let priority: 'LOW' | 'MEDIUM' | 'URGENT';
  let leadTime: string;

  if (predictedRul > 50) {
    clearance = 'UNRESTRICTED';
    commandTitle = 'CLEARED FOR CONTINUED AIRLINE OPERATIONS';
    commandDetail = 'Engine aerothermal degradation is within nominal bounds. Cleared for long-haul international routes. Continue routine 100-cycle visual borescope checks.';
    partSku = 'N/A - NOMINAL';
    partName = 'Standard Filter & Lubricant Top-off';
    priority = 'LOW';
    leadTime = 'Routine Turnaround (< 4h)';
  } else if (predictedRul > 20) {
    clearance = 'CONDITIONAL_RESTRICTED';
    commandTitle = 'INSPECTION REQUIRED / JIT PARTS STAGED';
    commandDetail = 'Compressor performance indicates accelerated thermal creep and tip clearance leakage. Restrict routes to domestic regional routes (max 25 cycles). Order HPC Stage 3-5 titanium blades in JIT inventory.';
    partSku = 'HPC-BLD-STG3-5-TI';
    partName = 'HPC Stage 3-5 Rotor Blades & Honeycomb Shrouds';
    priority = 'MEDIUM';
    leadTime = 'Staged for 48h Maintenance Window';
  } else {
    clearance = 'GROUNDED';
    commandTitle = 'AOG (AIRCRAFT ON GROUND) / GROUND IMMEDIATELY';
    commandDetail = 'CRITICAL: Severe HPC pressure drop and LPT exhaust over-temp detected. Engine poses immediate risk of in-flight shutdown (IFSD). Ground aircraft immediately. Pull engine for shop overhaul.';
    partSku = 'GE90-HPC-CORE-ASSY';
    partName = 'Full HPC Module & High-Pressure Turbine Rotor';
    priority = 'URGENT';
    leadTime = 'Emergency Line Replacement (AOG)';
  }

  return (
    <div className="telemetry-card p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Operational Maintenance Decision Dispatcher
            </h3>
          </div>
          <ClearanceBadge clearance={clearance} />
        </div>

        {/* Command Callout Banner */}
        <div className={`p-4 rounded-xl border transition-all ${
          status === 'CRITICAL'
            ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/40'
            : status === 'WARNING'
            ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/30'
            : 'bg-emerald-950/20 border-emerald-500/30'
        }`}>
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg shrink-0 ${
              status === 'CRITICAL' 
                ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' 
                : status === 'WARNING'
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {status === 'CRITICAL' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : status === 'WARNING' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <PlaneTakeoff className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className={`font-black text-sm tracking-wide ${
                status === 'CRITICAL' 
                  ? 'text-red-300' 
                  : status === 'WARNING' 
                  ? 'text-amber-300' 
                  : 'text-emerald-300'
              }`}>
                {commandTitle}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {commandDetail}
              </p>
            </div>
          </div>
        </div>

        {/* Action Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
          {/* Primary Stress Factor */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">
              Primary Telemetry Risk Factor
            </span>
            <span className="text-slate-200 font-semibold font-mono">
              {primaryStress}
            </span>
          </div>

          {/* JIT Spare Part Staging */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>JIT Inventory Action</span>
              <Package className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-slate-200 font-semibold truncate block" title={partName}>
              {partName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
              SKU: {partSku}
            </span>
          </div>
        </div>
      </div>

      {/* Dispatch Work Order Button */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Turnaround: <span className="text-slate-200 font-mono font-medium">{leadTime}</span></span>
        </div>

        <button
          onClick={() => {
            alert(`Dispatched SAP/Amos Work Order for Engine Unit #${selectedEngine?.unitId} (${selectedEngine?.tailNumber}). Status: ${clearance}.`);
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-700 text-slate-200 hover:text-white font-medium text-xs border border-slate-700 hover:border-cyan-500 transition-all shadow-sm"
        >
          <SendHorizontal className="w-3.5 h-3.5" />
          <span>Dispatch Work Order</span>
        </button>
      </div>
    </div>
  );
}
