import { EngineUnit, TelemetryPoint } from './types';

export interface ChatEngineContext {
  selectedEngine: EngineUnit;
  currentTelemetryPoint: TelemetryPoint;
  fleet: EngineUnit[];
}

export function generateAeroResponse(userPrompt: string, ctx: ChatEngineContext): {
  reply: string;
  suggestedActions: string[];
} {
  const q = userPrompt.toLowerCase();
  const { selectedEngine, currentTelemetryPoint, fleet } = ctx;
  const unitId = selectedEngine?.unitId ?? 1;
  const rul = currentTelemetryPoint?.predictedRul ?? selectedEngine?.predictedRul ?? 50;
  const status = currentTelemetryPoint?.status ?? selectedEngine?.status ?? 'NOMINAL';
  const s3 = currentTelemetryPoint?.s_3?.toFixed(1) ?? '1585.0';
  const s11 = currentTelemetryPoint?.s_11?.toFixed(2) ?? '47.50';
  const s4 = currentTelemetryPoint?.s_4?.toFixed(1) ?? '1400.0';

  const criticalEngines = fleet.filter((e) => e.status === 'CRITICAL');
  const warningEngines = fleet.filter((e) => e.status === 'WARNING');
  const nominalEngines = fleet.filter((e) => e.status === 'NOMINAL');

  // Query: Diagnostic / Status of current engine
  if (q.includes('diagnos') || q.includes('status') || q.includes('health') || q.includes('unit #') || q.includes('this engine')) {
    let airworthiness = 'CLEARED FOR UNRESTRICTED LONG-HAUL FLIGHT';
    let recommendations = 'Maintain standard 100-cycle borescope inspection intervals.';
    if (status === 'CRITICAL') {
      airworthiness = 'GROUND IMMEDIATELY (AOG - AIRCRAFT ON GROUND)';
      recommendations = 'Pull engine for shop overhaul. Stage JIT HPC Stage 3-5 titanium blade kit (SKU: HPC-BLD-STG3-5-TI). Do not dispatch into revenue service.';
    } else if (status === 'WARNING') {
      airworthiness = 'CONDITIONAL CLEARANCE (RESTRICT TO DOMESTIC ROUTES)';
      recommendations = 'Accelerated tip clearance erosion detected. Restrict to domestic flights under 4 hours. Schedule borescope inspection within 25 cycles.';
    }

    return {
      reply: `### Aerothermal Health Diagnostic: Unit #${unitId} (${selectedEngine?.aircraftModel || 'B777-200ER'} / ${selectedEngine?.tailNumber || 'N142AA'})

**Airworthiness Directive:** **${airworthiness}**
- **Predicted RUL:** **${rul} flight cycles** (True RUL: ${currentTelemetryPoint?.trueRul ?? selectedEngine?.trueRul ?? 45} cycles)
- **Current Operational Cycle:** Cycle ${currentTelemetryPoint?.cycle ?? 1} of estimated ${selectedEngine?.maxCycle ?? 200}
- **Primary Stress Factor:** ${currentTelemetryPoint?.primaryStress || selectedEngine?.primaryRiskFactor || 'HPC Static Pressure Drop'}

**Key Gas-Path Telemetry Snapshot:**
- **HPC Static Pressure ($P_{s30}$, s11):** \`${s11} psia\` (Nominal: 47.50 psia | $\\Delta = ${(parseFloat(s11) - 47.5).toFixed(2)}$)
- **HPC Discharge Temp ($T_{30}$, s3):** \`${s3} K\` (Nominal: 1585.0 K | $\\Delta = +${(parseFloat(s3) - 1585).toFixed(1)} K$)
- **LPT Exhaust Temp ($T_{50}$, s4):** \`${s4} K\` (Nominal: 1400.0 K | $\\Delta = +${(parseFloat(s4) - 1400).toFixed(1)} K$)

**Recommended MRO Action:**
${recommendations}`,
      suggestedActions: [
        'Open Fault Isolation Tree',
        'Generate FAA 8130-3 Release Certificate',
        'Check Flight Route Dispatch Clearance',
      ],
    };
  }

  // Query: Why is Ps30 (s11) so important?
  if (q.includes('ps30') || q.includes('s11') || q.includes('pressure') || q.includes('importance')) {
    return {
      reply: `### Why HPC Static Pressure ($P_{s30}$, Sensor 11) is the #1 Failure Precursor

In twin-spool commercial turbofans, $P_{s30}$ measures static air pressure at the High-Pressure Compressor (HPC) exit, immediately preceding the annular combustion chamber.

1. **Fluid Dynamic Mechanism:**
   In NASA C-MAPSS FD001, degradation occurs via **HPC blade tip clearance erosion**. As blade rub strips wear down, high-pressure air leaks back across the blade tips from high to low pressure stages. This creates an immediate decay in the stage compression ratio.

2. **Temporal Precedence:**
   Pressure drops occur **30 to 50 cycles earlier** than exhaust gas temperature ($T_{50}$) thermal spikes. Temperature only rises later because the Full Authority Digital Engine Control (FADEC) enriches the fuel flow to compensate for the lost compressor pressure ratio.

3. **Empirical Validation:**
   Our XGBoost Gini Feature Importance analysis ranks rolling $P_{s30}$ as **Feature #1 with an importance score of 0.214**, surpassing all other 20 sensor channels.`,
      suggestedActions: [
        'Inspect Feature Importance Chart',
        'Simulate Ps30 Pressure Drop Slider',
        'Check LPT Exhaust Temperature (T50)',
      ],
    };
  }

  // Query: Explain NASA Asymmetric Loss Function
  if (q.includes('nasa') || q.includes('asymmetric') || q.includes('loss') || q.includes('1.75') || q.includes('penalty')) {
    return {
      reply: `### The NASA Asymmetric Scoring Function & The 1.75× Penalty Ratio

Standard machine learning models optimize symmetric Mean Squared Error (MSE), which treats an overestimation ($+d$) identically to an underestimation ($-d$). In commercial aviation, this creates catastrophic safety misalignment.

#### Mathematical Formulation:
Let signed error be $d = \\hat{y} - y$:
$$s_i = \\begin{cases} \\exp(-d/13) - 1 & \\text{for } d < 0 \\quad (\\text{Early, Conservative}) \\\\ \\exp(d/10) - 1 & \\text{for } d \\ge 0 \\quad (\\text{Late, Hazardous}) \\end{cases}$$

#### The 1.75× Analytical Proof:
For an estimation error of $|d| = 20$ flight cycles:
- **Late (Hazardous):** $s_{\\text{late}}(20) = \\exp(20/10) - 1 = e^2 - 1 \\approx 6.389$
- **Early (Safe):** $s_{\\text{early}}(-20) = \\exp(20/13) - 1 = e^{1.538} - 1 \\approx 3.657$
- **Penalty Ratio:** $\\rho(20) = \\frac{6.389}{3.657} \\approx \\mathbf{1.747 \\approx 1.75\\times}$

Being 20 cycles late is penalized **1.75 times more** than being 20 cycles early. Our 2-layer LSTM achieves an average signed error of **$\\bar{d} = -2.1$ cycles (conservative bias)**, driving the fleet NASA Score down to **318.2** (a 33.4% reduction vs. baseline).`,
      suggestedActions: [
        'Open NASA Score Comparator',
        'View ML Architecture Stages',
        'Diagnose Fleet Safety Distribution',
      ],
    };
  }

  // Query: Fleet triage & critical overview
  if (q.includes('fleet') || q.includes('critical') || q.includes('aog') || q.includes('how many')) {
    const criticalList = criticalEngines.slice(0, 5).map((e) => `Unit #${e.unitId} (${e.predictedRul} cycles, ${e.aircraftModel})`).join(', ');

    return {
      reply: `### Fleet Triage & Airworthiness Summary (100 Turbofan Fleet)

- **Nominal Units (RUL > 50):** ${nominalEngines.length} engines (Operational)
- **Warning Units (20 < RUL ≤ 50):** ${warningEngines.length} engines (JIT Parts Staged)
- **Critical AOG Units (RUL ≤ 20):** **${criticalEngines.length} engines (Immediate Grounding)**

**High-Risk Engines Requiring Line Overhaul:**
${criticalList}${criticalEngines.length > 5 ? `, and ${criticalEngines.length - 5} more.` : '.'}

**Fleet Economic Insight:**
By shifting from fixed-interval 5,000-hour teardowns to condition-based prognostics, the fleet is saving an estimated **$450,000 per avoided premature shop visit**, while eliminating In-Flight Shutdown (IFSD) risks.`,
      suggestedActions: [
        'Filter Fleet Table by Critical',
        'Export Fleet Maintenance Schedule',
        'Switch to Digital Twin Simulator',
      ],
    };
  }

  // Query: Parts staging & MRO recommendations
  if (q.includes('part') || q.includes('overhaul') || q.includes('jit') || q.includes('repair') || q.includes('cost')) {
    return {
      reply: `### Recommended MRO Parts Staging & Logistics Kit

For engines transitioning past the wear knee-point ($RUL \\le 50$), staged procurement avoids Aircraft On Ground (AOG) delivery penalties ($15,000/day):

1. **High-Pressure Compressor (HPC) Overhaul Kit:**
   - **Part Number:** \`HPC-BLD-STG3-5-TI\` (HPC Stage 3-5 Titanium Rotor Blades)
   - **Lead Time:** 48 hours staged in regional hub
   - **Task Procedure:** Boeing AMM 72-31-00 / CFM56-7B FIM 72-00-00

2. **Low-Pressure Turbine (LPT) Thermal Shroud Kit:**
   - **Part Number:** \`LPT-SHRD-HONEYCOMB-NICR\`
   - **Task Procedure:** Borescope Inspection Stage 1 Nozzle Guide Vane

3. **Financial Summary:**
   - Standard Unscheduled AOG Shop Visit: ~$1,200,000
   - Planned Predictive Staged Overhaul: ~$750,000
   - **Net Cost Avoidance:** **$450,000 per engine**`,
      suggestedActions: [
        'Generate FAA Release Certificate',
        'Open Flight Route Dispatcher',
        'Diagnose Unit #' + unitId,
      ],
    };
  }

  // Fallback: General aerospace guidance
  return {
    reply: `### AeroCopilot Intelligence Query Acknowledged

I can provide real-time diagnostic reasoning on the **NASA C-MAPSS FD001** turbofan fleet. Here are topics I can help you with:

1. **Current Engine Diagnostic:** Ask *"Diagnose Unit #${unitId}"* to inspect thermodynamic deviations ($P_{s30}$, $T_{30}$, $T_{50}$) and clearance status.
2. **Failure Mechanics:** Ask *"Why does HPC pressure drop before EGT rises?"* for aerothermal fluid mechanics.
3. **Aviation Safety Loss:** Ask *"Explain the 1.75x NASA Asymmetric penalty ratio"* to review safety economics.
4. **Fleet MRO Triage:** Ask *"Which engines are in Critical AOG status?"* to list high-risk aircraft.
5. **Flight Dispatch:** Ask *"Is this engine cleared for transatlantic flight?"* to test route airworthiness.`,
    suggestedActions: [
      `Diagnose Unit #${unitId}`,
      'Why is Ps30 the top sensor?',
      'Explain NASA Asymmetric Loss',
      'List all Critical AOG units',
    ],
  };
}
