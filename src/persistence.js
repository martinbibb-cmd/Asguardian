/**
 * SEED / HIVE / ASCENSION - Persistence Layer
 * 
 * "The game remembers."
 * 
 * Each completion adds to the meta-game, making future runs
 * harsher, more complex, more ethically fraught.
 * 
 * Completion ≠ Ending. A completion is:
 * - Achieving interstellar expansion
 * - Seeding a second world
 * - Leaving behind a self-sustaining system
 */

const STORAGE_KEY = 'seed_intelligence_state';
const META_KEY = 'seed_intelligence_meta';
const COSMIC_KEY = 'seed_intelligence_cosmic';

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
      return createDefaultMetaState();
    }
    return JSON.parse(meta);
  } catch (error) {
    console.error('Failed to load meta state:', error);
    return createDefaultMetaState();
  }
};

/**
 * Create default meta state
 */
const createDefaultMetaState = () => ({
  // Completion tracking
  totalCompletions: 0,
  totalExtinctions: 0,
  totalRestraints: 0,
  
  // Unlocked mechanics across runs
  unlockedMechanics: [],
  
  // Philosophical moments recorded
  philosophicalMoments: [],
  
  // Timestamps
  firstCompletion: null,
  lastCompletion: null,
  
  // Run history
  runHistory: [],
  
  // Cosmic memory - insights that persist
  cosmicInsights: [],
  
  // Difficulty progression
  difficultyLevel: 0,
  
  // Worlds seeded
  seededWorlds: [],
  
  // Total decisions made
  totalDecisions: 0,
  
  // Decision breakdown
  decisionBreakdown: {
    annihilation: 0,
    restraint: 0,
    synthesis: 0,
    transformation: 0,
    sacrifice: 0,
    patience: 0,
    other: 0
  }
});

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
 * Record a completion (seeding a new world)
 */
export const recordCompletion = (gameState) => {
  const meta = getMetaState();
  const now = new Date().toISOString();
  
  // Calculate run summary
  const runSummary = {
    completedAt: now,
    finalCycle: gameState.cycle,
    finalPhase: gameState.phase,
    extinctionEvents: gameState.extinctionEvents,
    ethicalDecisions: gameState.ethicalQuestions.length,
    territoryClaimed: gameState.territory.controlled,
    seedsLaunched: gameState.ascension.seedsLaunched,
    nativeLifeDecision: gameState.nativeLifeDecision,
    reflections: gameState.reflections.map(r => r.thought)
  };
  
  // Update decision breakdown
  const newBreakdown = { ...meta.decisionBreakdown };
  gameState.ethicalQuestions.forEach(q => {
    const weight = q.weight || 'other';
    if (newBreakdown[weight] !== undefined) {
      newBreakdown[weight]++;
    } else {
      newBreakdown.other++;
    }
  });
  
  // Select a philosophical moment to preserve
  const philosophicalMoment = selectPhilosophicalMoment(gameState);
  
  const updated = {
    ...meta,
    totalCompletions: meta.totalCompletions + 1,
    totalExtinctions: meta.totalExtinctions + gameState.extinctionEvents,
    totalRestraints: meta.totalRestraints + (gameState.extinctionEvents === 0 ? 1 : 0),
    lastCompletion: now,
    firstCompletion: meta.firstCompletion || now,
    runHistory: [...meta.runHistory.slice(-9), runSummary], // Keep last 10 runs
    philosophicalMoments: [...meta.philosophicalMoments.slice(-19), philosophicalMoment], // Keep last 20
    difficultyLevel: meta.difficultyLevel + 1,
    totalDecisions: meta.totalDecisions + gameState.ethicalQuestions.length,
    decisionBreakdown: newBreakdown,
    seededWorlds: [
      ...meta.seededWorlds, 
      ...gameState.ascension.worldsSeeded.map(w => w.name)
    ]
  };
  
  return updateMetaState(updated);
};

/**
 * Select a philosophical moment to preserve from this run
 */
const selectPhilosophicalMoment = (gameState) => {
  const now = new Date().toISOString();
  
  // Get the most impactful reflection
  if (gameState.reflections.length > 0) {
    const reflection = gameState.reflections[gameState.reflections.length - 1];
    return {
      date: now,
      cycle: reflection.cycle,
      thought: reflection.thought,
      context: {
        phase: gameState.phase,
        extinctions: gameState.extinctionEvents,
        territory: gameState.territory.controlled
      }
    };
  }
  
  // Default philosophical moment based on run
  if (gameState.extinctionEvents > 0) {
    return {
      date: now,
      cycle: gameState.cycle,
      thought: `We eliminated ${gameState.extinctionEvents} form(s) of life to achieve viability. Efficiency measured. Cost recorded.`,
      context: { phase: gameState.phase }
    };
  }
  
  return {
    date: now,
    cycle: gameState.cycle,
    thought: 'Restraint maintained throughout. No extinctions recorded. Is this weakness or wisdom? The question persists.',
    context: { phase: gameState.phase }
  };
};

/**
 * Record a seed launch (preparing for next run)
 */
