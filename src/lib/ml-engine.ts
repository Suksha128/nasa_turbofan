import { HealthStatus, SensorReading } from './types';

/**
 * Sensor operational baselines and normalization constants for C-MAPSS FD001
 * Baseline nominal operating point (healthy):
 * s_2 (LPC Outlet Temp): ~642.0 K (operational window ~641.0 - 645.0 K)
 * s_3 (HPC Outlet Temp): ~1575.0 K (operational window ~1570.0 - 1615.0 K)
 * s_4 (LPT Outlet Temp): ~1395.0 K (operational window ~1390.0 - 1430.0 K)
 * s_11 (Static HPC Pressure): ~48.20 psia (operational window ~46.5 - 48.5 psia)
 * s_12 (Fuel flow to static pressure): ~518.5 (operational window ~518.0 - 524.0)
 */
export const SENSOR_BASELINES = {
  s_2: { min: 641.0, baseline: 642.1, max: 645.0, name: 'LPC Outlet Temp', unit: 'K' },
  s_3: { min: 1570.0, baseline: 1575.0, max: 1615.0, name: 'HPC Outlet Temp', unit: 'K' },
  s_4: { min: 1390.0, baseline: 1395.0, max: 1430.0, name: 'LPT Outlet Temp', unit: 'K' },
  s_11: { min: 46.5, baseline: 48.20, max: 48.5, name: 'HPC Static Pressure', unit: 'psia' },
  s_12: { min: 518.0, baseline: 518.5, max: 524.0, name: 'Fuel Flow / Ps30 Ratio', unit: 'pps/psia' },
};

/**
 * NASA Asymmetric Scoring Function
 * Evaluates prediction error d = yPred - yTrue.
 * Heavily penalizes late predictions (d > 0) due to catastrophic safety risk in flight operations.
 */
export function calculateNasaScore(yTrue: number, yPred: number): number {
  const d = yPred - yTrue;
  if (d < 0) {
    return Math.exp(-d / 13) - 1; // Early prediction penalty
  } else {
    return Math.exp(d / 10) - 1;  // Late prediction penalty (steeper exponential curve)
  }
}

/**
 * Computes symmetric Root Mean Square Error (for comparison with NASA score)
 */
export function calculateMsePenalty(yTrue: number, yPred: number): number {
  const d = yPred - yTrue;
  return d * d;
}

export interface InferenceInput {
  time_cycles: number;
  currentSensors: SensorReading;
  historySensors?: SensorReading[]; // Prior cycles for 5-cycle rolling computation
}

export interface InferenceOutput {
  predictedRul: number;
  healthScore: number;         // 0 - 100%
  status: HealthStatus;
  riskScore: number;           // 0 - 100%
  rollingAverages: SensorReading;
  primaryRiskFactor: string;
  recommendedAction: string;
  degradationSeverity: number; // 0 to 1
  flightClearance: 'UNRESTRICTED' | 'CONDITIONAL_RESTRICTED' | 'GROUNDED';
}

/**
 * Helper to compute 5-cycle rolling averages from history and current reading
 */
export function computeRollingAverages(
  current: SensorReading,
  history: SensorReading[] = []
): SensorReading {
  const window = [...history.slice(-4), current];
  const count = window.length;

  const sum = window.reduce(
    (acc, val) => ({
      s_2: acc.s_2 + (val.s_2 ?? SENSOR_BASELINES.s_2.baseline),
      s_3: acc.s_3 + (val.s_3 ?? SENSOR_BASELINES.s_3.baseline),
      s_4: acc.s_4 + (val.s_4 ?? SENSOR_BASELINES.s_4.baseline),
      s_11: acc.s_11 + (val.s_11 ?? SENSOR_BASELINES.s_11.baseline),
      s_12: acc.s_12 + (val.s_12 ?? SENSOR_BASELINES.s_12.baseline),
    }),
    { s_2: 0, s_3: 0, s_4: 0, s_11: 0, s_12: 0 }
  );

  return {
    s_2: +(sum.s_2 / count).toFixed(2),
    s_3: +(sum.s_3 / count).toFixed(2),
    s_4: +(sum.s_4 / count).toFixed(2),
    s_11: +(sum.s_11 / count).toFixed(3),
    s_12: +(sum.s_12 / count).toFixed(2),
  };
}

/**
 * Core Surrogate ML Inference Model (C-MAPSS FD001 Surrogate)
 * Incorporates piecewise linear wear degradation capped at 125 cycles.
 * Scales down RUL inversely proportional to normalized temperature rise in s_3 and pressure drop in s_11.
 */
