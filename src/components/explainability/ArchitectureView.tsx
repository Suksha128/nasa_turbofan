'use client';

import React from 'react';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { PipelineNodeModal } from './PipelineNodeModal';
import { FeatureImportanceBar } from './FeatureImportanceBar';
import { NasaScoreComparator } from './NasaScoreComparator';

export function ArchitectureView() {
  return (
    <div className="space-y-6">
      {/* 1. Interactive 6-Stage Pipeline Flow Architecture */}
      <ArchitectureDiagram />

      {/* 2. Technical Modal Popover */}
      <PipelineNodeModal />

      {/* 3. Sensor Feature Importance Breakdown */}
      <FeatureImportanceBar />

      {/* 4. NASA Asymmetric Loss vs MSE Curve */}
      <NasaScoreComparator />
    </div>
  );
}
