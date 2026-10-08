'use client';

import React from 'react';
import { TelemetrySimulator } from './TelemetrySimulator';
import { RulGauge } from './RulGauge';
import { DecisionBox } from './DecisionBox';
import { EngineCrossSection } from './EngineCrossSection';
import { SensorDegradationPlot } from './SensorDegradationPlot';

export function EngineTwinView() {
  return (
    <div className="space-y-6">
      {/* 1. Control Panel & Flight Simulator */}
      <TelemetrySimulator />

      {/* 2. Real-Time Prediction Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RulGauge />
        <DecisionBox />
      </div>

      {/* 3. Turbofan Cross Section Hotspotting */}
      <EngineCrossSection />

      {/* 4. Sensor Degradation Time-Series Visualizer */}
      <SensorDegradationPlot />
    </div>
  );
}
