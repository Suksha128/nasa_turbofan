'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { Modal } from '@/components/common/Modal';
import { ArrowRight, CheckCircle2, Code2, Database, ShieldCheck, Sparkles } from 'lucide-react';

export function PipelineNodeModal() {
  const { selectedArchitectureStage, setSelectedArchitectureStage } = usePdm();

  if (!selectedArchitectureStage) return null;

  const stage = selectedArchitectureStage;

  return (
    <Modal
      isOpen={!!selectedArchitectureStage}
      onClose={() => setSelectedArchitectureStage(null)}
      title={`Stage ${stage.stepNumber}: ${stage.name}`}
      subtitle={stage.subtitle}
      maxWidth="2xl"
    >
      <div className="space-y-5 text-slate-300 text-xs">
        {/* Full Description */}
        <p className="text-sm leading-relaxed text-slate-200">
          {stage.fullDesc}
        </p>

        {/* Mathematical Formulation (if any) */}
        {stage.mathematics && (
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
              Mathematical Formulation
            </div>
            <div className="overflow-x-auto py-1 text-sm font-semibold tracking-wide">
              {stage.mathematics}
            </div>
          </div>
        )}

        {/* Inputs & Outputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Inputs */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase text-slate-400 mb-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Input Signals</span>
            </div>
            <ul className="space-y-1.5">
              {stage.inputs.map((inp, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{inp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Outputs */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase text-slate-400 mb-2">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Output Artifacts</span>
            </div>
            <ul className="space-y-1.5">
              {stage.outputs.map((out, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-[11px] text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{out}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Code Implementation Sample */}
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase text-slate-400 mb-1.5">
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Implementation Logic</span>
          </div>
          <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <code>{stage.codeSnippet}</code>
          </pre>
        </div>

        {/* Key Takeaway Banner */}
        <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-start space-x-2 text-cyan-200">
          <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-100">Engineering Takeaway: </span>
            {stage.keyTakeaway}
          </div>
        </div>
      </div>
    </Modal>
  );
}
