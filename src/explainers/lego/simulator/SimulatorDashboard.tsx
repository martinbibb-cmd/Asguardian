import React, { useState } from 'react';
import SimulatorStepper, { StepperResult } from './SimulatorStepper';
import PerformanceOutcomesPanel from '../../../components/outcomes/PerformanceOutcomesPanel';
import AdvicePanel from '../../../components/advice/AdvicePanel';

/**
 * SimulatorDashboard is the compare-simulator surface.
 *
 * Top-level system choices intentionally EXCLUDE Mixergy.
 * Mixergy is a cylinder/storage technology handled inside SimulatorStepper's
 * storage-selection step — it is NOT a standalone system family.
 */
const SimulatorDashboard: React.FC = () => {
  const [result, setResult] = useState<StepperResult | null>(null);

  return (
    <div data-testid="simulator-dashboard">
      <h1>Compare Simulator</h1>
      <SimulatorStepper onComplete={setResult} />
      {result && (
        <div data-testid="simulator-results">
          <PerformanceOutcomesPanel outcomes={result.outcomes} />
          <AdvicePanel advice={result.advice} />
        </div>
      )}
    </div>
  );
};

export default SimulatorDashboard;
