'use client';

import React, { useState, useEffect } from 'react';
import { usePdm, ScreenTab } from '@/lib/store';
import { 
  Plane, 
  Activity, 
  Layers, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Cpu,
  ChevronRight
} from 'lucide-react';

export function Header() {
  const { 
    activeScreen, 
    setActiveScreen, 
    selectedEngine, 
    fleet 
  } = usePdm();

  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = fleet.filter((u) => u.status === 'CRITICAL').length;
  const warningCount = fleet.filter((u) => u.status === 'WARNING').length;
  const nominalCount = fleet.filter((u) => u.status === 'NOMINAL').length;

  const tabs: { id: ScreenTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'fleet',
      label: 'Fleet Overview & Analytics',
      icon: <Plane className="w-4 h-4" />,
      badge: `${fleet.length} Units`,
    },
    {
      id: 'twin',
      label: `Digital Twin & Simulator`,
      icon: <Activity className="w-4 h-4" />,
      badge: selectedEngine ? `Unit #${selectedEngine.unitId}` : 'Select',
    },
    {
      id: 'architecture',
      label: 'ML Architecture & Explainability',
      icon: <Layers className="w-4 h-4" />,
      badge: 'NASA Loss',
    },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Domain Context */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-100 tracking-wider text-sm sm:text-base">
                  AERO-PREDICT
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-mono">
                  NASA C-MAPSS FD001
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Turbofan Engine Remaining Useful Life (RUL) Telemetry Twin
              </p>
            </div>
          </div>

          {/* Quick Fleet Health Badges */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nominal: {nominalCount}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800/60 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Warning: {warningCount}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-red-950/60 border border-red-800/60 text-red-300">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Critical: {criticalCount}</span>
            </div>
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{utcTime || '00:00:00 UTC'}</span>
            </div>
          </div>

          {/* Screen Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            {tabs.map((tab) => {
              const isActive = activeScreen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScreen(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-cyan-900/80 text-cyan-200 border border-cyan-400/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
