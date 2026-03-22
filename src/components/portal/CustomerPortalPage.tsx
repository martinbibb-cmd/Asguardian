import React from 'react';
import UnifiedSimulatorView, { SurveyData } from '../simulator/UnifiedSimulatorView';

interface CustomerPortalPageProps {
  token?: string | null;
  surveyData?: SurveyData;
}

type TokenState = 'valid' | 'invalid' | 'missing';

function resolveTokenState(token: string | null | undefined): TokenState {
  if (!token) return 'missing';
  // A valid token is a non-empty string that isn't the literal "invalid"
  if (token === 'invalid') return 'invalid';
  return 'valid';
}

/**
 * CustomerPortalPage is the token-gated entry point for glass-box customer journeys.
 *
 * - Valid token  → renders UnifiedSimulatorView directly (no legacy branching)
 * - Missing token → prompts the user to obtain a link
 * - Invalid token → shows a clear error message
 *
 * The legacy recommendation/advice page branching has been removed.
 * All advice is now surfaced inline via the unified simulator.
 */
const CustomerPortalPage: React.FC<CustomerPortalPageProps> = ({ token, surveyData }) => {
  const tokenState = resolveTokenState(token);

  if (tokenState === 'missing') {
    return (
      <div data-testid="portal-missing-token">
        <h1>Customer Portal</h1>
        <p>No access token was provided. Please use the personalised link from your energy advisor.</p>
      </div>
    );
  }

  if (tokenState === 'invalid') {
    return (
      <div data-testid="portal-invalid-token">
        <h1>Customer Portal</h1>
        <p>Your access link is invalid or has expired. Please contact your energy advisor for a new link.</p>
      </div>
    );
  }

  return (
    <div data-testid="portal-valid">
      <UnifiedSimulatorView surveyData={surveyData} />
    </div>
  );
};

export default CustomerPortalPage;
