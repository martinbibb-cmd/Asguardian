import React, { useState } from 'react';
import UnifiedSimulatorView, { SurveyData } from '../components/simulator/UnifiedSimulatorView';

type HubView = 'hub' | 'simulator';

interface SurveyQuestion {
  id: string;
  label: string;
  options: string[];
}

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  { id: 'propertyType', label: 'Property type', options: ['Detached', 'Semi-detached', 'Terraced', 'Flat'] },
  { id: 'bedrooms', label: 'Number of bedrooms', options: ['1', '2', '3', '4', '5+'] },
  { id: 'currentSystem', label: 'Current heating system', options: ['Gas boiler', 'Oil boiler', 'Electric storage heaters', 'Other'] },
];

/**
 * ExplainersHubPage provides a survey-backed entry point that leads directly
 * to the UnifiedSimulatorView.
 *
 * The legacy "Decision Advice" CTA and separate advice navigation have been
 * removed. Survey-backed flows render the unified simulator inline.
 */
const ExplainersHubPage: React.FC = () => {
  const [view, setView] = useState<HubView>('hub');
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [surveyStep, setSurveyStep] = useState(0);

  const currentQuestion = SURVEY_QUESTIONS[surveyStep];

  const handleAnswer = (answer: string) => {
    const updated = { ...surveyAnswers, [currentQuestion.id]: answer };
    setSurveyAnswers(updated);

    if (surveyStep < SURVEY_QUESTIONS.length - 1) {
      setSurveyStep((s) => s + 1);
    } else {
      // Survey complete — go directly to unified simulator
      setView('simulator');
    }
  };

  const buildSurveyData = (): SurveyData => {
    const bedroomsRaw = surveyAnswers['bedrooms'];
    let bedrooms: number | undefined;
    if (bedroomsRaw) {
      // Handle '5+' as 5; parseInt safely ignores trailing non-numeric chars
      bedrooms = parseInt(bedroomsRaw, 10) || undefined;
    }
    return {
      propertyType: surveyAnswers['propertyType'],
      bedrooms,
      currentSystem: surveyAnswers['currentSystem'],
    };
  };

  if (view === 'simulator') {
    return (
      <div data-testid="explainers-hub-simulator">
        <UnifiedSimulatorView surveyData={buildSurveyData()} />
      </div>
    );
  }

  return (
    <div data-testid="explainers-hub">
      <h1>Find the right heating system for your home</h1>
      <p>Answer a few quick questions and we'll run a personalised simulation for you.</p>

      <div data-testid="survey-step">
        <h2>{currentQuestion.label}</h2>
        <ul>
          {currentQuestion.options.map((opt) => (
            <li key={opt}>
              <button
                onClick={() => handleAnswer(opt)}
                data-testid={`survey-option-${opt.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
        <p data-testid="survey-progress">
          Step {surveyStep + 1} of {SURVEY_QUESTIONS.length}
        </p>
      </div>
    </div>
  );
};

export default ExplainersHubPage;