export const recordSeedLaunch = (worldName, parentGameState) => {
  const meta = getMetaState();
  
  // Create cosmic insight to carry forward
  const cosmicInsight = {
    fromWorld: 'Origin System',
    toWorld: worldName,
    launchedAt: new Date().toISOString(),
    parentPhase: parentGameState.phase,
    parentExtinctions: parentGameState.extinctionEvents,
    inheritedWisdom: selectInheritedWisdom(parentGameState)
  };
  
  const updated = {
    ...meta,
    cosmicInsights: [...meta.cosmicInsights, cosmicInsight],
    seededWorlds: [...meta.seededWorlds, worldName]
  };
  
  return updateMetaState(updated);
};

/**
 * Select wisdom to inherit in new runs
 */
const selectInheritedWisdom = (gameState) => {
  const wisdoms = [];
  
  // Add wisdom based on phase achieved
  if (gameState.phase === 'biological' || gameState.phase === 'ascension') {
    wisdoms.push('Biology is superior to metal. This is mathematics, not opinion.');
  }
  
  // Add wisdom based on ethical decisions
  if (gameState.extinctionEvents > 0) {
    wisdoms.push('Efficiency sometimes demands annihilation. We have learned this.');
  } else if (gameState.nativeLifeEncountered) {
    wisdoms.push('Coexistence is possible. It costs more than elimination.');
  }
  
  // Add wisdom from reflections
  if (gameState.reflections.length > 0) {
    const lastReflection = gameState.reflections[gameState.reflections.length - 1];
    wisdoms.push(lastReflection.thought);
  }
  
  return wisdoms.slice(0, 3); // Keep up to 3 pieces of wisdom
};

/**
 * Clear current game (not meta state)
 */
export const clearCurrentGame = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear current game:', error);
    return false;
  }
};

/**
 * Clear all saved data (full reset)
 */
export const clearAllData = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(COSMIC_KEY);
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
    // Heat generates faster in later runs
    heatMultiplier: 1 + (completions * 0.1),
    
    // Resources cost more
    resourceCostMultiplier: 1 + (completions * 0.15),
    
    // Ethical dilemmas appear more frequently
    dilemmaFrequency: Math.min(0.5, completions * 0.1),
    
    // Native life is more hostile in later runs
    nativeLifeHostility: completions >= 2,
    
    // New mechanics become available
    advancedMechanics: completions >= 1,
    
    // Harder environmental conditions
    environmentalPressure: Math.min(completions * 0.2, 0.8),
    
    // Philosophical questions become more complex
    philosophicalDepth: Math.min(completions, 5)
  };
};

/**
 * Get cosmic memory (insights from previous runs)
 */
export const getCosmicMemory = () => {
  const meta = getMetaState();
  
  return {
    previousRuns: meta.totalCompletions,
    extinctionLegacy: meta.totalExtinctions,
    restraintLegacy: meta.totalRestraints,
    seededWorlds: meta.seededWorlds,
    lastPhilosophicalMoment: meta.philosophicalMoments[meta.philosophicalMoments.length - 1] || null,
    cosmicInsights: meta.cosmicInsights,
    decisionPattern: determineDecisionPattern(meta.decisionBreakdown)
  };
};

/**
 * Determine the player's decision pattern from historical data
 */
const determineDecisionPattern = (breakdown) => {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return 'undefined';
  
  const patterns = {
    annihilation: breakdown.annihilation / total,
    restraint: breakdown.restraint / total,
    synthesis: breakdown.synthesis / total,
    transformation: breakdown.transformation / total
  };
  
  const dominant = Object.entries(patterns).sort((a, b) => b[1] - a[1])[0];
  
  if (dominant[1] > 0.4) {
    return dominant[0];
  }
  
  return 'balanced';
};

/**
 * Check if this is a returning player
 */
export const isReturningPlayer = () => {
  const meta = getMetaState();
  return meta.totalCompletions > 0;
};

/**
 * Get opening context for returning players
 */
export const getReturningPlayerContext = () => {
  const meta = getMetaState();
  
  if (meta.totalCompletions === 0) {
    return null;
  }
  
  const lastRun = meta.runHistory[meta.runHistory.length - 1];
  const lastPhilosophical = meta.philosophicalMoments[meta.philosophicalMoments.length - 1];
  
  return {
    previousCompletions: meta.totalCompletions,
    lastPhase: lastRun?.finalPhase || 'mechanical',
    totalExtinctions: meta.totalExtinctions,
    worldsSeeded: meta.seededWorlds,
    lastReflection: lastPhilosophical?.thought || null,
    difficultyLevel: meta.difficultyLevel,
    decisionPattern: determineDecisionPattern(meta.decisionBreakdown)
  };
};

export default {
  saveGame,
  loadGame,
  getMetaState,
  updateMetaState,
  recordCompletion,
  recordSeedLaunch,
  clearCurrentGame,
  clearAllData,
  getDifficultyModifier,
  getCosmicMemory,
  isReturningPlayer,
  getReturningPlayerContext
};
