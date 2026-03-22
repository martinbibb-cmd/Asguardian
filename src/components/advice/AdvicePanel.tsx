import React from 'react';
import './AdvicePanel.css';

export interface SimulatorAdvice {
  summary: string;
  recommendations: string[];
  systemLabel: string;
}

interface AdvicePanelProps {
  advice: SimulatorAdvice | null;
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ advice }) => {
  if (!advice) {
    return (
      <div className="advice-panel advice-panel--empty" data-testid="advice-panel-empty">
        <p>Run the simulator to see personalised advice.</p>
      </div>
    );
  }

  return (
    <div className="advice-panel" data-testid="advice-panel">
      <h3 className="advice-panel__title">Advice: {advice.systemLabel}</h3>
      <p className="advice-panel__summary">{advice.summary}</p>
      {advice.recommendations.length > 0 && (
        <ul className="advice-panel__list" data-testid="advice-panel-recommendations">
          {advice.recommendations.map((rec, idx) => (
            <li key={idx} className="advice-panel__item">{rec}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdvicePanel;
