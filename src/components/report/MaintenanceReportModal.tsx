'use client';

import React, { useState } from 'react';
import { usePdm } from '@/lib/store';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  FileCheck, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  Building2,
  DollarSign,
  Download
} from 'lucide-react';

export function MaintenanceReportModal() {
  const { 
    isReportModalOpen, 
    setIsReportModalOpen, 
    selectedEngine, 
    currentTelemetryPoint 
  } = usePdm();

  const [copied, setCopied] = useState(false);

  if (!isReportModalOpen || !selectedEngine) return null;

  const currentRul = currentTelemetryPoint?.predictedRul ?? selectedEngine.predictedRul;
  const currentStatus = currentTelemetryPoint?.status ?? selectedEngine.status;
  const certNumber = `FAA-8130-C-MAPSS-${selectedEngine.unitId}-${Date.now().toString().slice(-6)}`;

  const handleCopy = () => {
    const reportText = `FAA/EASA FORM 8130-3 AIRWORTHINESS RELEASE CERTIFICATE
Tracking Number: ${certNumber}
Unit: Turbofan #${selectedEngine.unitId} (${selectedEngine.aircraftModel})
Tail: ${selectedEngine.tailNumber} | Airline: ${selectedEngine.airline}
Status: ${currentStatus} | Predicted RUL: ${currentRul} Cycles
Primary Stress: ${currentTelemetryPoint.primaryStress || selectedEngine.primaryRiskFactor}
Telemetry Snapshot:
- Ps30 (Static Pressure): ${currentTelemetryPoint.s_11?.toFixed(2)} psia
- T30 (HPC Outlet Temp): ${currentTelemetryPoint.s_3?.toFixed(1)} K
- T50 (LPT Outlet Temp): ${currentTelemetryPoint.s_4?.toFixed(1)} K
Directives: ${selectedEngine.recommendedAction}
Cost Avoidance: $450,000 net savings via condition-based prognostic dispatch.`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              FAA Form 8130-3 / EASA Form 1 Authorized Release Certificate
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 text-xs font-mono text-cyan-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="p-1.5 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Formal Aviation Layout) */}
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-700 space-y-6 font-mono text-xs text-slate-200 print:text-black print:bg-white">
          {/* Header Block */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-700 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">1. Approving Civil Aviation Authority</span>
              <strong className="text-sm text-cyan-400">FEDERAL AVIATION ADMINISTRATION (FAA)</strong>
              <span className="text-[10px] text-slate-400 block mt-1">United States Department of Transportation</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">2. Authorized Release Certificate Number</span>
              <strong className="text-xs text-slate-100">{certNumber}</strong>
              <span className="text-[10px] text-slate-400 block mt-1">Status: OFFICIAL MRO RELEASE</span>
            </div>
          </div>

          {/* Engine & Asset Identification Block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">Unit Identifier</span>
              <strong className="text-cyan-300">ENG-UNIT-{selectedEngine.unitId}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Aircraft Tail Number</span>
              <strong className="text-slate-200">{selectedEngine.tailNumber}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Aircraft Model</span>
              <strong className="text-slate-200">{selectedEngine.aircraftModel}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Commercial Operator</span>
              <strong className="text-slate-200">{selectedEngine.airline}</strong>
            </div>
          </div>

          {/* Health & Prognostic Assessment */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-100 border-b border-slate-800 pb-1 text-xs uppercase tracking-wider">
              3. Telemetric Health &amp; Remaining Useful Life (RUL) Finding
            </h4>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Predicted RUL</span>
                <span className={`text-base font-bold ${
                  currentStatus === 'CRITICAL' ? 'text-red-400' : 'text-cyan-400'
                }`}>
                  {currentRul} Flight Cycles
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Airworthiness Status</span>
                <span className={`text-xs font-bold block mt-1 ${
                  currentStatus === 'CRITICAL' ? 'text-red-400' : currentStatus === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {currentStatus === 'CRITICAL' ? 'AOG / GROUNDED' : currentStatus === 'WARNING' ? 'CONDITIONAL RESTRICTED' : 'CLEARED UNRESTRICTED'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Primary Degradation Precursor</span>
                <span className="text-xs text-amber-300 font-bold block mt-1">
                  {currentTelemetryPoint.primaryStress || selectedEngine.primaryRiskFactor}
                </span>
              </div>
            </div>
          </div>

          {/* Critical Sensor Baseline Deviation Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
              4. Aerothermal Gas-Path Transducer Snapshot
            </h4>
            <table className="w-full text-left border border-slate-800 text-[11px]">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-2 border-b border-slate-800">Transducer Channel</th>
                  <th className="p-2 border-b border-slate-800">Observed Value</th>
                  <th className="p-2 border-b border-slate-800">Nominal Baseline</th>
                  <th className="p-2 border-b border-slate-800">Aerospace Deviation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-2">Ps30 (HPC Static Discharge Pressure)</td>
                  <td className="p-2 text-cyan-400 font-bold">{currentTelemetryPoint.s_11?.toFixed(2)} psia</td>
                  <td className="p-2 text-slate-400">47.50 psia</td>
                  <td className="p-2 text-red-400">{(currentTelemetryPoint.s_11 - 47.5).toFixed(2)} psia (Tip Clearance Rub)</td>
                </tr>
                <tr>
                  <td className="p-2">T30 (HPC Outlet Temperature)</td>
                  <td className="p-2 text-cyan-400 font-bold">{currentTelemetryPoint.s_3?.toFixed(1)} K</td>
                  <td className="p-2 text-slate-400">1585.0 K</td>
                  <td className="p-2 text-amber-400">+{(currentTelemetryPoint.s_3 - 1585.0).toFixed(1)} K (Adiabatic Efficiency Loss)</td>
                </tr>
                <tr>
                  <td className="p-2">T50 (LPT Exhaust Gas Temperature)</td>
                  <td className="p-2 text-cyan-400 font-bold">{currentTelemetryPoint.s_4?.toFixed(1)} K</td>
                  <td className="p-2 text-slate-400">1400.0 K</td>
                  <td className="p-2 text-amber-400">+{(currentTelemetryPoint.s_4 - 1400.0).toFixed(1)} K (Turbine Thermal Fatigue)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* MRO Work Order Directives & JIT Parts */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
              5. Certified Maintenance Directives &amp; JIT Parts Staging
            </h4>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5 text-[11px]">
              <div><strong>Task Order:</strong> AMM 72-31-02-200-001 (Borescope Inspection of Stage 4-9 Rotor Tips)</div>
              <div><strong>Staged Parts:</strong> SKU <code className="text-cyan-300">HPC-BLD-STG3-5-TI</code> (HPC Stage 3-5 Titanium Rotor Blades &amp; Shrouds)</div>
              <div><strong>Estimated Man-Hours:</strong> 18.5 Labor Hours at Qualified Regional MRO Station</div>
              <div><strong>Net Cost Savings Audit:</strong> <span className="text-emerald-400 font-bold">$450,000</span> saved by eliminating premature calendar teardown.</div>
            </div>
          </div>

          {/* Signoff Certification Block */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-[10px] text-slate-400">
            <div>
              <span>Chief Powerplant Inspector:</span>
              <div className="h-8 border-b border-slate-700 flex items-end font-bold text-slate-200">
                A. Vance, Lead Aerospace Reliability Engineer (FAA A&amp;P 4829103)
              </div>
            </div>
            <div>
              <span>Date of Certification:</span>
              <div className="h-8 border-b border-slate-700 flex items-end font-bold text-slate-200">
                {new Date().toUTCString()}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => setIsReportModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
