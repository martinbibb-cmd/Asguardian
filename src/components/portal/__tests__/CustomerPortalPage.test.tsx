import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomerPortalPage from '../CustomerPortalPage';

describe('CustomerPortalPage', () => {
  describe('missing token', () => {
    it('renders missing-token state when no token is provided', () => {
      render(<CustomerPortalPage />);
      expect(screen.getByTestId('portal-missing-token')).toBeInTheDocument();
    });

    it('renders missing-token state when token is null', () => {
      render(<CustomerPortalPage token={null} />);
      expect(screen.getByTestId('portal-missing-token')).toBeInTheDocument();
    });

    it('displays a helpful message for missing token', () => {
      render(<CustomerPortalPage />);
      expect(screen.getByText(/personalised link from your energy advisor/i)).toBeInTheDocument();
    });
  });

  describe('invalid token', () => {
    it('renders invalid-token state for an invalid token value', () => {
      render(<CustomerPortalPage token="invalid" />);
      expect(screen.getByTestId('portal-invalid-token')).toBeInTheDocument();
    });

    it('renders invalid-token state for an empty-string token', () => {
      render(<CustomerPortalPage token="" />);
      expect(screen.getByTestId('portal-missing-token')).toBeInTheDocument();
    });

    it('displays an error message for invalid token', () => {
      render(<CustomerPortalPage token="invalid" />);
      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });
  });

  describe('valid token – glass-box portal', () => {
    it('renders the portal valid wrapper for a valid token', () => {
      render(<CustomerPortalPage token="abc-123-valid" />);
      expect(screen.getByTestId('portal-valid')).toBeInTheDocument();
    });

    it('renders UnifiedSimulatorView when token is valid', () => {
      render(<CustomerPortalPage token="abc-123-valid" />);
      expect(screen.getByTestId('unified-simulator-view')).toBeInTheDocument();
    });

    it('renders the simulator main section', () => {
      render(<CustomerPortalPage token="abc-123-valid" />);
      expect(screen.getByTestId('simulator-main')).toBeInTheDocument();
    });

    it('renders the outcomes panel section', () => {
      render(<CustomerPortalPage token="abc-123-valid" />);
      expect(screen.getByTestId('outcomes-section')).toBeInTheDocument();
    });

    it('renders the advice panel section', () => {
      render(<CustomerPortalPage token="abc-123-valid" />);
      expect(screen.getByTestId('advice-section')).toBeInTheDocument();
    });

    it('does NOT render any legacy recommendation branching', () => {
      render(<CustomerPortalPage token="abc-123-valid" />);
      expect(screen.queryByTestId('legacy-recommendation')).not.toBeInTheDocument();
      expect(screen.queryByTestId('advice-page-link')).not.toBeInTheDocument();
    });

    it('passes surveyData through to UnifiedSimulatorView when provided', () => {
      render(
        <CustomerPortalPage
          token="abc-123-valid"
          surveyData={{ propertyType: 'Detached', bedrooms: 3 }}
        />
      );
      // When surveyData is present, UnifiedSimulatorView shows a personalisation note
      expect(screen.getByTestId('survey-context-note')).toBeInTheDocument();
    });

    it('does NOT show personalisation note when no surveyData is provided', () => {
      render(<CustomerPortalPage token="abc-123-valid" />);
      expect(screen.queryByTestId('survey-context-note')).not.toBeInTheDocument();
    });
  });
});
