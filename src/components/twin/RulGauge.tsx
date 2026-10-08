'use client';

import React from 'react';
import { usePdm } from '@/lib/store';
import { calculateNasaScore, calculateMsePenalty } from '@/lib/ml-engine';
import { StatusBadge } from '@/components/common/Badge';
import { Gauge, ShieldAlert, Sparkles, Scale, Info } from 'lucide-react';

export function RulGauge() {
  const { currentTelemetryPoint, selectedEngine } = usePdm();
  const { predictedRul, trueRul = 0, status, riskScore } = currentTelemetryPoint;

  // Max piecewise target is 125 cycles
  const maxDisplayRul = 125;
  const percentage = Math.max(0, Math.min(100, (predictedRul / maxDisplayRul) * 100));

  // Circular gauge SVG parameters
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Use a 270-degree arc for a speedometer look
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  // Color selection
  const strokeColor =
    status === 'CRITICAL'
      ? '#ef4444' // red
      : status === 'WARNING'
      ? '#f59e0b' // amber
      : '#10b981'; // emerald

  const nasaScore = calculateNasaScore(trueRul, predictedRul);
  const mseError = calculateMsePenalty(trueRul, predictedRul);
  const delta = predictedRul - trueRul;

  return (
    <div className="telemetry-card p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Background glow based on status */}
      <div
        className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: strokeColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Predicted Remaining Useful Life (RUL)
          </h3>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      {/* Speedometer Gauge Visual */}
      <div className="flex flex-col items-center justify-center my-3 relative">
        <div className="relative w-52 h-44 flex items-center justify-center">
          <svg className="w-52 h-52 -rotate-[135deg] transform" viewBox="0 0 200 200">
            {/* Background Arc Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="#1e293b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Dynamic Value Arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Central Readout */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span
              className="text-4xl sm:text-5xl font-black font-mono tracking-tight transition-colors duration-300"
              style={{ color: strokeColor }}
            >
              {predictedRul}
            </span>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Cycles Left
            </span>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Target Cap: 125 cyc
            </div>
          </div>
        </div>

        {/* Status band label */}
        <div className="flex items-center space-x-4 text-xs font-mono text-slate-400 -mt-2">
          <span>0 (Ground)</span>
          <span className="text-amber-400">20 (Critical)</span>
          <span className="text-yellow-400">50 (Warning)</span>
          <span className="text-emerald-400">125 (Max)</span>
        </div>
      </div>

      {/* NASA Asymmetric Loss & Error Metrics */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
        {/* Error Delta */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>Prediction Delta (&#375; - y)</span>
            <Scale className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-base font-extrabold font-mono ${
              delta === 0 ? 'text-slate-300' : delta > 0 ? 'text-rose-400' : 'text-cyan-400'
            }`}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
            <span className="text-[10px] text-slate-400">
              {delta > 0 ? '(Late Prediction)' : delta < 0 ? '(Early Prediction)' : '(Exact)'}
            </span>
          </div>
        </div>

        {/* NASA Loss Penalty */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>NASA Penalty Score</span>
            <Info className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-base font-extrabold font-mono ${
              nasaScore > 10 ? 'text-rose-400' : 'text-slate-200'
            }`}>
              {nasaScore.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              (MSE: {mseError.toFixed(0)})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
