import React from 'react';
import './PerformanceOutcomesPanel.css';

export interface SimulatorOutcomes {
  annualEnergySavingKwh: number;
  annualCostSavingGbp: number;
  carbonSavingKgCo2: number;
  systemLabel: string;
}

interface PerformanceOutcomesPanelProps {
  outcomes: SimulatorOutcomes | null;
}

const PerformanceOutcomesPanel: React.FC<PerformanceOutcomesPanelProps> = ({ outcomes }) => {
  if (!outcomes) {
    return (
      <div className="outcomes-panel outcomes-panel--empty" data-testid="outcomes-panel-empty">
        <p>Outcomes will appear here once the simulation has run.</p>
      </div>
    );
  }

  return (
    <div className="outcomes-panel" data-testid="outcomes-panel">
      <h3 className="outcomes-panel__title">Performance Outcomes: {outcomes.systemLabel}</h3>
      <div className="outcomes-panel__metrics">
        <div className="outcomes-panel__metric" data-testid="outcomes-energy">
          <span className="outcomes-panel__metric-label">Annual energy saving</span>
          <span className="outcomes-panel__metric-value">{outcomes.annualEnergySavingKwh} kWh</span>
        </div>
        <div className="outcomes-panel__metric" data-testid="outcomes-cost">
          <span className="outcomes-panel__metric-label">Annual cost saving</span>
          <span className="outcomes-panel__metric-value">£{outcomes.annualCostSavingGbp}</span>
        </div>
        <div className="outcomes-panel__metric" data-testid="outcomes-carbon">
          <span className="outcomes-panel__metric-label">Carbon saving</span>
          <span className="outcomes-panel__metric-value">{outcomes.carbonSavingKgCo2} kg CO₂</span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOutcomesPanel;
