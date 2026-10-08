'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { Header } from '@/components/common/Header';
import { FleetOverviewView } from '@/components/fleet/FleetOverviewView';
import { EngineTwinView } from '@/components/twin/EngineTwinView';
import { ArchitectureView } from '@/components/explainability/ArchitectureView';
import { ShieldCheck, Database, FileText, ExternalLink, Cpu } from 'lucide-react';

export default function DashboardPage() {
  const { activeScreen, selectedEngine, fleet } = usePdm();

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] bg-radar-grid text-slate-100">
      {/* Top Application Header */}
      <Header />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Engine Context Banner (shown on Twin view or when an engine is selected) */}
        {activeScreen === 'twin' && selectedEngine && (
          <div className="flex flex-wrap items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-semibold text-slate-100 font-mono">
                TELEMETRY DIGITAL TWIN: UNIT #{selectedEngine.unitId}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 font-mono">{selectedEngine.tailNumber}</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{selectedEngine.airline}</span>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-400">{selectedEngine.aircraftModel}</span>
            </div>

            <div className="flex items-center space-x-3 text-slate-400 font-mono text-[11px] mt-1 sm:mt-0">
              <span>Flight Hours: {selectedEngine.installationFlightHours}h</span>
              <span>Last Overhaul: {selectedEngine.lastOverhaulDate}</span>
            </div>
          </div>
        )}

        {/* Dynamic Screen View */}
        {activeScreen === 'fleet' && <FleetOverviewView />}
        {activeScreen === 'twin' && <EngineTwinView />}
        {activeScreen === 'architecture' && <ArchitectureView />}
      </main>

      {/* Aerospace Engineering Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-300">
              NASA Ames Research Center &amp; Glenn Research Center C-MAPSS Benchmark
            </span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px] text-slate-400">
            <span>Turbofan Dataset: FD001 (Sea-Level, HPC Fault)</span>
            <span>Target RUL: Piecewise 125 Cycles</span>
            <span>Scoring: NASA Asymmetric Exponential (exp(d/10) - 1)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
