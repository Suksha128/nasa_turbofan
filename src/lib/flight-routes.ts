import { FlightRoute, DispatchClearance, EngineUnit, TelemetryPoint } from './types';

export const FLIGHT_ROUTES: FlightRoute[] = [
  {
    id: 'JFK-LHR',
    name: 'New York (JFK) ➔ London Heathrow (LHR)',
    origin: 'JFK (New York)',
    destination: 'LHR (London)',
    distanceNm: 3451,
    flightHours: 7.2,
    severityMultiplier: 1.25, // Transatlantic cruise thermal fatigue
    etopsRequired: true,
    typicalAircraft: 'Boeing 777-200ER / GE90-94B',
  },
  {
    id: 'LAX-HND',
    name: 'Los Angeles (LAX) ➔ Tokyo Haneda (HND)',
    origin: 'LAX (Los Angeles)',
    destination: 'HND (Tokyo)',
    distanceNm: 5488,
    flightHours: 11.5,
    severityMultiplier: 1.45, // Heavy payload transpacific
    etopsRequired: true,
    typicalAircraft: 'Airbus A330-300 / Trent 700',
  },
  {
    id: 'ORD-DFW',
    name: 'Chicago O\'Hare (ORD) ➔ Dallas Fort Worth (DFW)',
    origin: 'ORD (Chicago)',
    destination: 'DFW (Dallas)',
    distanceNm: 802,
    flightHours: 2.2,
    severityMultiplier: 1.0, // Standard domestic cycle
    etopsRequired: false,
    typicalAircraft: 'Boeing 737-800 / CFM56-7B',
  },
  {
    id: 'BOS-LGA',
    name: 'Boston (BOS) ➔ New York LaGuardia (LGA)',
    origin: 'BOS (Boston)',
    destination: 'LGA (New York)',
    distanceNm: 185,
    flightHours: 0.9,
    severityMultiplier: 0.75, // Short shuttle cycle
    etopsRequired: false,
    typicalAircraft: 'Boeing 737-800 / CFM56-7B',
  },
  {
    id: 'DXB-SIN',
    name: 'Dubai (DXB) ➔ Singapore Changi (SIN)',
    origin: 'DXB (Dubai)',
    destination: 'SIN (Singapore)',
    distanceNm: 3687,
    flightHours: 7.5,
    severityMultiplier: 1.35, // High ambient temperature & hot-and-high takeoff
    etopsRequired: true,
    typicalAircraft: 'Boeing 777-200ER / GE90-94B',
  },
];

export function computeDispatchClearance(
  engine: EngineUnit,
  currentPoint: TelemetryPoint,
  route: FlightRoute,
  deratePercent: number // 0 to 20%
): DispatchClearance {
  const currentRul = currentPoint?.predictedRul ?? engine.predictedRul;
  
  // Derate reduces thermal stress: each 5% derate mitigates wear by ~12%
  const derateMitigationFactor = Math.max(0.7, 1.0 - (deratePercent / 100) * 1.5);
  const cycleEquivalentBurn = Math.max(1, Math.round(route.flightHours * route.severityMultiplier * derateMitigationFactor * 0.4));
  
  const projectedPostFlightRul = Math.max(0, currentRul - cycleEquivalentBurn);
  
  // IFSD (In-Flight Shutdown) probability calculation based on RUL buffer
  let ifsdRate: number;
  if (currentRul <= 10) {
    ifsdRate = 0.085; // 8.5% catastrophic hazard
  } else if (currentRul <= 25) {
    ifsdRate = 0.015; // 1.5% elevated risk
  } else if (currentRul <= 50) {
    ifsdRate = 0.0008; // 0.08% within advisory bounds
  } else {
    ifsdRate = 0.00005; // 0.005% nominal FAA AC 120-42B baseline
  }

  // ETOPS-180 rule check: Requires dual-engine IFSD rate < 0.0001 per flight hour & RUL >= 20
  const etopsCleared = !route.etopsRequired || (currentRul > 25 && ifsdRate <= 0.001);

  let status: 'GO' | 'CONDITIONAL_DERATE' | 'NO_GO_AOG';
  let clearanceTitle: string;
  const notes: string[] = [];

  if (currentRul <= 15 || projectedPostFlightRul <= 8) {
    status = 'NO_GO_AOG';
    clearanceTitle = 'FLIGHT DISPATCH PROHIBITED (AIRCRAFT ON GROUND - AOG)';
    notes.push('Engine Remaining Useful Life is below mandatory airworthiness threshold (FAA Part 121.365).');
    notes.push(`Projected RUL after ${route.flightHours}h flight is only ${projectedPostFlightRul} cycles.`);
    notes.push('Ground aircraft immediately. Stage replacement engine module.');
  } else if (currentRul <= 35 || (route.etopsRequired && !etopsCleared)) {
    status = 'CONDITIONAL_DERATE';
    clearanceTitle = 'CONDITIONAL DISPATCH CLEARED WITH TAKEOFF DERATE';
    notes.push(`Apply ${Math.max(10, deratePercent)}% takeoff thrust derate to limit High-Pressure Turbine EGT thermal peak.`);
    if (route.etopsRequired) {
      notes.push('ETOPS-180 oceanic routing permitted only with designated en-route diversion airfields.');
    }
    notes.push('Perform borescope inspection at arrival hub.');
  } else {
    status = 'GO';
    clearanceTitle = 'CLEARED FOR REVENUE SERVICE (UNRESTRICTED DISPATCH)';
    notes.push(`RUL buffer of ${currentRul} cycles provides sufficient safety margin.`);
    notes.push(`Estimated wear for ${route.origin} ➔ ${route.destination} is ${cycleEquivalentBurn} equivalent cycles.`);
    notes.push('Airworthiness compliant with FAA / EASA Part-M continuous airworthiness.');
  }

  return {
    status,
    clearanceTitle,
    projectedPostFlightRul,
    ifsdRiskPerFlightHour: ifsdRate,
    recommendedDeratePercent: currentRul < 40 ? 12 : 5,
    etopsCleared,
    operationalNotes: notes,
  };
}
