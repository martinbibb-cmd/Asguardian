/**
 * API Service for communicating with the Gemini AI Worker
 * Worker endpoint: https://ai-agent.martinbibb.workers.dev
 */

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://asguard.martinbibb.workers.dev';

/**
 * Send a command to the Gemini AI worker
 * @param {string} message - The user's command/message
 * @param {Object} context - Game context (heat, biomass, units)
 * @returns {Promise<Object>} Response from the AI
 */
export const sendCommand = async (message, context = {}) => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Health check for the API endpoint
 * @returns {Promise<boolean>} True if API is reachable
 */
export const healthCheck = async () => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default {
  sendCommand,
  healthCheck,
};
