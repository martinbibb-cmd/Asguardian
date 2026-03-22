import React, { useState } from 'react';
import './UnifiedSimulatorView.css';
import SimulatorStepper, { StepperResult } from '../../explainers/lego/simulator/SimulatorStepper';
import PerformanceOutcomesPanel, { SimulatorOutcomes } from '../outcomes/PerformanceOutcomesPanel';
import AdvicePanel, { SimulatorAdvice } from '../advice/AdvicePanel';

export interface SurveyData {
  propertyType?: string;
  bedrooms?: number;
  currentSystem?: string;
}

interface UnifiedSimulatorViewProps {
  surveyData?: SurveyData;
}

/**
 * UnifiedSimulatorView is the primary glass-box customer surface.
 *
 * Layout:
 *  - Compare simulator (SimulatorStepper) as the main body
 *  - PerformanceOutcomesPanel alongside the simulation
 *  - AdvicePanel inline — advice is derived from simulator truth, not a
 *    separate recommendation page
 *
 * This replaces the legacy split recommendation/advice flow.
 */
const UnifiedSimulatorView: React.FC<UnifiedSimulatorViewProps> = ({ surveyData }) => {
  const [outcomes, setOutcomes] = useState<SimulatorOutcomes | null>(null);
  const [advice, setAdvice] = useState<SimulatorAdvice | null>(null);

  const handleSimulatorComplete = (result: StepperResult) => {
    setOutcomes(result.outcomes);
    setAdvice(result.advice);
  };

  return (
    <div className="unified-simulator-view" data-testid="unified-simulator-view">
      {surveyData && (
        <p className="unified-simulator-view__survey-note" data-testid="survey-context-note">
          Results personalised for your home profile.
        </p>
      )}

      <div className="unified-simulator-view__layout">
        <section className="unified-simulator-view__simulator" data-testid="simulator-main">
          <SimulatorStepper onComplete={handleSimulatorComplete} />
        </section>

        <aside className="unified-simulator-view__panels">
          <section data-testid="outcomes-section">
            <PerformanceOutcomesPanel outcomes={outcomes} />
          </section>

          <section data-testid="advice-section">
            <AdvicePanel advice={advice} />
          </section>
        </aside>
      </div>
    </div>
  );
};

export default UnifiedSimulatorView;
