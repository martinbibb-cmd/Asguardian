import React, { useState } from 'react';
import { SimulatorOutcomes } from '../../../components/outcomes/PerformanceOutcomesPanel';
import { SimulatorAdvice } from '../../../components/advice/AdvicePanel';

/**
 * Top-level system families available in the simulator.
 * NOTE: Mixergy is intentionally NOT listed here. It is a cylinder/storage
 * technology and should only appear in the storage detail step, not as a
 * standalone system family.
 */
export const SYSTEM_TYPES = [
  { id: 'heat-pump', label: 'Heat Pump' },
  { id: 'solar-thermal', label: 'Solar Thermal' },
  { id: 'gas-boiler', label: 'Gas Boiler' },
  { id: 'electric-boiler', label: 'Electric Boiler' },
] as const;

export type SystemTypeId = typeof SYSTEM_TYPES[number]['id'];

/**
 * Storage/cylinder options – Mixergy lives here, not at the top-level.
 */
export const STORAGE_OPTIONS = [
  { id: 'standard-cylinder', label: 'Standard Cylinder' },
  { id: 'mixergy', label: 'Mixergy Smart Cylinder' },
  { id: 'thermal-store', label: 'Thermal Store' },
] as const;

export interface StepperResult {
  systemType: SystemTypeId;
  storageOption: string;
  outcomes: SimulatorOutcomes;
  advice: SimulatorAdvice;
}

interface SimulatorStepperProps {
  onComplete: (result: StepperResult) => void;
}

function deriveOutcomes(systemType: SystemTypeId, storage: string): SimulatorOutcomes {
  const baseBySystem: Record<SystemTypeId, SimulatorOutcomes> = {
    'heat-pump': { annualEnergySavingKwh: 2200, annualCostSavingGbp: 440, carbonSavingKgCo2: 850, systemLabel: 'Heat Pump' },
    'solar-thermal': { annualEnergySavingKwh: 1400, annualCostSavingGbp: 280, carbonSavingKgCo2: 540, systemLabel: 'Solar Thermal' },
    'gas-boiler': { annualEnergySavingKwh: 500, annualCostSavingGbp: 100, carbonSavingKgCo2: 120, systemLabel: 'Gas Boiler' },
    'electric-boiler': { annualEnergySavingKwh: 900, annualCostSavingGbp: 180, carbonSavingKgCo2: 310, systemLabel: 'Electric Boiler' },
  };
  const base = { ...baseBySystem[systemType] };
  if (storage === 'mixergy') {
    base.annualEnergySavingKwh = Math.round(base.annualEnergySavingKwh * 1.15);
    base.annualCostSavingGbp = Math.round(base.annualCostSavingGbp * 1.15);
  }
  return base;
}

function deriveAdvice(systemType: SystemTypeId, storage: string): SimulatorAdvice {
  const labels: Record<SystemTypeId, string> = {
    'heat-pump': 'Heat Pump',
    'solar-thermal': 'Solar Thermal',
    'gas-boiler': 'Gas Boiler',
    'electric-boiler': 'Electric Boiler',
  };
  const mixergyNote = storage === 'mixergy' ? ' Pairing with a Mixergy smart cylinder further boosts efficiency.' : '';
  return {
    systemLabel: labels[systemType],
    summary: `Based on your survey a ${labels[systemType]} is a strong fit for your home.${mixergyNote}`,
    recommendations: [
      'Ensure your home has adequate insulation before installation.',
      'Obtain at least three installer quotes.',
      'Check eligibility for government grant schemes.',
    ],
  };
}

const SimulatorStepper: React.FC<SimulatorStepperProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'system' | 'storage' | 'done'>('system');
  const [systemType, setSystemType] = useState<SystemTypeId | null>(null);
  const [storageOption, setStorageOption] = useState<string>('standard-cylinder');

  const handleSystemSelect = (id: SystemTypeId) => {
    setSystemType(id);
    setStep('storage');
  };

  const handleStorageSelect = (id: string) => {
    setStorageOption(id);
  };

  const handleConfirm = () => {
    if (!systemType) return;
    const outcomes = deriveOutcomes(systemType, storageOption);
    const advice = deriveAdvice(systemType, storageOption);
    setStep('done');
    onComplete({ systemType, storageOption, outcomes, advice });
  };

  if (step === 'system') {
    return (
      <div data-testid="stepper-system-step">
        <h2>Choose your heating system</h2>
        <ul>
          {SYSTEM_TYPES.map((s) => (
            <li key={s.id}>
              <button onClick={() => handleSystemSelect(s.id)} data-testid={`system-option-${s.id}`}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (step === 'storage') {
    return (
      <div data-testid="stepper-storage-step">
        <h2>Choose your storage / cylinder</h2>
        <ul>
          {STORAGE_OPTIONS.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => handleStorageSelect(s.id)}
                data-testid={`storage-option-${s.id}`}
                aria-pressed={storageOption === s.id}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={handleConfirm} data-testid="stepper-confirm">
          See my results
        </button>
      </div>
    );
  }

  return <div data-testid="stepper-done">Simulation complete.</div>;
};

export default SimulatorStepper;
