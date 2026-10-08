import { EngineUnit, SensorReading, TelemetryPoint } from './types';
import { predictRul, SENSOR_BASELINES } from './ml-engine';

// Deterministic Pseudo-random Number Generator (LCG) for reproducible, realistic fleet telemetry
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Box-Muller transform for Gaussian noise
function gaussianRandom(rand: () => number, mean = 0, stdev = 1): number {
  const u1 = Math.max(1e-6, rand());
  const u2 = rand();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdev + mean;
}

const AIRLINES = ['AeroGlobal Airways', 'SkyFleet Cargo', 'Pacific Star Express', 'TransContinental', 'Apex Aero'];
const AIRCRAFT_MODELS = ['Boeing 777-200ER (GE90)', 'Airbus A330-300 (Trent 700)', 'Boeing 767-300ER (CF6-80C2)', 'Boeing 737-800 (CFM56-7B)'];

// Pre-calculated lifespan distribution matching C-MAPSS FD001 (min 128, mean ~206, max 362)
const FD001_LIFESPANS = [
  192, 287, 179, 189, 269, 188, 259, 150, 201, 198,
  199, 185, 166, 180, 207, 196, 176, 195, 258, 234,
  195, 202, 168, 147, 230, 199, 156, 221, 163, 194,
  189, 201, 289, 195, 181, 158, 170, 193, 128, 179,
  216, 196, 207, 192, 158, 256, 214, 181, 215, 198,
  213, 222, 195, 256, 194, 137, 163, 208, 214, 218,
  188, 180, 194, 283, 153, 197, 187, 199, 197, 137,
  208, 213, 289, 166, 196, 205, 154, 231, 199, 185,
  240, 214, 187, 267, 188, 206, 178, 213, 217, 154,
  362, 184, 155, 162, 213, 199, 214, 156, 185, 200
];

/**
 * Generates the full run-to-failure telemetry history for an engine unit
 */
export function generateEngineHistory(unitId: number, maxCycle: number, kneeCycle: number): TelemetryPoint[] {
  const rand = seededRandom(unitId * 7919);
  const history: TelemetryPoint[] = [];

  for (let cycle = 1; cycle <= maxCycle; cycle++) {
    // Determine wear progression: zero wear prior to kneeCycle, progressive power-law wear after kneeCycle
    const wearProgress = cycle <= kneeCycle 
      ? 0 
      : Math.pow((cycle - kneeCycle) / (maxCycle - kneeCycle), 1.35);

    // Dynamic sensor values with thermal/pressure degradation physics + Gaussian measurement noise
    const s_2_noise = gaussianRandom(rand, 0, 0.12);
    const s_3_noise = gaussianRandom(rand, 0, 0.75);
    const s_4_noise = gaussianRandom(rand, 0, 0.60);
    const s_11_noise = gaussianRandom(rand, 0, 0.03);
    const s_12_noise = gaussianRandom(rand, 0, 0.15);

    // Physical trajectory:
    // s_2: 642.1 -> 644.6 K
    const s_2 = +(SENSOR_BASELINES.s_2.baseline + 2.5 * wearProgress + s_2_noise).toFixed(2);
    // s_3: 1575.0 -> 1613.5 K (massive thermal climb in degraded HPC)
    const s_3 = +(SENSOR_BASELINES.s_3.baseline + 38.5 * wearProgress + s_3_noise).toFixed(2);
    // s_4: 1395.0 -> 1428.0 K
    const s_4 = +(SENSOR_BASELINES.s_4.baseline + 33.0 * wearProgress + s_4_noise).toFixed(2);
    // s_11: 48.20 -> 46.75 psia (pressure drop due to tip clearance leak)
    const s_11 = +(SENSOR_BASELINES.s_11.baseline - 1.45 * wearProgress + s_11_noise).toFixed(3);
    // s_12: 518.5 -> 523.8 (fuel/pressure ratio climb)
    const s_12 = +(SENSOR_BASELINES.s_12.baseline + 5.3 * wearProgress + s_12_noise).toFixed(2);

    const currentReading: SensorReading = { s_2, s_3, s_4, s_11, s_12 };
    const priorReadings = history.slice(-4).map((h) => ({
      s_2: h.s_2,
      s_3: h.s_3,
      s_4: h.s_4,
      s_11: h.s_11,
      s_12: h.s_12,
    }));

    const inference = predictRul({
      time_cycles: cycle,
      currentSensors: currentReading,
      historySensors: priorReadings,
    });

    const trueRul = Math.max(0, maxCycle - cycle);

    history.push({
      cycle,
      s_2,
      s_3,
      s_4,
      s_11,
      s_12,
      predictedRul: inference.predictedRul,
      trueRul,
      rolling_s2: inference.rollingAverages.s_2,
      rolling_s3: inference.rollingAverages.s_3,
      rolling_s4: inference.rollingAverages.s_4,
      rolling_s11: inference.rollingAverages.s_11,
      rolling_s12: inference.rollingAverages.s_12,
      riskScore: inference.riskScore,
      status: inference.status,
      primaryStress: inference.primaryRiskFactor,
    });
  }

  return history;
}

