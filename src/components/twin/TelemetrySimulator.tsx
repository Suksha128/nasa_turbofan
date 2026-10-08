'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { SENSOR_BASELINES } from '@/lib/ml-engine';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Gauge, 
  Zap, 
  Flame, 
  Wind, 
  Compass, 
  Layers,
  ChevronDown
} from 'lucide-react';

export function TelemetrySimulator() {
  const {
    fleet,
    selectedUnitId,
    setSelectedUnitId,
    selectedEngine,
    currentCycle,
    setCurrentCycle,
    isSimulating,
    setIsSimulating,
    simulationSpeed,
    setSimulationSpeed,
    sensorOverrides,
    setSensorOverride,
    resetSensorOverrides,
    loadPreset,
    currentTelemetryPoint,
  } = usePdm();

  const maxCycle = selectedEngine?.maxCycle || 200;

  const sensorSliders = [
    {
      id: 's_11' as const,
      name: 'Static HPC Pressure (s_11)',
      code: 'Ps30',
      unit: 'psia',
      min: 46.5,
      max: 48.5,
      step: 0.01,
      baseline: SENSOR_BASELINES.s_11.baseline,
      icon: <Wind className="w-4 h-4 text-cyan-400" />,
      desc: 'Drops as compressor blade tip clearances erode',
    },
    {
      id: 's_3' as const,
      name: 'HPC Outlet Temp (s_3)',
      code: 'T30',
      unit: 'K',
      min: 1570,
      max: 1615,
      step: 0.5,
      baseline: SENSOR_BASELINES.s_3.baseline,
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      desc: 'Rises sharply under aerodynamic compressor stall stress',
    },
    {
      id: 's_4' as const,
      name: 'LPT Outlet Temp (s_4)',
      code: 'T50',
      unit: 'K',
      min: 1390,
      max: 1430,
      step: 0.5,
      baseline: SENSOR_BASELINES.s_4.baseline,
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      desc: 'Exhaust gas thermal climb reflecting turbine stage fatigue',
    },
    {
      id: 's_2' as const,
      name: 'LPC Outlet Temp (s_2)',
      code: 'T24',
      unit: 'K',
      min: 641,
      max: 645,
      step: 0.1,
      baseline: SENSOR_BASELINES.s_2.baseline,
      icon: <Compass className="w-4 h-4 text-blue-400" />,
      desc: 'Low pressure compressor exit gas temperature',
    },
    {
      id: 's_12' as const,
      name: 'Fuel Flow / Ps30 Ratio (s_12)',
      code: 'phi',
      unit: 'pps/psia',
      min: 518,
      max: 524,
      step: 0.1,
      baseline: SENSOR_BASELINES.s_12.baseline,
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      desc: 'Higher ratio required to sustain target thrust',
    },
  ];

  return (
    <div className="telemetry-card p-5 space-y-6">
      {/* Simulator Top Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        {/* Engine Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase text-slate-400 font-mono">Unit:</span>
            <div className="relative">
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                className="appearance-none bg-slate-900 border border-slate-700 text-slate-100 font-mono font-bold text-sm rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner"
              >
                {fleet.map((u) => (
                  <option key={u.unitId} value={u.unitId} className="bg-slate-900">
                    Unit #{u.unitId} ({u.tailNumber} - {u.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Model: <span className="text-slate-200 font-medium">{selectedEngine?.aircraftModel}</span>
          </div>
        </div>

        {/* Live Simulation Play/Pause & Speed Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-md ${
              isSimulating
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30 animate-pulse'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? 'Pause Telemetry' : 'Simulate Live Telemetry'}</span>
          </button>

          {/* Speed selector */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                  simulationSpeed === spd
                    ? 'bg-slate-700 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset Overrides */}
          {Object.keys(sensorOverrides).length > 0 && (
            <button
              onClick={resetSensorOverrides}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-amber-500/30 transition-colors"
              title="Revert manually modified sensor sliders back to authentic flight telemetry"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Injected Faults</span>
            </button>
          )}
        </div>
      </div>

      {/* Flight Cycle Scrubber Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              Operational Flight Cycle
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
              Knee Point: Cycle {selectedEngine?.kneePointCycle}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-cyan-400 font-mono">
              Cycle {currentCycle}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {maxCycle} Max</span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="relative pt-1">
          <input
            type="range"
            min={1}
            max={maxCycle}
            value={currentCycle}
            onChange={(e) => {
              setCurrentCycle(Number(e.target.value));
              resetSensorOverrides();
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
          />
          {/* Degradation Knee Indicator Marker */}
          {selectedEngine?.kneePointCycle && (
            <div
              className="absolute top-5 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${(selectedEngine.kneePointCycle / maxCycle) * 100}%` }}
            >
              <div className="w-1.5 h-3 bg-amber-400 rounded-full" />
              <span className="text-[10px] text-amber-400 font-mono mt-0.5 whitespace-nowrap">Wear Onset</span>
            </div>
          )}
        </div>

        {/* Lifecycle Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-5">
          <span className="text-xs text-slate-400 font-medium">Telemetry Presets:</span>
          <button
            onClick={() => loadPreset('fresh')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/20 text-xs transition-colors"
          >
            Fresh Overhaul (Cycle 10)
          </button>
          <button
            onClick={() => loadPreset('knee')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/20 text-xs transition-colors"
          >
            Degradation Knee (Cycle {selectedEngine?.kneePointCycle})
          </button>
          <button
            onClick={() => loadPreset('warning')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 text-xs transition-colors"
          >
            Warning Threshold (21-50 RUL)
          </button>
          <button
            onClick={() => loadPreset('critical')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-red-300 border border-red-500/20 text-xs transition-colors"
          >
            Critical Failure Imminent (&le; 20 RUL)
          </button>
        </div>
      </div>

      {/* Sensor Interactive Sliders / What-If Injection */}
      <div className="border-t border-slate-800 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase text-slate-200 tracking-wider">
              Critical Aerothermal Sensor Channels &amp; What-If Injection
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Drag sliders to simulate accelerated thermal wear or pressure leak anomalies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sensorSliders.map((s) => {
            const currentVal = currentTelemetryPoint[s.id];
            const isOverridden = sensorOverrides[s.id] !== undefined;

            return (
              <div
                key={s.id}
                className={`p-3 rounded-lg border transition-all ${
                  isOverridden 
                    ? 'bg-cyan-950/20 border-cyan-500/50 shadow-sm' 
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    {s.icon}
                    <span className="text-xs font-bold text-slate-200">{s.code}</span>
                    <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{s.name}</span>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className={`text-sm font-extrabold font-mono ${
                      isOverridden ? 'text-cyan-300' : 'text-slate-100'
                    }`}>
                      {currentVal.toFixed(s.id === 's_11' ? 3 : 1)}
                    </span>
                    <span className="text-[10px] text-slate-400">{s.unit}</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={currentVal}
                  onChange={(e) => setSensorOverride(s.id, Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>Nominal: {s.baseline} {s.unit}</span>
                  {isOverridden && (
                    <button
                      onClick={() => setSensorOverride(s.id, undefined)}
                      className="text-cyan-400 hover:underline"
                    >
                      Revert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
