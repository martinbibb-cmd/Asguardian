/**
 * API Service for communicating with the Gemini AI Worker
 * Worker endpoint: https://asguard.martinbibb.workers.dev
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
    console.log(`[API] Sending command to: ${API_ENDPOINT}`);
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
      const errorText = await response.text();
      console.error(`[API] HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Request failed:', error.message);
    console.error('[API] Endpoint:', API_ENDPOINT);
    console.error('[API] Full error:', error);
    throw error;
  }
};

/**
 * Health check for the API endpoint
 * @returns {Promise<boolean>} True if API is reachable
 */
export const healthCheck = async () => {
  try {
    console.log(`[API] Health check to: ${API_ENDPOINT}`);
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
    });
    const isHealthy = response.ok;
    console.log(`[API] Health check result: ${isHealthy ? 'ONLINE' : 'OFFLINE'} (status: ${response.status})`);
    return isHealthy;
  } catch (error) {
    console.error('[API] Health check failed:', error.message);
    console.error('[API] Endpoint:', API_ENDPOINT);
    console.error('[API] Full error:', error);
    return false;
  }
};

export default {
  sendCommand,
  healthCheck,
};
