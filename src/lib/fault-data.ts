import { FaultDiagnostic } from './types';

export const FAULT_DIAGNOSTICS: FaultDiagnostic[] = [
  {
    symptomId: 'HPC_PRESSURE_DROP',
    title: 'HPC Static Discharge Pressure (Ps30) Sub-Nominal Drop',
    affectedTransducers: ['s_11 (Ps30 Static Pressure)', 's_3 (T30 HPC Outlet Temp)', 's_12 (Fuel-Ps30 Ratio)'],
    suspectedRootCauses: [
      {
        cause: 'High-Pressure Compressor Rotor Blade Tip Clearance Rub & Erosion',
        probability: 0.68,
        subsystem: 'HPC',
        boeingFimRef: 'FIM 72-31-TASK-801 (HPC Blade Tip Radial Clearance Inspection)',
        easaPartMTask: 'AMM 72-31-02-200-001 (Borescope Inspection of Stage 4-9 Rotor Tips)',
        correctiveAction: 'Perform optical borescope measurement of radial tip gap. If clearance exceeds 0.045 inches (1.14 mm), remove engine for HPC module overhaul.',
      },
      {
        cause: 'Variable Stator Vane (VSV) Actuator Bellcrank Mis-Rigging',
        probability: 0.22,
        subsystem: 'HPC',
        boeingFimRef: 'FIM 75-31-TASK-804 (VSV Feedback Resolver Calibration)',
        easaPartMTask: 'AMM 75-31-01-400-001 (VSV Rigging Verification with Protractor Tool)',
        correctiveAction: 'Inspect VSV torque tubes and uniball joints. Perform FADEC BITE test to re-zero actuator null bias.',
      },
      {
        cause: 'Compressor Bleed Valve (CBV) Seal Blow-by Leakage',
        probability: 0.10,
        subsystem: 'HPC',
        boeingFimRef: 'FIM 75-22-TASK-802 (Bleed Air Isolation Check)',
        easaPartMTask: 'AMM 75-22-00-700-001 (Functional Leak Test of 9th Stage Bleed Shutoff)',
        correctiveAction: 'Apply pneumatic pressure test to 9th stage bleed manifold. Replace elastomer diaphragm if leakage rate > 0.05 lbm/s.',
      },
    ],
  },
  {
    symptomId: 'EGT_OVERTEMP_LPT',
    title: 'High Exhaust Gas Temperature (T50) & Thermal Creep',
    affectedTransducers: ['s_4 (T50 LPT Temp)', 's_3 (T30 HPC Temp)', 's_21 (LPT Coolant Bleed)'],
    suspectedRootCauses: [
      {
        cause: 'Low-Pressure Turbine Stage 1 Nozzle Guide Vane (NGV) Thermal Spallation',
        probability: 0.55,
        subsystem: 'LPT',
        boeingFimRef: 'FIM 72-51-TASK-803 (LPT NGV Trailing Edge Crack Inspection)',
        easaPartMTask: 'AMM 72-51-01-200-001 (Borescope Examination of Stage 1 LPT Segment)',
        correctiveAction: 'Check for thermal barrier coating (TBC) loss and trailing edge burn-through. Clean ceramic coating or blend cracked trailing edges.',
      },
      {
        cause: 'Combustor Fuel Nozzle Carbon Coking & Streaking',
        probability: 0.30,
        subsystem: 'COMBUSTOR',
        boeingFimRef: 'FIM 73-11-TASK-805 (Fuel Spray Pattern Quality Verification)',
        easaPartMTask: 'AMM 73-11-02-700-001 (Flow Bench Check of 20 Duplex Fuel Nozzles)',
        correctiveAction: 'Remove and ultrasonic solvent clean fuel nozzles. Replace coked injectors to restore uniform circumferential flame pattern.',
      },
      {
        cause: 'Turbine Active Clearance Control (TACC) Cooling Air Depleted',
        probability: 0.15,
        subsystem: 'LPT',
        boeingFimRef: 'FIM 75-41-TASK-801 (TACC Butterfly Modulating Valve Test)',
        easaPartMTask: 'AMM 75-41-00-400-001 (Rigging and Electrical Resistance Check)',
        correctiveAction: 'Verify TACC modulating valve opens fully during takeoff thrust transients. Replace seized pneumatic actuator.',
      },
    ],
  },
  {
    symptomId: 'FUEL_RATIO_DRIFT',
    title: 'Abnormal Fuel-to-Static-Pressure Ratio (phi, s12) Drift',
    affectedTransducers: ['s_12 (Fuel/Ps30 Ratio)', 's_9 (Nc Core Speed)', 's_14 (Corrected Core Speed)'],
    suspectedRootCauses: [
      {
        cause: 'Fuel Metering Valve (FMV) Linear Variable Differential Transformer (LVDT) Drift',
        probability: 0.52,
        subsystem: 'FADEC_FUEL',
        boeingFimRef: 'FIM 73-21-TASK-802 (HMU Metering Valve Position Error)',
        easaPartMTask: 'AMM 73-21-01-400-001 (Hydro-Mechanical Unit LVDT Recalibration)',
        correctiveAction: 'Connect FADEC maintenance terminal and perform 0-100% stroke calibration. If position error > 2%, replace HMU assembly.',
      },
      {
        cause: 'Compressor Aerodynamic Fouling from Particulate Ingestion',
        probability: 0.48,
        subsystem: 'HPC',
        boeingFimRef: 'FIM 72-00-TASK-810 (Compressor Efficiency Recovery Procedure)',
        easaPartMTask: 'AMM 72-00-00-100-001 (Engine Water Wash & Chemical Detergent Soak)',
        correctiveAction: 'Perform 3-cycle demineralized water and detergent crank wash to remove atmospheric deposits from HPC blading.',
      },
    ],
  },
];
