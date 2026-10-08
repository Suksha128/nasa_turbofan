// Standalone Node Verification Script for C-MAPSS FD001 Domain Logic

function calculateNasaScore(yTrue, yPred) {
  const d = yPred - yTrue;
  return d < 0 ? Math.exp(-d / 13) - 1 : Math.exp(d / 10) - 1;
}

const SENSOR_BASELINES = {
  s_2: { min: 641.0, baseline: 642.1, max: 645.0, name: 'LPC Outlet Temp', unit: 'K' },
  s_3: { min: 1570.0, baseline: 1575.0, max: 1615.0, name: 'HPC Outlet Temp', unit: 'K' },
  s_4: { min: 1390.0, baseline: 1395.0, max: 1430.0, name: 'LPT Outlet Temp', unit: 'K' },
  s_11: { min: 46.5, baseline: 48.20, max: 48.5, name: 'HPC Static Pressure', unit: 'psia' },
  s_12: { min: 518.0, baseline: 518.5, max: 524.0, name: 'Fuel Flow / Ps30 Ratio', unit: 'pps/psia' },
};

function computeRollingAverages(current, history = []) {
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

function predictRul(input) {
  const { time_cycles, currentSensors, historySensors = [] } = input;
  const rolling = computeRollingAverages(currentSensors, historySensors);

  const RUL_MAX = 125;
  const KNEE_CYCLE_EST = 60;

  const deltaT30 = Math.max(0, (rolling.s_3 - SENSOR_BASELINES.s_3.baseline) / (SENSOR_BASELINES.s_3.max - SENSOR_BASELINES.s_3.baseline));
  const deltaPs30 = Math.max(0, (SENSOR_BASELINES.s_11.baseline - rolling.s_11) / (SENSOR_BASELINES.s_11.baseline - SENSOR_BASELINES.s_11.min));
  const deltaT50 = Math.max(0, (rolling.s_4 - SENSOR_BASELINES.s_4.baseline) / (SENSOR_BASELINES.s_4.max - SENSOR_BASELINES.s_4.baseline));
  const deltaPhi = Math.max(0, (rolling.s_12 - SENSOR_BASELINES.s_12.baseline) / (SENSOR_BASELINES.s_12.max - SENSOR_BASELINES.s_12.baseline));

  const degradationFactor = (
    0.35 * Math.min(1.2, deltaPs30) +
    0.30 * Math.min(1.2, deltaT30) +
    0.20 * Math.min(1.2, deltaT50) +
    0.15 * Math.min(1.2, deltaPhi)
  );

  let rawRul;

  if (time_cycles <= KNEE_CYCLE_EST && degradationFactor < 0.15) {
    rawRul = RUL_MAX;
  } else {
    const cycleProgress = Math.max(0, time_cycles - KNEE_CYCLE_EST);
    const expectedDegradationCycles = 145;
    const cycleBasedRul = Math.max(0, RUL_MAX * (1 - cycleProgress / expectedDegradationCycles));
    const sensorAdjustedRul = RUL_MAX * Math.max(0, 1 - (degradationFactor * 1.05));
    rawRul = 0.45 * cycleBasedRul + 0.55 * sensorAdjustedRul;

    if (rolling.s_3 > 1605 || rolling.s_11 < 46.9) {
      rawRul = Math.min(rawRul, 15);
    }
  }

  const predictedRul = Math.max(0, Math.min(RUL_MAX, Math.round(rawRul)));

  let status;
  if (predictedRul > 50) status = 'NOMINAL';
  else if (predictedRul > 20) status = 'WARNING';
  else status = 'CRITICAL';

  return { predictedRul, status, rollingAverages: rolling, degradationFactor };
}

console.log('--- 1. NASA Asymmetric Loss Function ---');
const d0 = calculateNasaScore(50, 50);
console.log(`d = 0: score = ${d0.toFixed(4)} (Expected: 0.0000)`);
if (Math.abs(d0) > 1e-4) throw new Error('NASA score for d=0 should be 0');

const d_early_5 = calculateNasaScore(50, 45); // d = -5
const d_late_5 = calculateNasaScore(50, 55);  // d = +5
console.log(`d = -5 (early): ${d_early_5.toFixed(4)}, d = +5 (late): ${d_late_5.toFixed(4)}`);
if (d_late_5 <= d_early_5) throw new Error('Late penalty must be greater than early penalty');

const d_early_20 = calculateNasaScore(50, 30); // d = -20
const d_late_20 = calculateNasaScore(50, 70);  // d = +20
console.log(`d = -20 (early): ${d_early_20.toFixed(4)}, d = +20 (late): ${d_late_20.toFixed(4)}`);
console.log(`Late vs Early Ratio at d=20: ${(d_late_20 / d_early_20).toFixed(2)}x`);
if (d_late_20 < 1.7 * d_early_20) throw new Error('Late penalty must be significantly higher than early penalty');

console.log('\n--- 2. Piecewise Linear Surrogate ML Model ---');
const earlyPred = predictRul({
  time_cycles: 25,
  currentSensors: {
    s_2: SENSOR_BASELINES.s_2.baseline,
    s_3: SENSOR_BASELINES.s_3.baseline,
    s_4: SENSOR_BASELINES.s_4.baseline,
    s_11: SENSOR_BASELINES.s_11.baseline,
    s_12: SENSOR_BASELINES.s_12.baseline,
  },
});
console.log(`Cycle 25 (Nominal): Predicted RUL = ${earlyPred.predictedRul}, Status = ${earlyPred.status}`);
if (earlyPred.predictedRul !== 125) throw new Error('Early engine must be capped at 125 cycles');
if (earlyPred.status !== 'NOMINAL') throw new Error('Early engine must be NOMINAL');

const midPred = predictRul({
  time_cycles: 120,
  currentSensors: {
    s_2: 643.5,
    s_3: 1595.0,
    s_4: 1412.0,
    s_11: 47.45,
    s_12: 520.8,
  },
});
console.log(`Cycle 120 (Mid-Life): Predicted RUL = ${midPred.predictedRul}, Status = ${midPred.status}`);

const critPred = predictRul({
  time_cycles: 195,
  currentSensors: {
    s_2: 644.8,
    s_3: 1613.2,
    s_4: 1428.5,
    s_11: 46.70,
    s_12: 523.9,
  },
});
console.log(`Cycle 195 (Severe Wear): Predicted RUL = ${critPred.predictedRul}, Status = ${critPred.status}`);
if (critPred.status !== 'CRITICAL') throw new Error('Severe wear engine must be CRITICAL');
if (critPred.predictedRul > 20) throw new Error('Critical engine RUL must be <= 20');

console.log('\nAll Mathematical and ML Domain Tests Passed Successfully!');
