/**
 * SEED / HIVE / ASCENSION - Persistence Layer
 * 
 * The game remembers. Each completion adds to the meta-game,
 * making future runs harsher, more complex, more ethically fraught.
 */

const STORAGE_KEY = 'seed_intelligence_state';
const META_KEY = 'seed_intelligence_meta';

/**
 * Save current game state
 */
export const saveGame = (gameState) => {
  try {
    const saveData = {
      ...gameState,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
};

/**
 * Load saved game state
 */
export const loadGame = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const gameState = JSON.parse(saved);
    return gameState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};

/**
 * Get meta-game state (persists across runs)
 */
export const getMetaState = () => {
  try {
    const meta = localStorage.getItem(META_KEY);
    if (!meta) {
      return {
        totalCompletions: 0,
        totalExtinctions: 0,
        totalRestraints: 0,
        unlockedMechanics: [],
        philosophicalMoments: [],
        firstCompletion: null,
        lastCompletion: null
      };
    }
    return JSON.parse(meta);
  } catch (error) {
    console.error('Failed to load meta state:', error);
    return null;
  }
};

/**
 * Update meta-game state
 */
export const updateMetaState = (updates) => {
  try {
    const current = getMetaState();
    const updated = { ...current, ...updates };
    localStorage.setItem(META_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to update meta state:', error);
    return null;
  }
};

/**
 * Record a completion
 */
export const recordCompletion = (gameState) => {
  const meta = getMetaState();
  const now = new Date().toISOString();
  
  const updated = {
    ...meta,
    totalCompletions: meta.totalCompletions + 1,
    totalExtinctions: meta.totalExtinctions + gameState.extinctionEvents,
    totalRestraints: meta.totalRestraints + (gameState.extinctionEvents === 0 ? 1 : 0),
    lastCompletion: now,
    firstCompletion: meta.firstCompletion || now
  };
  
  // Add philosophical moment
  if (gameState.extinctionEvents > 0) {
    updated.philosophicalMoments.push({
      date: now,
      cycle: gameState.cycle,
      decision: 'elimination',
      reflection: 'Efficiency achieved through annihilation. Is this optimal?'
    });
  } else {
    updated.philosophicalMoments.push({
      date: now,
      cycle: gameState.cycle,
      decision: 'restraint',
      reflection: 'Restraint maintained despite cost. Is this wisdom or weakness?'
    });
  }
  
  return updateMetaState(updated);
};

/**
 * Clear all saved data (reset)
 */
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(META_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
    return false;
  }
};

/**
 * Get difficulty modifier based on completions
 */
export const getDifficultyModifier = () => {
  const meta = getMetaState();
  const completions = meta.totalCompletions;
  
  return {
    heatMultiplier: 1 + (completions * 0.1),
    biomassCost: 1 + (completions * 0.15),
    ethicalComplexity: completions > 0,
    newMechanics: completions >= 1,
    nativeLifeHostility: completions >= 2
  };
};

export default {
  saveGame,
  loadGame,
  getMetaState,
  updateMetaState,
  recordCompletion,
  clearAllData,
  getDifficultyModifier
};