export function predictRul(input: InferenceInput): InferenceOutput {
  const { time_cycles, currentSensors, historySensors = [] } = input;
  const rolling = computeRollingAverages(currentSensors, historySensors);

  // 1. Piecewise Linear Base: Capped at 125 cycles during early healthy stage
  const RUL_MAX = 125;
  const KNEE_CYCLE_EST = 60; // Degradation onset boundary in FD001

  // 2. Normalized thermodynamic degradation metrics
  // HPC Outlet Temp (s_3) rises as compressor efficiency drops
  const deltaT30 = Math.max(0, (rolling.s_3 - SENSOR_BASELINES.s_3.baseline) / (SENSOR_BASELINES.s_3.max - SENSOR_BASELINES.s_3.baseline));
  // Static HPC Pressure (s_11) drops due to blade clearance wear
  const deltaPs30 = Math.max(0, (SENSOR_BASELINES.s_11.baseline - rolling.s_11) / (SENSOR_BASELINES.s_11.baseline - SENSOR_BASELINES.s_11.min));
  // LPT Temp (s_4) rises with turbine thermal loading
  const deltaT50 = Math.max(0, (rolling.s_4 - SENSOR_BASELINES.s_4.baseline) / (SENSOR_BASELINES.s_4.max - SENSOR_BASELINES.s_4.baseline));
  // Fuel-to-static ratio (s_12) increases to sustain requested thrust
  const deltaPhi = Math.max(0, (rolling.s_12 - SENSOR_BASELINES.s_12.baseline) / (SENSOR_BASELINES.s_12.max - SENSOR_BASELINES.s_12.baseline));

  // Combined physical degradation severity (0.0 to 1.0+)
  const degradationFactor = (
    0.35 * Math.min(1.2, deltaPs30) +
    0.30 * Math.min(1.2, deltaT30) +
    0.20 * Math.min(1.2, deltaT50) +
    0.15 * Math.min(1.2, deltaPhi)
  );

  let rawRul: number;

  if (time_cycles <= KNEE_CYCLE_EST && degradationFactor < 0.15) {
    // Healthy baseline stage: piecewise flat at 125 cycles
    rawRul = RUL_MAX;
  } else {
    // Linear degradation baseline beyond knee cycle
    const cycleProgress = Math.max(0, time_cycles - KNEE_CYCLE_EST);
    // Typical FD001 total life is ~190 - 230 cycles, meaning ~130-160 cycles of degradation
    const expectedDegradationCycles = 145;
    const cycleBasedRul = Math.max(0, RUL_MAX * (1 - cycleProgress / expectedDegradationCycles));

    // Physics-informed ML scaling: degradation from s_3 and s_11 accelerates wear
    // If thermodynamic indicators are high, RUL drops faster
    const sensorPenaltyMultiplier = 1 + 0.85 * degradationFactor;
    const sensorAdjustedRul = RUL_MAX * Math.max(0, 1 - (degradationFactor * 1.05));

    // Ensemble blend between temporal cycle progression and physical sensor degradation
    rawRul = 0.45 * cycleBasedRul + 0.55 * sensorAdjustedRul;

    // Further depress RUL if severe thermal limits are exceeded
    if (rolling.s_3 > 1605 || rolling.s_11 < 46.9) {
      rawRul = Math.min(rawRul, 15);
    }
  }

  // Clamped integer output [0, 125]
  const predictedRul = Math.max(0, Math.min(RUL_MAX, Math.round(rawRul)));

  // Determine status and health score
  let status: HealthStatus;
  let flightClearance: 'UNRESTRICTED' | 'CONDITIONAL_RESTRICTED' | 'GROUNDED';
  let recommendedAction: string;

  if (predictedRul > 50) {
    status = 'NOMINAL';
    flightClearance = 'UNRESTRICTED';
    recommendedAction = 'Cleared for Long-Haul Flight Operations / Routine A-Check';
  } else if (predictedRul > 20) {
    status = 'WARNING';
    flightClearance = 'CONDITIONAL_RESTRICTED';
    recommendedAction = 'Schedule Borescope Inspection / Stage JIT HPC Blades & Seals';
  } else {
    status = 'CRITICAL';
    flightClearance = 'GROUNDED';
    recommendedAction = 'AOG (Aircraft On Ground) / Ground Engine & Emergency Overhaul';
  }

  // Health Score from 0 to 100
  const healthScore = Math.max(0, Math.min(100, Math.round((predictedRul / RUL_MAX) * 100)));
  const riskScore = 100 - healthScore;

  // Identify Primary Risk Factor
  let primaryRiskFactor = 'Nominal Aerodynamic Performance';
  if (status !== 'NOMINAL') {
    const scores = [
      { name: 'HPC Static Pressure Loss (s_11)', val: deltaPs30 },
      { name: 'HPC Thermal Creep & EGT Rise (s_3)', val: deltaT30 },
      { name: 'LPT Exhaust Gas Over-Temp (s_4)', val: deltaT50 },
      { name: 'Fuel-to-Pressure Ratio Drift (s_12)', val: deltaPhi },
    ];
    scores.sort((a, b) => b.val - a.val);
    primaryRiskFactor = scores[0].name;
  }

  return {
    predictedRul,
    healthScore,
    status,
    riskScore,
    rollingAverages: rolling,
    primaryRiskFactor,
    recommendedAction,
    degradationSeverity: Math.min(1, +degradationFactor.toFixed(3)),
    flightClearance,
  };
}

/**
 * Sensor metadata reference for UI displays, tooltips, and explainability
 */
export const SENSOR_METADATA: Record<string, { code: string; name: string; unit: string; importance: number; desc: string }> = {
  s_11: {
    code: 'Ps30',
    name: 'Static HPC Outlet Pressure',
    unit: 'psia',
    importance: 0.36,
    desc: 'Direct indicator of high-pressure compressor stage aerodynamic loading and tip clearance wear.',
  },
  s_4: {
    code: 'T50',
    name: 'LPT Outlet Temperature',
    unit: 'K',
    importance: 0.27,
    desc: 'Exhaust gas temperature reflecting core thermal efficiency and turbine blade erosion.',
  },
  s_3: {
    code: 'T30',
    name: 'HPC Outlet Temperature',
    unit: 'K',
    importance: 0.21,
    desc: 'Compressor discharge air temperature. Climbs significantly as compressor blades suffer fouling/rubbing.',
  },
  s_2: {
    code: 'T24',
    name: 'LPC Outlet Temperature',
    unit: 'K',
    importance: 0.10,
    desc: 'Low pressure compressor temperature before high pressure compression stages.',
  },
  s_12: {
    code: 'phi',
    name: 'Fuel Flow to Ps30 Ratio',
    unit: 'pps/psia',
    importance: 0.06,
    desc: 'Fuel delivery ratio required to sustain target turbine rotational speeds under degraded core conditions.',
  },
};
