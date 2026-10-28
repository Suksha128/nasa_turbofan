'use client';

import React, { useMemo } from 'react';
import { usePdm } from '@/lib/store';
import { FLIGHT_ROUTES, computeDispatchClearance } from '@/lib/flight-routes';
import { 
  Plane, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Compass, 
  Gauge, 
  Flame, 
  Sliders, 
  FileCheck2,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';

export function FlightDispatchView() {
  const { 
    selectedEngine, 
    currentTelemetryPoint, 
    selectedDispatchRouteId, 
    setSelectedDispatchRouteId, 
    takeoffDeratePercent, 
    setTakeoffDeratePercent,
    setIsReportModalOpen,
    setActiveScreen
  } = usePdm();

  const selectedRoute = useMemo(() => {
    return FLIGHT_ROUTES.find((r) => r.id === selectedDispatchRouteId) || FLIGHT_ROUTES[0];
  }, [selectedDispatchRouteId]);

  const clearance = useMemo(() => {
    return computeDispatchClearance(selectedEngine, currentTelemetryPoint, selectedRoute, takeoffDeratePercent);
  }, [selectedEngine, currentTelemetryPoint, selectedRoute, takeoffDeratePercent]);

  const currentRul = currentTelemetryPoint?.predictedRul ?? selectedEngine?.predictedRul ?? 50;
  const currentStatus = currentTelemetryPoint?.status ?? selectedEngine?.status ?? 'NOMINAL';

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Plane className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide">
              Flight Route Airworthiness &amp; ETOPS Dispatcher
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate commercial route feasibility, calculate wear progression, and optimize takeoff thrust derate against FAA AC 120-42B airworthiness criteria.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            Selected: <strong className="text-cyan-400">Unit #{selectedEngine.unitId}</strong> ({selectedEngine.aircraftModel})
          </span>
          <button
            onClick={() => setActiveScreen('twin')}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 hover:bg-cyan-900 transition-colors"
          >
            <span>Telemetry Twin</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Grid: Route Selector + Derate Optimizer + Clearance Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Selector & Derate (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Commercial Routes Selection */}
          <div className="telemetry-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Select Scheduled Commercial Flight Route
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {FLIGHT_ROUTES.length} Available Routes
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {FLIGHT_ROUTES.map((route) => {
                const isSelected = route.id === selectedDispatchRouteId;
                return (
                  <button
                    key={route.id}
                    onClick={() => setSelectedDispatchRouteId(route.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-100">{route.name}</span>
                        {route.etopsRequired && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                            ETOPS-180
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-3 font-mono">
                        <span>Distance: {route.distanceNm} nm</span>
                        <span>•</span>
                        <span>Flight Time: ~{route.flightHours}h</span>
                        <span>•</span>
                        <span className="text-slate-500">{route.typicalAircraft}</span>
                      </div>
                    </div>

                    <div className="text-right pl-3 shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-1 rounded font-bold ${
                        isSelected ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-400/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isSelected ? 'ACTIVE' : 'SELECT'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Takeoff Thrust Derate Optimizer */}
          <div className="telemetry-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Takeoff Thrust Derate Optimizer (EGT Relief)
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {takeoffDeratePercent}% Derate Applied
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>0% Full Rated Thrust (Max Thermal Fatigue)</span>
                <span>20% Max Derate (Conserves ~30% Life)</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={takeoffDeratePercent}
                onChange={(e) => setTakeoffDeratePercent(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="grid grid-cols-3 gap-2.5 pt-2 text-center text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Peak EGT Reduction</span>
                  <span className="font-bold text-emerald-400">
                    -{(takeoffDeratePercent * 1.8).toFixed(1)} K
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">HPC Tip Rub Relief</span>
                  <span className="font-bold text-cyan-400">
                    +{(takeoffDeratePercent * 1.5).toFixed(0)}% Margin
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Cycle Wear Saving</span>
                  <span className="font-bold text-amber-400">
                    ~{(takeoffDeratePercent * 0.12).toFixed(1)} cycles
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Flight Clearance Decision Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="telemetry-card p-5 space-y-5">
            {/* Decision Status Banner */}
            <div className={`p-4 rounded-xl border text-center space-y-2 ${
              clearance.status === 'GO'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                : clearance.status === 'CONDITIONAL_DERATE'
                ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30'
                : 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/30'
            }`}>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider uppercase mb-1">
                {clearance.status === 'GO' ? (
                  <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>DISPATCH AUTHORIZED (GO)</span>
                  </span>
                ) : clearance.status === 'CONDITIONAL_DERATE' ? (
                  <span className="bg-amber-900/80 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>CONDITIONAL CLEARANCE</span>
                  </span>
                ) : (
                  <span className="bg-red-900/80 text-red-300 border border-red-500/40 px-3 py-1 rounded-full flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 animate-pulse" />
                    <span>GROUNDED (NO-GO AOG)</span>
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-100">
                {clearance.clearanceTitle}
              </h4>
            </div>

            {/* Projected Telemetry Wear Dial */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-200 block uppercase tracking-wider text-[11px]">
                Pre vs. Post Flight RUL Projection
              </span>

              <div className="flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Pre-Flight RUL</span>
                  <span className="text-base font-bold text-slate-100">{currentRul} cycles</span>
                </div>
                <span className="text-slate-500 font-bold">➔</span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Projected Post-Flight</span>
                  <span className={`text-base font-bold ${
                    clearance.projectedPostFlightRul <= 20 ? 'text-red-400' : 'text-cyan-400'
                  }`}>
                    {clearance.projectedPostFlightRul} cycles
                  </span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    clearance.projectedPostFlightRul <= 20 ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, (clearance.projectedPostFlightRul / 125) * 100)}%` }}
                />
              </div>
            </div>

            {/* ETOPS-180 & IFSD Risk Assessment */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">In-Flight Shutdown (IFSD) Rate:</span>
                <span className={`font-bold ${clearance.ifsdRiskPerFlightHour > 0.01 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {(clearance.ifsdRiskPerFlightHour * 100).toFixed(3)}% / flt hr
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">ETOPS-180 Oceanic Status:</span>
                <span className={`font-bold ${clearance.etopsCleared ? 'text-emerald-400' : 'text-red-400'}`}>
                  {clearance.etopsCleared ? 'COMPLIANT' : 'DISALLOWED'}
                </span>
              </div>
            </div>

            {/* Operational Dispatch Notes */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs text-slate-300">
              <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">
                Dispatcher Airworthiness Directives:
              </span>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-400">
                {clearance.operationalNotes.map((note, nIdx) => (
                  <li key={nIdx}>{note}</li>
                ))}
              </ul>
            </div>

            {/* Action Button: Generate FAA 8130-3 Certificate */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-950/40"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Generate FAA Form 8130-3 Release Certificate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
