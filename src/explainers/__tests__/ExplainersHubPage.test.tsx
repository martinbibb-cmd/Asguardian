import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExplainersHubPage from '../ExplainersHubPage';

describe('ExplainersHubPage', () => {
  describe('initial hub view', () => {
    it('renders the hub landing view', () => {
      render(<ExplainersHubPage />);
      expect(screen.getByTestId('explainers-hub')).toBeInTheDocument();
    });

    it('shows the first survey question', () => {
      render(<ExplainersHubPage />);
      expect(screen.getByTestId('survey-step')).toBeInTheDocument();
    });

    it('shows step progress indicator', () => {
      render(<ExplainersHubPage />);
      expect(screen.getByTestId('survey-progress')).toHaveTextContent('Step 1 of 3');
    });

    it('does NOT show the simulator on initial render', () => {
      render(<ExplainersHubPage />);
      expect(screen.queryByTestId('unified-simulator-view')).not.toBeInTheDocument();
    });

    it('does NOT have a separate Decision Advice CTA', () => {
      render(<ExplainersHubPage />);
      expect(screen.queryByTestId('decision-advice-cta')).not.toBeInTheDocument();
      expect(screen.queryByText(/get advice/i)).not.toBeInTheDocument();
    });
  });

  describe('survey-backed flow leads to UnifiedSimulatorView', () => {
    function completeSurvey() {
      render(<ExplainersHubPage />);

      // Step 1: property type
      fireEvent.click(screen.getByTestId('survey-option-detached'));

      // Step 2: bedrooms
      fireEvent.click(screen.getByTestId('survey-option-3'));

      // Step 3: current system
      fireEvent.click(screen.getByTestId('survey-option-gas-boiler'));
    }

    it('navigates to the simulator after completing all survey steps', () => {
      completeSurvey();
      expect(screen.getByTestId('explainers-hub-simulator')).toBeInTheDocument();
    });

    it('renders UnifiedSimulatorView after survey completion', () => {
      completeSurvey();
      expect(screen.getByTestId('unified-simulator-view')).toBeInTheDocument();
    });

    it('shows personalisation note in UnifiedSimulatorView (surveyData passed)', () => {
      completeSurvey();
      expect(screen.getByTestId('survey-context-note')).toBeInTheDocument();
    });

    it('does NOT navigate to a separate advice page after survey', () => {
      completeSurvey();
      expect(screen.queryByTestId('advice-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('explainers-hub')).not.toBeInTheDocument();
    });
  });

  describe('survey progression', () => {
    it('advances to step 2 after answering step 1', () => {
      render(<ExplainersHubPage />);
      fireEvent.click(screen.getByTestId('survey-option-detached'));
      expect(screen.getByTestId('survey-progress')).toHaveTextContent('Step 2 of 3');
    });

    it('advances to step 3 after answering step 2', () => {
      render(<ExplainersHubPage />);
      fireEvent.click(screen.getByTestId('survey-option-detached'));
      fireEvent.click(screen.getByTestId('survey-option-3'));
      expect(screen.getByTestId('survey-progress')).toHaveTextContent('Step 3 of 3');
    });
  });
});
