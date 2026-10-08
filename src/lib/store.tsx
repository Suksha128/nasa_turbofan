'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { EngineUnit, HealthStatus, SensorReading, TelemetryPoint, ArchitectureStage } from './types';
import { generateFleet } from './dataset-generator';
import { predictRul, SENSOR_BASELINES } from './ml-engine';
import { ARCHITECTURE_STAGES } from './architecture-data';

export type ScreenTab = 'fleet' | 'twin' | 'architecture';
export type SortOption = 'rul_asc' | 'rul_desc' | 'unit_asc' | 'cycle_desc' | 'health_asc';

interface PdmContextType {
  fleet: EngineUnit[];
  selectedUnitId: number;
  setSelectedUnitId: (id: number) => void;
  selectedEngine: EngineUnit;
  activeScreen: ScreenTab;
  setActiveScreen: (screen: ScreenTab) => void;
  
  // Simulator State
  currentCycle: number;
  setCurrentCycle: (cycle: number) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  sensorOverrides: Partial<SensorReading>;
  setSensorOverride: (sensor: keyof SensorReading, val: number | undefined) => void;
  resetSensorOverrides: () => void;
  loadPreset: (preset: 'fresh' | 'knee' | 'warning' | 'critical') => void;

  // Real-time computed values for current engine state
  currentTelemetryPoint: TelemetryPoint;
  historicalTrajectory: TelemetryPoint[];

  // Fleet View Controls
  filterStatus: HealthStatus | 'ALL';
  setFilterStatus: (status: HealthStatus | 'ALL') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  filteredFleet: EngineUnit[];

  // Architecture Stage Modal
  selectedArchitectureStage: ArchitectureStage | null;
  setSelectedArchitectureStage: (stage: ArchitectureStage | null) => void;
}

const PdmContext = createContext<PdmContextType | null>(null);

