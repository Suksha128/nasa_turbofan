import { ArchitectureStage } from './types';

export const ARCHITECTURE_STAGES: ArchitectureStage[] = [
  {
    id: 'telemetry_ingestion',
    stepNumber: 1,
    name: 'Sensor Telemetry Ingestion',
    subtitle: 'High-Frequency Avionics Bus & Engine Health Monitoring (EHM)',
    shortDesc: 'Continuous streaming of 21 aerothermal sensor channels and 3 flight operating conditions.',
    fullDesc:
      'Turbofan FADEC (Full Authority Digital Engine Control) units stream raw telemetry at 1 Hz across ARINC 429 avionics data buses. In the NASA C-MAPSS FD001 benchmark, engines operate at nominal sea-level takeoff and cruise conditions (Altitude: 0 ft, Mach: 0.00, Throttle Resolver Angle TRA: 100°), capturing combustor, compressor, and turbine thermodynamic states.',
    mathematics: '\\mathbf{x}_t = [c_t, o_{1,t}, o_{2,t}, o_{3,t}, s_{1,t}, \\dots, s_{21,t}]^T \\in \\mathbb{R}^{25}',
    inputs: [
      '21 Engine Sensor Channels (T2, T24, T30, T50, P2, P15, P30, Nf, Nc, epr, Ps30, phi, NRf, NRc, BPR, farB, htBleed, Nf_dmd, PCNfR_dmd, W31, W32)',
      '3 Operational Settings (Altitude, Mach, TRA)',
      'Operational Flight Cycle Counter (t)'
    ],
    outputs: [
      'Structured Raw Telemetry Vector',
      'Engine Unit Tag (1..100)',
      'Cycle Timestamp'
    ],
    codeSnippet: `// Raw ARINC 429 Ingestion Payload
interface RawTelemetryFrame {
  unit_id: number;
  flight_cycle: number;
  op_setting_1: number; // Altitude
  op_setting_2: number; // Mach
  op_setting_3: number; // TRA (Throttle)
  sensors: number[];    // 21 raw sensor values
}`,
    keyTakeaway:
      'Provides high-fidelity aerothermal observation without requiring invasive internal engine disassembly.'
  },
  {
    id: 'data_cleaning',
    stepNumber: 2,
    name: 'Data Cleaning & Zero-Variance Removal',
    subtitle: 'Dimensionality Reduction & Constant Channel Pruning',
    shortDesc: 'Eliminates 7 uninformative flatline sensors and removes sensor transmission artifacts.',
    fullDesc:
      'Under sea-level steady-state conditions (FD001), 7 sensors exhibit zero or near-zero variance across all 100 engines throughout their entire operational life. Retaining constant channels inflates matrix dimensionality and induces collinear instability in gradient-boosted and linear estimators. Channels s_1, s_5, s_6, s_10, s_16, s_18, and s_19 are mathematically pruned.',
    mathematics: '\\text{Var}(s_i) = \\frac{1}{N}\\sum_{t=1}^N (s_{i,t} - \\mu_i)^2 \\quad \\implies \\quad \\text{Keep if } \\text{Var}(s_i) > \\epsilon',
    inputs: [
      '21 Raw Telemetry Channels',
      'Channel Variance Threshold (\\epsilon = 10^{-4})'
    ],
    outputs: [
      '14 Active Degradation Channels',
      'Zero-Variance Mask: [s_1, s_5, s_6, s_10, s_16, s_18, s_19] pruned'
    ],
    codeSnippet: `def prune_zero_variance(df, threshold=1e-4):
    """Prunes uninformative constant sensor channels."""
    zero_var_cols = [col for col in df.columns if df[col].var() < threshold]
    # Pruned: ['s_1', 's_5', 's_6', 's_10', 's_16', 's_18', 's_19']
    return df.drop(columns=zero_var_cols)`,
    keyTakeaway:
      'Reduces input dimension from 21 to 14, removing sensor noise and accelerating model inference latency.'
  },
  {
    id: 'feature_engineering',
    stepNumber: 3,
    name: 'Feature Engineering & Smoothing',
    subtitle: 'Temporal Dynamics, 5-Cycle Rolling Statistics & Baseline Offsets',
    shortDesc: 'Extracts 5-cycle moving averages and standard deviations to suppress aerodynamic turbulence.',
    fullDesc:
      'Single-cycle instantaneous sensor readings are corrupted by aero-acoustic turbulence, atmospheric gusts, and transducer noise. Computing rolling statistics over a 5-cycle trailing window (w=5) creates a smoothed trajectory capturing true mechanical degradation while filtering high-frequency noise. Standard deviations also measure combustion flame instability.',
    mathematics: '\\bar{s}_{i,t} = \\frac{1}{w}\\sum_{k=0}^{w-1} s_{i,t-k}, \\qquad \\sigma_{i,t} = \\sqrt{\\frac{1}{w}\\sum_{k=0}^{w-1} (s_{i,t-k} - \\bar{s}_{i,t})^2}',
    inputs: [
      '14 Filtered Sensor Time-Series',
      'Rolling Window Size (w = 5 cycles)'
    ],
    outputs: [
      '14 Rolling Mean Features (\\bar{s}_i)',
      '14 Rolling Volatility Features (\\sigma_i)',
      'Degradation Rate \\Delta s_i / \\Delta t'
    ],
    codeSnippet: `// 5-Cycle Rolling Average Feature Extraction
export function computeRollingFeatures(window: SensorReading[]): SensorReading {
  const n = window.length;
  return {
    s_2: window.reduce((a, b) => a + b.s_2, 0) / n,
    s_3: window.reduce((a, b) => a + b.s_3, 0) / n,
    s_4: window.reduce((a, b) => a + b.s_4, 0) / n,
    s_11: window.reduce((a, b) => a + b.s_11, 0) / n,
    s_12: window.reduce((a, b) => a + b.s_12, 0) / n,
  };
}`,
    keyTakeaway:
      'Suppresses short-term sensor fluctuations, establishing a monotonic degradation signal for RUL forecasting.'
  },
  {
    id: 'ml_model',
    stepNumber: 4,
    name: 'ML Surrogate Inference Engine',
    subtitle: 'Piecewise Linear Degradation & Gradient Boosted Regression',
    shortDesc: 'Predicts Remaining Useful Life (RUL) with piecewise linear clipping at 125 cycles max.',
    fullDesc:
      'In early engine life (cycles 1 to ~60), mechanical wear is negligible, so target RUL is capped at RUL_max = 125 cycles to prevent misleading long-horizon overestimation (Heimes, 2008). Beyond the knee point, an ensemble of Gradient Boosted Decision Trees (XGBoost / LightGBM) and Random Forest rules predicts the remaining cycles based on HPC outlet temperature rise (s_3) and static pressure drop (s_11).',
    mathematics: 'y_{\\text{target}}(t) = \\min(125, \\text{FailureCycle} - t), \\quad \\hat{y} = \\text{clamp}\\left(\\text{Ensemble}(\\bar{\\mathbf{s}}_t), 0, 125\\right)',
    inputs: [
      'Engine Flight Cycle Counter',
      'Smoothed Sensor Telemetry Vector (\\bar{s}_2, \\bar{s}_3, \\bar{s}_4, \\bar{s}_{11}, \\bar{s}_{12})',
      'Degradation Severity Index'
    ],
    outputs: [
      'Point Estimate RUL (Cycles Remaining, 0 to 125)',
      'Confidence Interval [RUL_low, RUL_high]',
      'Health Index (0 - 100%)'
    ],
    codeSnippet: `// C-MAPSS FD001 Surrogate Inference
export function predictRul(input: InferenceInput): InferenceOutput {
  const { time_cycles, currentSensors, historySensors } = input;
  const rolling = computeRollingAverages(currentSensors, historySensors);
  
  // Piecewise Linear clipping at 125 cycles
  const rawRul = computeSurrogateDegradation(time_cycles, rolling);
  const predictedRul = Math.max(0, Math.min(125, Math.round(rawRul)));
  return { predictedRul, ... };
}`,
    keyTakeaway:
      'Achieves state-of-the-art RMSE ~14.8 cycles on C-MAPSS test set, outperforming basic linear trend projection.'
  },
  {
    id: 'nasa_loss',
    stepNumber: 5,
    name: 'NASA Asymmetric Loss Assessment',
    subtitle: 'Safety-Critical Asymmetric Exponential Penalty Evaluation',
    shortDesc: 'Heavily penalizes late predictions (d > 0) over early predictions (d < 0).',
    fullDesc:
      'Standard symmetric loss functions like MSE (Mean Squared Error) treat over-predicting and under-predicting RUL identically. However, in aviation safety: predicting 30 cycles when 10 remain (late prediction, d = +20) can cause an in-flight engine shutdown (IFSD) or uncontained failure. Predicting 10 cycles when 30 remain (early prediction, d = -20) only incurs minor scheduling inconvenience. The NASA scoring function reflects this asymmetric penalty.',
    mathematics: 'S = \\sum_{i=1}^N s_i, \\quad s_i = \\begin{cases} e^{-d_i / 13} - 1 & \\text{for } d_i < 0 \\\\ e^{d_i / 10} - 1 & \\text{for } d_i \\ge 0 \\end{cases}, \\quad d_i = \\hat{y}_i - y_i',
    inputs: [
      'Predicted RUL (\\hat{y})',
      'True Ground Truth RUL (y)',
      'Prediction Error Delta (d = \\hat{y} - y)'
    ],
    outputs: [
      'NASA Penalty Score (S)',
      'Asymmetric Risk Multiplier',
      'Safety Margin Classification'
    ],
    codeSnippet: `export function calculateNasaScore(yTrue: number, yPred: number): number {
  const d = yPred - yTrue;
  // Exponentially steeper penalty for late predictions
  return d < 0 
    ? Math.exp(-d / 13) - 1 
    : Math.exp(d / 10) - 1;
}`,
    keyTakeaway:
      'Ensures ML optimization prioritizes passenger safety and airworthiness over symmetric statistical variance.'
  },
  {
    id: 'action_dispatcher',
    stepNumber: 6,
    name: 'Action Dispatcher & Maintenance ERP',
    subtitle: 'Automated JIT Supply Chain & Aircraft On Ground (AOG) Mitigation',
    shortDesc: 'Translates cycle thresholds into maintenance commands, spare part orders, and flight restrictions.',
    fullDesc:
      'The inference output drives real-time enterprise maintenance decisions. At RUL > 50, the aircraft is cleared for unrestricted long-haul international routes. When RUL enters the 21-50 warning band, the system automatically reserves spare HPC blade sets in JIT inventory and schedules a borescope inspection at the next line maintenance base. When RUL <= 20, an immediate AOG ground order is dispatched.',
    mathematics: '\\text{Action}(\\text{RUL}) = \\begin{cases} \\text{CLEAR LONG-HAUL} & \\text{if } \\text{RUL} > 50 \\\\ \\text{INSPECTION & JIT PARTS} & \\text{if } 20 < \\text{RUL} \\le 50 \\\\ \\text{AOG GROUND IMMEDIATELY} & \\text{if } \\text{RUL} \\le 20 \\end{cases}',
    inputs: [
      'Predicted RUL & Health Status',
      'Primary Risk Factor (e.g. HPC Pressure Loss)',
      'Current Tail Location & Route Schedule'
    ],
    outputs: [
      'ERP Maintenance Work Order (SAP / Amos)',
      'AOG Operational Dispatch Alert',
      'JIT Spare Parts Procurement Trigger'
    ],
    codeSnippet: `// Maintenance ERP Dispatch Logic
if (predictedRul > 50) {
  status = 'NOMINAL';
  action = 'Clear for Long-Haul Flight Operations / Routine A-Check';
} else if (predictedRul > 20) {
  status = 'WARNING';
  action = 'Schedule Borescope Inspection / Stage JIT HPC Blades';
} else {
  status = 'CRITICAL';
  action = 'AOG (Aircraft On Ground) / Ground Engine & Emergency Overhaul';
}`,
    keyTakeaway:
      'Bridges predictive ML analytics with concrete airline operational workflows, eliminating unscheduled delays.'
  }
];
