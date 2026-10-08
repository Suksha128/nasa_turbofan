'use client';

import React, { useState, useMemo } from 'react';
import { usePdm } from '@/lib/store';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  Legend
} from 'recharts';
import { Activity, Layers, Sparkles, Filter } from 'lucide-react';
import { SENSOR_BASELINES } from '@/lib/ml-engine';

export function SensorDegradationPlot() {
  const { historicalTrajectory, selectedEngine, currentCycle } = usePdm();

  // Mode: 'normalized' (all 5 sensors scaled 0-100%) vs 'single' (specific physical sensor)
  const [viewMode, setViewMode] = useState<'normalized' | 'single'>('normalized');
  const [selectedSensor, setSelectedSensor] = useState<'s_11' | 's_3' | 's_4' | 's_2' | 's_12'>('s_11');

  // Subsample data if trajectory is long to keep charting buttery smooth
  const chartData = useMemo(() => {
    if (!historicalTrajectory || historicalTrajectory.length === 0) return [];

    // Map each point with raw and normalized versions
    return historicalTrajectory.map((p) => {
      // Normalization formula: 0% = baseline, 100% = critical limit
      const norm_s11 = Math.max(0, Math.min(100, ((SENSOR_BASELINES.s_11.baseline - p.s_11) / (SENSOR_BASELINES.s_11.baseline - SENSOR_BASELINES.s_11.min)) * 100));
      const norm_s3 = Math.max(0, Math.min(100, ((p.s_3 - SENSOR_BASELINES.s_3.baseline) / (SENSOR_BASELINES.s_3.max - SENSOR_BASELINES.s_3.baseline)) * 100));
      const norm_s4 = Math.max(0, Math.min(100, ((p.s_4 - SENSOR_BASELINES.s_4.baseline) / (SENSOR_BASELINES.s_4.max - SENSOR_BASELINES.s_4.baseline)) * 100));
      const norm_s2 = Math.max(0, Math.min(100, ((p.s_2 - SENSOR_BASELINES.s_2.baseline) / (SENSOR_BASELINES.s_2.max - SENSOR_BASELINES.s_2.baseline)) * 100));
      const norm_s12 = Math.max(0, Math.min(100, ((p.s_12 - SENSOR_BASELINES.s_12.baseline) / (SENSOR_BASELINES.s_12.max - SENSOR_BASELINES.s_12.baseline)) * 100));

      return {
        cycle: p.cycle,
        predictedRul: p.predictedRul,
        trueRul: p.trueRul,
        // Raw values
        s_11: p.s_11,
        rolling_s11: p.rolling_s11,
        s_3: p.s_3,
        rolling_s3: p.rolling_s3,
        s_4: p.s_4,
        rolling_s4: p.rolling_s4,
        s_2: p.s_2,
        rolling_s2: p.rolling_s2,
        s_12: p.s_12,
        rolling_s12: p.rolling_s12,
        // Normalized wear % (0 to 100)
        norm_s11: +norm_s11.toFixed(1),
        norm_s3: +norm_s3.toFixed(1),
        norm_s4: +norm_s4.toFixed(1),
        norm_s2: +norm_s2.toFixed(1),
        norm_s12: +norm_s12.toFixed(1),
      };
    });
  }, [historicalTrajectory]);

  const kneePoint = selectedEngine?.kneePointCycle || 65;

  return (
    <div className="telemetry-card p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Sensor Degradation Time-Series Visualizer
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Trajectories across operating flight cycles highlighting wear knee-point and failure threshold triggers.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('normalized')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === 'normalized'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Multi-Sensor Normalized (0-100%)
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                viewMode === 'single'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Physical Channel
            </button>
          </div>

          {viewMode === 'single' && (
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="s_11">s_11: HPC Static Pressure (psia)</option>
              <option value="s_3">s_3: HPC Outlet Temp (K)</option>
              <option value="s_4">s_4: LPT Outlet Temp (K)</option>
              <option value="s_2">s_2: LPC Outlet Temp (K)</option>
              <option value="s_12">s_12: Fuel Ratio (pps/psia)</option>
            </select>
          )}
        </div>
      </div>

      {/* Recharts Plot */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="cycle"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Flight Cycles', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={viewMode === 'normalized' ? [0, 110] : ['auto', 'auto']}
              label={{
                value: viewMode === 'normalized' ? 'Degradation Severity (%)' : SENSOR_BASELINES[selectedSensor].unit,
                angle: -90,
                position: 'insideLeft',
                fill: '#64748b',
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#334155',
                borderRadius: '0.5rem',
                fontSize: '11px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {/* Wear Knee-Point Vertical Reference Line */}
            {kneePoint <= currentCycle && (
              <ReferenceLine
                x={kneePoint}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Knee Onset (Cyc ${kneePoint})`,
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'top',
                }}
              />
            )}

            {/* Warning / Critical Threshold Lines */}
            {viewMode === 'normalized' ? (
              <>
                <ReferenceLine
                  y={60}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{ value: 'Warning Alert Limit (60%)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={85}
                  stroke="#ef4444"
                  strokeDasharray="3 3"
                  label={{ value: 'Critical Safety Limit (85%)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                />

                {/* 5 Normalized Sensor Lines */}
                <Line
                  type="monotone"
                  dataKey="norm_s11"
                  name="s_11 (HPC Pressure Loss %)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="norm_s3"
                  name="s_3 (HPC Temp Rise %)"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="norm_s4"
                  name="s_4 (LPT Temp Rise %)"
                  stroke="#ec4899"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="norm_s2"
                  name="s_2 (LPC Temp Rise %)"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="norm_s12"
                  name="s_12 (Fuel Ratio Climb %)"
                  stroke="#a855f7"
                  strokeWidth={1.5}
                  dot={false}
                />
              </>
            ) : (
              <>
                {/* Single Physical Sensor View: Raw + 5-Cycle Rolling */}
                <Line
                  type="monotone"
                  dataKey={selectedSensor}
                  name={`Instantaneous ${selectedSensor.toUpperCase()}`}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey={`rolling_${selectedSensor}`}
                  name={`5-Cycle Rolling Mean (${selectedSensor.toUpperCase()})`}
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Degradation Insights Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Knee-Point marks the transition from healthy baseline to accelerated aerothermal degradation.</span>
        </div>
        <div className="font-mono text-cyan-400">
          Current: Cycle {currentCycle} / {selectedEngine?.maxCycle}
        </div>
      </div>
    </div>
  );
}