export function PdmProvider({ children }: { children: React.ReactNode }) {
  // Initialize full 100-engine fleet once
  const [fleet, setFleet] = useState<EngineUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [activeScreen, setActiveScreen] = useState<ScreenTab>('fleet');

  // Simulation controls
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [sensorOverrides, setSensorOverrides] = useState<Partial<SensorReading>>({});

  // Filter & search
  const [filterStatus, setFilterStatus] = useState<HealthStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('rul_asc');

  // Explainability modal
  const [selectedArchitectureStage, setSelectedArchitectureStage] = useState<ArchitectureStage | null>(null);

  // Generate fleet on initial client load
  useEffect(() => {
    const generated = generateFleet();
    setFleet(generated);
    if (generated.length > 0) {
      setCurrentCycle(generated[0].currentCycle);
    }
  }, []);

  const selectedEngine = useMemo(() => {
    return fleet.find((u) => u.unitId === selectedUnitId) || fleet[0] || ({} as EngineUnit);
  }, [fleet, selectedUnitId]);

  // Sync currentCycle when selectedUnitId changes
  useEffect(() => {
    if (selectedEngine && selectedEngine.currentCycle) {
      setCurrentCycle(selectedEngine.currentCycle);
      setSensorOverrides({});
      setIsSimulating(false);
    }
  }, [selectedUnitId, selectedEngine]);

  const setSensorOverride = useCallback((sensor: keyof SensorReading, val: number | undefined) => {
    setSensorOverrides((prev) => {
      const next = { ...prev };
      if (val === undefined) {
        delete next[sensor];
      } else {
        next[sensor] = val;
      }
      return next;
    });
  }, []);

  const resetSensorOverrides = useCallback(() => {
    setSensorOverrides({});
  }, []);

  const loadPreset = useCallback(
    (preset: 'fresh' | 'knee' | 'warning' | 'critical') => {
      if (!selectedEngine || !selectedEngine.maxCycle) return;
      resetSensorOverrides();
      const max = selectedEngine.maxCycle;
      const knee = selectedEngine.kneePointCycle;

      switch (preset) {
        case 'fresh':
          setCurrentCycle(Math.min(15, knee - 10));
          break;
        case 'knee':
          setCurrentCycle(knee);
          break;
        case 'warning':
          setCurrentCycle(Math.max(knee + 10, max - 38));
          break;
        case 'critical':
          setCurrentCycle(Math.max(1, max - 12));
          break;
      }
    },
    [selectedEngine, resetSensorOverrides]
  );

  // Live simulation ticker (advances cycle every 1.5s / speed)
  useEffect(() => {
    if (!isSimulating || !selectedEngine || !selectedEngine.maxCycle) return;

    const intervalMs = Math.max(250, Math.floor(1500 / simulationSpeed));
    const timer = setInterval(() => {
      setCurrentCycle((prev) => {
        if (prev >= selectedEngine.maxCycle) {
          setIsSimulating(false);
          return selectedEngine.maxCycle;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulating, selectedEngine, simulationSpeed]);

  // Compute telemetry point for current cycle, incorporating any user overrides
  const currentTelemetryPoint = useMemo<TelemetryPoint>(() => {
    if (!selectedEngine || !selectedEngine.history || selectedEngine.history.length === 0) {
      return {
        cycle: 1,
        predictedRul: 125,
        trueRul: 125,
        s_2: SENSOR_BASELINES.s_2.baseline,
        s_3: SENSOR_BASELINES.s_3.baseline,
        s_4: SENSOR_BASELINES.s_4.baseline,
        s_11: SENSOR_BASELINES.s_11.baseline,
        s_12: SENSOR_BASELINES.s_12.baseline,
        rolling_s2: SENSOR_BASELINES.s_2.baseline,
        rolling_s3: SENSOR_BASELINES.s_3.baseline,
        rolling_s4: SENSOR_BASELINES.s_4.baseline,
        rolling_s11: SENSOR_BASELINES.s_11.baseline,
        rolling_s12: SENSOR_BASELINES.s_12.baseline,
        riskScore: 0,
        status: 'NOMINAL',
        primaryStress: 'None',
      };
    }

    const clampedCycle = Math.max(1, Math.min(currentCycle, selectedEngine.history.length));
    const basePoint = selectedEngine.history[clampedCycle - 1];

    // Apply manual user overrides if any
    const activeSensors: SensorReading = {
      s_2: sensorOverrides.s_2 ?? basePoint.s_2,
      s_3: sensorOverrides.s_3 ?? basePoint.s_3,
      s_4: sensorOverrides.s_4 ?? basePoint.s_4,
      s_11: sensorOverrides.s_11 ?? basePoint.s_11,
      s_12: sensorOverrides.s_12 ?? basePoint.s_12,
    };

    const priorPoints = selectedEngine.history.slice(Math.max(0, clampedCycle - 5), clampedCycle - 1);
    const inference = predictRul({
      time_cycles: clampedCycle,
      currentSensors: activeSensors,
      historySensors: priorPoints,
    });

    const trueRul = Math.max(0, selectedEngine.maxCycle - clampedCycle);

    return {
      cycle: clampedCycle,
      s_2: activeSensors.s_2,
      s_3: activeSensors.s_3,
      s_4: activeSensors.s_4,
      s_11: activeSensors.s_11,
      s_12: activeSensors.s_12,
      predictedRul: inference.predictedRul,
      trueRul,
      rolling_s2: inference.rollingAverages.s_2,
      rolling_s3: inference.rollingAverages.s_3,
      rolling_s4: inference.rollingAverages.s_4,
      rolling_s11: inference.rollingAverages.s_11,
      rolling_s12: inference.rollingAverages.s_12,
      riskScore: inference.riskScore,
      status: inference.status,
      primaryStress: inference.primaryRiskFactor,
    };
  }, [selectedEngine, currentCycle, sensorOverrides]);

  // Trajectory history up to current cycle (for charts)
  const historicalTrajectory = useMemo(() => {
    if (!selectedEngine || !selectedEngine.history) return [];
    const clampedCycle = Math.max(1, Math.min(currentCycle, selectedEngine.history.length));
    const historySlice = selectedEngine.history.slice(0, clampedCycle - 1);
    return [...historySlice, currentTelemetryPoint];
  }, [selectedEngine, currentCycle, currentTelemetryPoint]);

  // Filter and sort fleet
  const filteredFleet = useMemo(() => {
    let result = [...fleet];

    if (filterStatus !== 'ALL') {
      result = result.filter((unit) => unit.status === filterStatus);
    }

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (unit) =>
          unit.unitId.toString().includes(q) ||
          unit.tailNumber.toLowerCase().includes(q) ||
          unit.airline.toLowerCase().includes(q) ||
          unit.aircraftModel.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'rul_asc':
          return a.predictedRul - b.predictedRul;
        case 'rul_desc':
          return b.predictedRul - a.predictedRul;
        case 'unit_asc':
          return a.unitId - b.unitId;
        case 'cycle_desc':
          return b.currentCycle - a.currentCycle;
        case 'health_asc':
          return a.healthScore - b.healthScore;
        default:
          return a.unitId - b.unitId;
      }
    });

    return result;
  }, [fleet, filterStatus, searchTerm, sortBy]);

  const value = {
    fleet,
    selectedUnitId,
    setSelectedUnitId,
    selectedEngine,
    activeScreen,
    setActiveScreen,
    currentCycle,
    setCurrentCycle,
    isSimulating,
    setIsSimulating,
    simulationSpeed,
    setSimulationSpeed,
    sensorOverrides,
    setSensorOverride,
    resetSensorOverrides,
    loadPreset,
    currentTelemetryPoint,
    historicalTrajectory,
    filterStatus,
    setFilterStatus,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    filteredFleet,
    selectedArchitectureStage,
    setSelectedArchitectureStage,
  };

  return <PdmContext.Provider value={value}>{children}</PdmContext.Provider>;
}

export function usePdm() {
  const ctx = useContext(PdmContext);
  if (!ctx) {
    throw new Error('usePdm must be used within a PdmProvider');
  }
  return ctx;
}
