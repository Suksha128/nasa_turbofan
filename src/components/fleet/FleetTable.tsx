'use client';

import React from 'react';
import { usePdm, SortOption } from '@/lib/store';
import { HealthStatus } from '@/lib/types';
import { StatusBadge } from '@/components/common/Badge';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Wrench, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function FleetTable() {
  const {
    filteredFleet,
    setSelectedUnitId,
    setActiveScreen,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    fleet,
  } = usePdm();

  const handleInspect = (unitId: number) => {
    setSelectedUnitId(unitId);
    setActiveScreen('twin');
  };

  const statusFilterCounts = {
    ALL: fleet.length,
    CRITICAL: fleet.filter((u) => u.status === 'CRITICAL').length,
    WARNING: fleet.filter((u) => u.status === 'WARNING').length,
    NOMINAL: fleet.filter((u) => u.status === 'NOMINAL').length,
  };

  return (
    <div className="telemetry-card overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950/40">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Unit ID (e.g. 12), Tail # (N112AA), Airline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter Tabs & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {(['ALL', 'CRITICAL', 'WARNING', 'NOMINAL'] as const).map((st) => {
              const active = filterStatus === st;
              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded-md transition-all font-medium flex items-center space-x-1.5 ${
                    active
                      ? st === 'CRITICAL'
                        ? 'bg-red-950 text-red-200 border border-red-800'
                        : st === 'WARNING'
                        ? 'bg-amber-950 text-amber-200 border border-amber-800'
                        : st === 'NOMINAL'
                        ? 'bg-emerald-950 text-emerald-200 border border-emerald-800'
                        : 'bg-cyan-950 text-cyan-200 border border-cyan-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{st === 'ALL' ? 'All Units' : st}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {statusFilterCounts[st]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="rul_asc" className="bg-slate-900">RUL: Low to High (Most Critical)</option>
              <option value="rul_desc" className="bg-slate-900">RUL: High to Low</option>
              <option value="unit_asc" className="bg-slate-900">Unit ID: 1 to 100</option>
              <option value="cycle_desc" className="bg-slate-900">Current Cycle: High to Low</option>
              <option value="health_asc" className="bg-slate-900">Health Score: Lowest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Fleet Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
            <tr>
              <th className="py-3.5 px-4">Unit ID / Tail #</th>
              <th className="py-3.5 px-4">Current Cycle</th>
              <th className="py-3.5 px-4">Predicted RUL</th>
              <th className="py-3.5 px-4">Health Status</th>
              <th className="py-3.5 px-4">Primary Risk Factor</th>
              <th className="py-3.5 px-4">Recommended Action</th>
              <th className="py-3.5 px-4 text-right">Telemetry Drill-Down</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {filteredFleet.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No turbofan engine units matched your query.
                </td>
              </tr>
            ) : (
              filteredFleet.map((engine) => {
                const isCritical = engine.status === 'CRITICAL';
                const isWarning = engine.status === 'WARNING';

                return (
                  <tr
                    key={engine.unitId}
                    onClick={() => handleInspect(engine.unitId)}
                    className={`cursor-pointer transition-colors group ${
                      isCritical
                        ? 'bg-red-950/15 hover:bg-red-950/30'
                        : isWarning
                        ? 'bg-amber-950/10 hover:bg-amber-950/20'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Unit ID & Airframe */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isCritical 
                            ? 'bg-red-950 border border-red-700 text-red-300' 
                            : isWarning 
                            ? 'bg-amber-950 border border-amber-700 text-amber-300' 
                            : 'bg-slate-800 border border-slate-700 text-cyan-300'
                        }`}>
                          #{engine.unitId}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 font-mono">
                            {engine.tailNumber}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            {engine.airline}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Current Cycle & Lifetime */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-200 font-medium">
                        Cycle {engine.currentCycle}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Lifespan: {engine.maxCycle} cyc
                      </div>
                    </td>

                    {/* Predicted RUL */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-baseline space-x-1.5">
                        <span className={`text-base font-extrabold font-mono ${
                          isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {engine.predictedRul}
                        </span>
                        <span className="text-[11px] text-slate-400">cycles</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        True RUL: {engine.trueRul} | Err: {engine.predictedRul - engine.trueRul > 0 ? `+${engine.predictedRul - engine.trueRul}` : engine.predictedRul - engine.trueRul}
                      </div>
                    </td>

                    {/* Health Status Badge */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={engine.status} size="sm" />
                    </td>

                    {/* Primary Risk Factor */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-200 font-medium text-xs">
                        {engine.primaryRiskFactor}
                      </span>
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[260px] text-slate-300 text-xs truncate" title={engine.recommendedAction}>
                        {engine.recommendedAction}
                      </div>
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspect(engine.unitId);
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-700 text-slate-200 hover:text-white text-xs font-medium transition-all group-hover:border-cyan-500/50 border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <span className="text-slate-200 font-mono font-medium">{filteredFleet.length}</span> of 100 engines
        </span>
        <span className="font-mono text-[11px] text-slate-500">
          Click any row to open the Real-Time Telemetry Twin &amp; Flight Simulator
        </span>
      </div>
    </div>
  );
}
