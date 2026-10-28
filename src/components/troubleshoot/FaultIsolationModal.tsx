'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { FAULT_DIAGNOSTICS } from '@/lib/fault-data';
import { 
  Wrench, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  ExternalLink,
  Cpu,
  Layers
} from 'lucide-react';

export function FaultIsolationModal() {
  const { 
    isFaultModalOpen, 
    setIsFaultModalOpen, 
    selectedFaultSymptomId, 
    setSelectedFaultSymptomId,
    selectedEngine,
    currentTelemetryPoint,
    setIsReportModalOpen
  } = usePdm();

  if (!isFaultModalOpen) return null;

  const currentDiagnostic = FAULT_DIAGNOSTICS.find(
    (d) => d.symptomId === selectedFaultSymptomId
  ) || FAULT_DIAGNOSTICS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 tracking-wide">
                Turbofan Fault Isolation Manual (FIM) Diagnostic Tree
              </h2>
              <p className="text-xs text-slate-400">
                Aerospace gas-path failure symptom isolation &amp; corrective maintenance tasks.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFaultModalOpen(false)}
            className="p-1.5 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Symptom Selection Tabs */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
            Select Detected Gas-Path Telemetry Anomaly:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FAULT_DIAGNOSTICS.map((diag) => {
              const isSelected = diag.symptomId === selectedFaultSymptomId;
              return (
                <button
                  key={diag.symptomId}
                  onClick={() => setSelectedFaultSymptomId(diag.symptomId)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs font-semibold ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{diag.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Symptom Detail Banner */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Telemetry Signatures Correlated on Unit #{selectedEngine.unitId}:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
            {currentDiagnostic.affectedTransducers.map((t, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Probable Root Causes & AMM Tasks */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            FIM Root-Cause Probabilities &amp; AMM Rectification Protocols
          </h3>

          <div className="space-y-3">
            {currentDiagnostic.suspectedRootCauses.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 text-xs">
                {/* Cause Title & Probability Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <strong className="text-slate-100 text-xs sm:text-sm">{item.cause}</strong>
                  </div>
                  <div className="flex items-center space-x-2 font-mono shrink-0">
                    <span className="text-[11px] text-slate-400">Probability:</span>
                    <span className="text-xs font-bold text-cyan-400">
                      {(item.probability * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.subsystem}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${item.probability * 100}%` }}
                  />
                </div>

                {/* Boeing & EASA Task References */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-850">
                    <span className="text-[10px] text-cyan-500 block">Boeing FIM Reference:</span>
                    <span className="text-slate-200">{item.boeingFimRef}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-850">
                    <span className="text-[10px] text-cyan-500 block">EASA Part-M Task Procedure:</span>
                    <span className="text-slate-200">{item.easaPartMTask}</span>
                  </div>
                </div>

                {/* Corrective Action */}
                <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-slate-300 text-[11px] leading-relaxed">
                  <strong className="text-cyan-300 block mb-0.5">Mandatory Corrective Action:</strong>
                  {item.correctiveAction}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] font-mono text-slate-400">
            Source: NASA Ames / CFM56 / GE90 Continuous Engine Health Manuals
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsFaultModalOpen(false);
                setIsReportModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all"
            >
              Generate Work Order Release
            </button>
            <button
              onClick={() => setIsFaultModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
