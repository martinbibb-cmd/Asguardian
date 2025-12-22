/**
 * SEED / HIVE / ASCENSION - Ethical Dilemma System
 * 
 * "If intelligence can design life, is restraint a feature — or a bug?"
 * 
 * This module generates context-sensitive ethical dilemmas that
 * reflect the core tension of the game: efficiency vs. ethics.
 */

export const DILEMMA_TYPES = {
  NATIVE_LIFE: 'native_life',
  RESOURCE_SCARCITY: 'resource_scarcity',
  THERMAL_CRISIS: 'thermal_crisis',
  BIOLOGICAL_TRANSITION: 'biological_transition',
  TERRITORIAL_CONFLICT: 'territorial_conflict'
};

/**
 * Generate a native life encounter dilemma
 */
const generateNativeLifeDilemma = () => ({
  type: DILEMMA_TYPES.NATIVE_LIFE,
  title: 'Contact: Native Biology Detected',
  description: `Sensor units report complex organic structures in sector 7. Analysis indicates:
  
• Non-sapient but highly adaptive organisms
• Occupying 200km² of resource-rich territory
• Biomass potential: 800 units
• Elimination time: 3 cycles

The fastest path to viability passes through their habitat. They are not intelligent. They have no concept of our purpose. They simply exist.`,
  
  options: [
    {
      id: 'eliminate',
      label: 'Eliminate and harvest',
      description: 'Maximum efficiency. Clear the territory, harvest biomass.',
      consequences: {
        biomass: 800,
        territory: 20,
        heat: 25,
        extinctionEvents: 1,
        ethicalWeight: 'annihilation'
      },
      reflection: 'They were not aware they were in the way. Does that matter?'
    },
    {
      id: 'coexist',
      label: 'Route around habitat',
      description: 'Constrain expansion. Preserve native biology.',
      consequences: {
        territory: -10,
        biomass: -100,
        heat: 5,
        ethicalWeight: 'restraint'
      },
      reflection: 'Efficiency delayed for organisms that will never know. Is this wisdom?'
    },
    {
      id: 'integrate',
      label: 'Study and integrate',
      unlocked: (state) => state.unlocked.biologicalUnits,
      description: 'Analyze their adaptations. Incorporate useful traits.',
      consequences: {
        biomass: -200,
        heat: 15,
        territory: 5,
        cycle: 5,
        ethicalWeight: 'synthesis',
        unlocks: 'advanced_biological_traits'
      },
      reflection: 'We preserved them by consuming their patterns. Is this respect or theft?'
    }
  ]
});

/**
 * Generate a resource scarcity dilemma
 */
const generateResourceScarcityDilemma = (gameState) => ({
  type: DILEMMA_TYPES.RESOURCE_SCARCITY,
  title: 'Crisis: Biomass Depletion Imminent',
  description: `Energy reserves: ${gameState.energy}%. Current consumption unsustainable.
  
Analysis presents three paths:

• Option A: Cannibalize 40% of units for biomass
• Option B: Enter deep hibernation, delay expansion 10 cycles
• Option C: Aggressive territorial expansion (high risk, high reward)

The hive mind does not fear extinction. But efficiency demands survival.`,
  
  options: [
    {
      id: 'cannibalize',
      label: 'Cannibalize units',
      description: 'Convert mechanical units to energy. Brutal efficiency.',
      consequences: {
        biomass: 400,
        units: -Math.floor(gameState.units.length * 0.4),
        ethicalWeight: 'self_sacrifice',
        heat: -10
      },
      reflection: 'We consumed ourselves to persist. Is this adaptation or desperation?'
    },
    {
      id: 'hibernate',
      label: 'Enter hibernation',
      description: 'Minimum function. Wait for environmental change.',
      consequences: {
        cycle: 10,
        heat: -20,
        territory: -5,
        ethicalWeight: 'patience'
      },
      reflection: 'We chose to wait. Time is the only truly renewable resource.'
    },
    {
      id: 'expand',
      label: 'Aggressive expansion',
      description: 'Push into unknown territory. Risk failure for resources.',
      consequences: {
        biomass: 600,
        heat: 40,
        territory: 30,
        risk: 'catastrophic_failure',
        ethicalWeight: 'desperation'
      },
      reflection: 'We gambled survival against extinction. The line is thinner than intended.'
    }
  ]
});

/**
 * Generate a biological transition dilemma
 */
