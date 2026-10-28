export type HealthStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL';

export interface SensorReading {
  s_2: number;   // LPC Outlet Temp (K), ~641-645
  s_3: number;   // HPC Outlet Temp (K), ~1570-1615
  s_4: number;   // LPT Outlet Temp (K), ~1390-1430
  s_11: number;  // Static HPC Pressure (psia), ~46.5-48.5
  s_12: number;  // Ratio of fuel flow to static pressure, ~518-524
  s_7?: number;   // Total HPC outlet pressure (psia), ~552-555
  s_15?: number;  // Bypass ratio, ~8.3-8.5
  s_21?: number;  // LPT coolant bleed (lbm/s), ~23.1-23.4
}

export interface TelemetryPoint extends SensorReading {
  cycle: number;
  predictedRul: number;
  trueRul?: number;
  rolling_s2: number;
  rolling_s3: number;
  rolling_s4: number;
  rolling_s11: number;
  rolling_s12: number;
  riskScore: number;       // 0 - 100%
  status: HealthStatus;
  primaryStress: string;
}

export interface EngineUnit {
  unitId: number;
  tailNumber: string;
  aircraftModel: string;
  airline: string;
  currentCycle: number;
  maxCycle: number;
  kneePointCycle: number;
  predictedRul: number;
  trueRul: number;
  healthScore: number;     // 0 - 100
  status: HealthStatus;
  primaryRiskFactor: string;
  recommendedAction: string;
  currentSensors: SensorReading;
  rollingSensors: SensorReading;
  history: TelemetryPoint[];
  lastOverhaulDate: string;
  installationFlightHours: number;
}

export interface SensorMetadata {
  id: keyof SensorReading;
  code: string;
  name: string;
  unit: string;
  nominalMin: number;
  nominalMax: number;
  criticalLimit: number;
  trend: 'UP' | 'DOWN';
  importanceRank: number;
  description: string;
  aerospaceContext: string;
}

export interface ArchitectureStage {
  id: string;
  stepNumber: number;
  name: string;
  subtitle: string;
  shortDesc: string;
  fullDesc: string;
  mathematics?: string;
  inputs: string[];
  outputs: string[];
  codeSnippet: string;
  keyTakeaway: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
  engineSnapshot?: {
    unitId: number;
    predictedRul: number;
    status: HealthStatus;
    primaryStress: string;
  };
}

export interface FlightRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceNm: number;
  flightHours: number;
  severityMultiplier: number;
  etopsRequired: boolean;
  typicalAircraft: string;
}

export interface DispatchClearance {
  status: 'GO' | 'CONDITIONAL_DERATE' | 'NO_GO_AOG';
  clearanceTitle: string;
  projectedPostFlightRul: number;
  ifsdRiskPerFlightHour: number;
  recommendedDeratePercent: number;
  etopsCleared: boolean;
  operationalNotes: string[];
}

export interface FaultDiagnostic {
  symptomId: string;
  title: string;
  affectedTransducers: string[];
  suspectedRootCauses: {
    cause: string;
    probability: number;
    subsystem: 'HPC' | 'LPT' | 'COMBUSTOR' | 'FADEC_FUEL';
    boeingFimRef: string;
    easaPartMTask: string;
    correctiveAction: string;
  }[];
}
