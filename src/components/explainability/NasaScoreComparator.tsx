'use client';

import React, { useState, useMemo } from 'react';
import { calculateNasaScore } from '@/lib/ml-engine';
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
import { Scale, ShieldAlert, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';

export function NasaScoreComparator() {
  const [testDelta, setTestDelta] = useState<number>(10);

  // Generate comparison curve for d between -30 and +30 cycles
  const curveData = useMemo(() => {
    const points = [];
    for (let d = -30; d <= 30; d += 2) {
      const nasa = d < 0 ? Math.exp(-d / 13) - 1 : Math.exp(d / 10) - 1;
      // Scaled quadratic MSE for comparable visualization on the same scale
      const normalizedMse = (d * d) / 45;

      points.push({
        d,
        nasaPenalty: +nasa.toFixed(2),
        msePenalty: +normalizedMse.toFixed(2),
      });
    }
    return points;
  }, []);

  const currentNasaPenalty = testDelta < 0 
    ? Math.exp(-testDelta / 13) - 1 
    : Math.exp(testDelta / 10) - 1;

  const oppositeDelta = -testDelta;
  const oppositeNasaPenalty = oppositeDelta < 0 
    ? Math.exp(-oppositeDelta / 13) - 1 
    : Math.exp(oppositeDelta / 10) - 1;

  return (
    <div className="telemetry-card p-5 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              NASA Asymmetric Scoring Function vs. Symmetric MSE
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Penalty formulation: S_i = exp(-d_i / 13) - 1 for early (d &lt; 0), exp(d_i / 10) - 1 for late (d &ge; 0).
          </p>
        </div>
        <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400">
          Aviation Safety Asymmetry: exp(d/10) vs exp(-d/13)
        </div>
      </div>

      {/* Interactive Delta Scrubber Slider */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase text-slate-300">
              Test Prediction Error Delta (d = &#375; - y)
            </span>
          </div>
          <div className="flex items-baseline space-x-2 font-mono">
            <span className={`text-xl font-black ${
              testDelta > 0 ? 'text-rose-400' : testDelta < 0 ? 'text-cyan-400' : 'text-slate-300'
            }`}>
              {testDelta > 0 ? `+${testDelta}` : testDelta}
            </span>
            <span className="text-xs text-slate-400">Cycles Error</span>
          </div>
        </div>

        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={testDelta}
          onChange={(e) => setTestDelta(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-cyan-400">-30 Cycles (Early Prediction / Safe Buffer)</span>
          <span className="text-slate-500">0 (Exact Prediction)</span>
          <span className="text-rose-400">+30 Cycles (Late Prediction / Critical Risk)</span>
        </div>

        {/* Live Comparison Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Active Error Penalty */}
          <div className={`p-3 rounded-lg border ${
            testDelta > 0 
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' 
              : 'bg-cyan-950/30 border-cyan-800/60 text-cyan-200'
          }`}>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">
              Active Error ({testDelta > 0 ? `Late by +${testDelta} Cycles` : `Early by ${Math.abs(testDelta)} Cycles`})
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono">
                {currentNasaPenalty.toFixed(2)}
              </span>
              <span className="text-xs opacity-80">NASA Penalty Score</span>
            </div>
            <p className="text-[11px] mt-1.5 opacity-90 leading-snug">
              {testDelta > 0
                ? 'High danger: Aircraft is dispatched assuming cycles remain when engine is actually closer to mechanical failure.'
                : 'Safe margin: Maintenance will occur slightly early, sacrificing minor life but guaranteeing flight airworthiness.'}
            </p>
          </div>

          {/* Symmetrical Equivalent Comparison */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
              Inverse Mirror Error ({oppositeDelta > 0 ? `+${oppositeDelta}` : oppositeDelta} Cycles)
            </div>
            <div className="flex items-baseline space-x-2 font-mono">
              <span className="text-2xl font-black text-slate-200">
                {oppositeNasaPenalty.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">NASA Penalty Score</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              {testDelta !== 0 && (
                <span>
                  Late prediction penalty is{' '}
                  <strong className="text-rose-400 font-mono">
                    {testDelta > 0
                      ? (currentNasaPenalty / Math.max(0.01, oppositeNasaPenalty)).toFixed(2)
                      : (oppositeNasaPenalty / Math.max(0.01, currentNasaPenalty)).toFixed(2)}
                    x higher
                  </strong>{' '}
                  than early prediction.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Plot */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curveData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="d"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Error Delta d = yPred - yTrue (Cycles)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              label={{ value: 'Penalty Cost S', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
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
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />

            {/* Zero Error Center Line */}
            <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />

            {/* Current Test Delta Marker */}
            <ReferenceLine
              x={testDelta}
              stroke="#06b6d4"
              strokeWidth={2}
              label={{ value: `Selected: ${testDelta}`, fill: '#06b6d4', fontSize: 10, position: 'top' }}
            />

            {/* Curves */}
            <Line
              type="monotone"
              dataKey="nasaPenalty"
              name="NASA Asymmetric Penalty (Aviation Safety)"
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="msePenalty"
              name="Symmetric Quadratic Loss (MSE Normalized)"
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Technical Rationale */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
        <h4 className="font-bold text-slate-100 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Why Commercial Aviation Mandates Asymmetric Loss</span>
        </h4>
        <p>
          In typical regression problems, positive and negative residuals are penalized identically (MSE = d²). However, in commercial turbofan reliability, an overestimation (d &gt; 0) means dispatching an aircraft on a transatlantic route when its high-pressure compressor is already on the verge of blade fatigue, causing an uncontained failure or forced diversion (&gt; $1.5M incident cost). An underestimation (d &lt; 0) merely triggers early maintenance at the hangar, which is far safer. The NASA C-MAPSS asymmetric loss guarantees models converge toward safe, conservative predictions.
        </p>
      </div>
    </div>
  );
}
