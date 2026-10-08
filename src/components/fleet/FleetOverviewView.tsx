'use client';

import React from 'react';
import { FleetKpiCards } from './FleetKpiCards';
import { FleetTable } from './FleetTable';
import { FleetHealthDist } from './FleetHealthDist';

export function FleetOverviewView() {
  return (
    <div className="space-y-6">
      {/* 1. Executive Summary KPI Cards */}
      <FleetKpiCards />

      {/* 2. Interactive Filterable Fleet Table */}
      <FleetTable />

      {/* 3. Fleet Health Distribution & Maintenance Policies */}
      <FleetHealthDist />
    </div>
  );
}