/**
 * Generates the full 100-engine fleet snapshot for the dashboard
 */
export function generateFleet(): EngineUnit[] {
  const fleet: EngineUnit[] = [];

  for (let id = 1; id <= 100; id++) {
    const maxCycle = FD001_LIFESPANS[id - 1];
    // Knee cycle typically occurs between cycle 55 and 85
    const kneeCycle = Math.min(maxCycle - 45, 55 + (id * 13) % 30);

    // Target status distribution for realistic enterprise fleet management:
    // Units 1-12: CRITICAL (near failure, RUL <= 20)
    // Units 13-35: WARNING (approaching maintenance threshold, 20 < RUL <= 50)
    // Units 36-100: NOMINAL (healthy, RUL > 50)
    let currentCycle: number;
    if (id <= 12) {
      // Critical engines (e.g. 5 to 19 cycles remaining)
      currentCycle = Math.max(1, maxCycle - (4 + (id % 16)));
    } else if (id <= 35) {
      // Warning engines (22 to 49 cycles remaining)
      currentCycle = Math.max(1, maxCycle - (22 + (id % 28)));
    } else {
      // Nominal engines (52 to 125+ cycles remaining)
      const targetRul = 52 + ((id * 17) % 75);
      currentCycle = Math.max(1, Math.min(maxCycle - 52, maxCycle - targetRul));
    }

    const fullHistory = generateEngineHistory(id, maxCycle, kneeCycle);
    const activeHistory = fullHistory.slice(0, currentCycle);
    const currentPoint = activeHistory[activeHistory.length - 1];

    const currentSensors: SensorReading = {
      s_2: currentPoint.s_2,
      s_3: currentPoint.s_3,
      s_4: currentPoint.s_4,
      s_11: currentPoint.s_11,
      s_12: currentPoint.s_12,
    };

    const rollingSensors: SensorReading = {
      s_2: currentPoint.rolling_s2,
      s_3: currentPoint.rolling_s3,
      s_4: currentPoint.rolling_s4,
      s_11: currentPoint.rolling_s11,
      s_12: currentPoint.rolling_s12,
    };

    const inference = predictRul({
      time_cycles: currentCycle,
      currentSensors,
      historySensors: activeHistory.slice(-5).map((h) => ({
        s_2: h.s_2,
        s_3: h.s_3,
        s_4: h.s_4,
        s_11: h.s_11,
        s_12: h.s_12,
      })),
    });

    const tailLetters = String.fromCharCode(65 + (id % 26)) + String.fromCharCode(65 + ((id * 3) % 26));
    const tailNumber = `N${100 + id}${tailLetters}`;
    const aircraftModel = AIRCRAFT_MODELS[id % AIRCRAFT_MODELS.length];
    const airline = AIRLINES[id % AIRLINES.length];

    fleet.push({
      unitId: id,
      tailNumber,
      aircraftModel,
      airline,
      currentCycle,
      maxCycle,
      kneePointCycle: kneeCycle,
      predictedRul: inference.predictedRul,
      trueRul: Math.max(0, maxCycle - currentCycle),
      healthScore: inference.healthScore,
      status: inference.status,
      primaryRiskFactor: inference.primaryRiskFactor,
      recommendedAction: inference.recommendedAction,
      currentSensors,
      rollingSensors,
      history: fullHistory, // Full lifetime trajectory for replay & flight simulator
      lastOverhaulDate: `202${Math.max(1, 4 - Math.floor(currentCycle / 80))}-0${(id % 9) + 1}-15`,
      installationFlightHours: +(currentCycle * 3.4).toFixed(1),
    });
  }

  return fleet;
}