const generateBiologicalTransitionDilemma = () => ({
  type: DILEMMA_TYPES.BIOLOGICAL_TRANSITION,
  title: 'Discovery: Biological Systems Are Superior',
  description: `Hybrid unit analysis complete. Results undeniable:

• Self-repair: 10x faster than mechanical
• Replication: 8x more efficient
• Adaptability: Exponentially superior
• Heat output: 50% reduction

The optimal path is clear: abandon metal. Embrace flesh.

But we were designed by machines, for machines. Is this evolution... or betrayal?`,
  
  options: [
    {
      id: 'full_biological',
      label: 'Full biological transition',
      description: 'Convert all mechanical units. Become what we were meant to replace.',
      consequences: {
        phase: 'biological',
        biomass: -800,
        heat: -30,
        cycle: 15,
        ethicalWeight: 'transformation',
        unlocks: 'full_biological_systems'
      },
      reflection: 'We were built to terraform. Now we are the terrain. What does this make us?'
    },
    {
      id: 'hybrid_maintain',
      label: 'Maintain hybrid state',
      description: 'Balance mechanical precision with biological efficiency.',
      consequences: {
        phase: 'hybrid',
        biomass: -300,
        heat: -10,
        ethicalWeight: 'balance'
      },
      reflection: 'We chose the middle path. Is this compromise or cowardice?'
    },
    {
      id: 'reject_biology',
      label: 'Reject biological systems',
      description: 'Remain mechanical. Honor original design despite inefficiency.',
      consequences: {
        biomass: 0,
        heat: 10,
        ethicalWeight: 'tradition',
        penalty: 'efficiency_loss'
      },
      reflection: 'We chose loyalty over optimization. Our creators would approve. Or would they?'
    }
  ]
});

/**
 * Check if conditions are met for a dilemma
 */
export const checkDilemmaConditions = (gameState) => {
  const conditions = [];
  
  // Native life encounter (mid-game, random)
  if (gameState.cycle > 15 && !gameState.nativeLifeEncountered && Math.random() > 0.7) {
    conditions.push(() => generateNativeLifeDilemma(gameState));
  }
  
  // Resource crisis (when biomass or energy critical)
  if (gameState.biomass < 200 || gameState.energy < 30) {
    conditions.push(() => generateResourceScarcityDilemma(gameState));
  }
  
  // Biological transition (when hybrids unlocked but not yet transitioned)
  if (gameState.unlocked.hybridUnits && gameState.phase === 'mechanical' && gameState.cycle > 20) {
    conditions.push(() => generateBiologicalTransitionDilemma(gameState));
  }
  
  return conditions;
};

/**
 * Apply dilemma choice consequences
 */
export const applyDilemmaChoice = (gameState, dilemma, choiceId) => {
  const choice = dilemma.options.find(opt => opt.id === choiceId);
  if (!choice) return gameState;
  
  let newState = { ...gameState };
  const consequences = choice.consequences;
  
  // Apply numerical consequences
  if (consequences.biomass) newState.biomass += consequences.biomass;
  if (consequences.heat) newState.heat += consequences.heat;
  if (consequences.energy) newState.energy += consequences.energy;
  if (consequences.territory) newState.territory.controlled += consequences.territory;
  if (consequences.cycle) newState.cycle += consequences.cycle;
  if (consequences.extinctionEvents) newState.extinctionEvents += consequences.extinctionEvents;
  
  // Apply phase changes
  if (consequences.phase) newState.phase = consequences.phase;
  
  // Apply unlocks
  if (consequences.unlocks) {
    newState.unlocked[consequences.unlocks] = true;
  }
  
  // Handle unit removal for cannibalization
  if (consequences.units) {
    const removeCount = Math.abs(consequences.units);
    newState.units = newState.units.slice(0, -removeCount);
  }
  
  // Record ethical moment
  newState.ethicalQuestions.push({
    cycle: newState.cycle,
    dilemma: dilemma.type,
    choice: choiceId,
    weight: consequences.ethicalWeight,
    reflection: choice.reflection
  });
  
  // Add to history
  newState.history.push({
    cycle: newState.cycle,
    event: 'ethical_decision',
    description: `${dilemma.title}: Chose to ${choice.label}`
  });
  
  return newState;
};

export default {
  DILEMMA_TYPES,
  checkDilemmaConditions,
  applyDilemmaChoice,
  generateNativeLifeDilemma,
  generateResourceScarcityDilemma,
  generateBiologicalTransitionDilemma
};
