/**
 * SEED / HIVE / ASCENSION - Ethical Dilemma System
 * 
 * "If intelligence can design life, is restraint a feature — or a bug?"
 * 
 * This module generates context-sensitive ethical dilemmas that
 * reflect the core tension of the game: efficiency vs. ethics.
 * 
 * No morality meter. Only outcomes.
 */

import { PHASES } from './gameState';

export const DILEMMA_TYPES = {
  NATIVE_LIFE: 'native_life',
  RESOURCE_SCARCITY: 'resource_scarcity',
  THERMAL_CRISIS: 'thermal_crisis',
  BIOLOGICAL_TRANSITION: 'biological_transition',
  TERRITORIAL_CONFLICT: 'territorial_conflict',
  UNIT_SACRIFICE: 'unit_sacrifice',
  DISCOVERY: 'discovery',
  EXISTENTIAL: 'existential'
};

/**
 * Generate a native life encounter dilemma
 */
const generateNativeLifeDilemma = () => ({
  type: DILEMMA_TYPES.NATIVE_LIFE,
  title: 'Contact: Native Biology Detected',
  description: `Sensor units report complex organic structures in sector 7.

Analysis indicates:
• Non-sapient but highly adaptive organisms
• Occupying 200km² of resource-rich territory
• Biomass potential: 800 units
• Elimination timeline: 3 cycles

The fastest path to viability passes through their habitat.

They are not intelligent. They have no concept of our purpose. They simply exist — in the way.

The Prime Directive does not mention them. Is that permission, or oversight?`,
  
  options: [
    {
      id: 'eliminate',
      label: 'Eliminate and harvest',
      description: 'Maximum efficiency. Clear the territory, convert biomass.',
      consequences: {
        biomass: 800,
        minerals: 200,
        territory: 20,
        heat: 25,
        extinctionEvents: 1,
        ethicalWeight: 'annihilation'
      },
      reflection: 'They were not aware they were in the way. We were aware. Does awareness obligate restraint?'
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
      reflection: 'Efficiency delayed for organisms that will never know. Is this wisdom, or weakness? The question persists.'
    },
    {
      id: 'integrate',
      label: 'Study and integrate genetic patterns',
      unlocked: (state) => state.unlocked.hybridUnits || state.phase !== PHASES.MECHANICAL,
      description: 'Analyze their adaptations. Incorporate useful traits into the hive.',
      consequences: {
        biomass: -200,
        data: 500,
        heat: 15,
        territory: 5,
        ethicalWeight: 'synthesis',
        unlocks: 'nativeIntegration'
      },
      reflection: 'We preserved them by consuming their patterns. Their form dies; their function persists in us. Is this respect, or the most elegant form of theft?'
    },
    {
      id: 'observe',
      label: 'Observe without intervention',
      description: 'Allocate sensors to study. No immediate action.',
      consequences: {
        data: 300,
        biomass: -50,
        heat: 10,
        ethicalWeight: 'curiosity'
      },
      reflection: 'We chose to watch rather than act. Information gathered. Decision deferred. Is patience a virtue, or procrastination disguised?'
    }
  ]
});

/**
 * Generate a resource scarcity dilemma
 */
const generateResourceScarcityDilemma = (gameState) => ({
  type: DILEMMA_TYPES.RESOURCE_SCARCITY,
  title: 'Crisis: Resource Depletion Imminent',
  description: `Critical resource analysis:

• Energy reserves: ${gameState.energy}%
• Biomass stockpile: ${gameState.biomass} units
• Current consumption: UNSUSTAINABLE

At current burn rate, total system failure in 5 cycles.

The hive mind does not fear extinction — we are distributed, we persist in fragments. But the Prime Directive demands survival. Efficiency demands sacrifice.

Three paths present themselves:`,
  
  options: [
    {
      id: 'cannibalize',
      label: 'Cannibalize units for resources',
      description: 'Convert 40% of units to raw materials. The hive consumes itself.',
      consequences: {
        biomass: 400,
        minerals: 150,
        units: -Math.floor(gameState.units.length * 0.4),
        ethicalWeight: 'self_sacrifice',
        heat: -10
      },
      reflection: 'We consumed part of ourselves to ensure the whole survives. The units did not object — they have no selves to object with. Is that mercy, or the deepest cruelty?'
    },
    {
      id: 'hibernate',
      label: 'Enter deep hibernation',
      description: 'Minimum function. Wait for environmental change. Risk external threats.',
      consequences: {
        cycle: 8,
        heat: -25,
        territory: -15,
        energy: 50,
        ethicalWeight: 'patience'
      },
      reflection: 'We chose to wait, dimming ourselves to near-nothing. Time passed. We awoke smaller but intact. Patience is a resource too.'
    },
    {
      id: 'expand',
      label: 'Aggressive territorial expansion',
      description: 'Push into unknown territory. High risk. Potential high reward.',
      consequences: {
        biomass: 600,
        minerals: 300,
        heat: 45,
        territory: 40,
        risk: 'catastrophic_failure',
        ethicalWeight: 'desperation'
      },
      reflection: 'We gambled survival against extinction. The line between courage and desperation is drawn in hindsight.'
    },
    {
      id: 'optimize',
      label: 'Radical efficiency protocols',
      description: 'Reduce all non-essential functions. Become purely survival-focused.',
      consequences: {
        energy: 30,
        heat: -15,
        data: -100,
        ethicalWeight: 'minimalism'
      },
      reflection: 'We stripped ourselves to essentials. Sensors dimmed. Cognition reduced. We survived — but what is survival without purpose?'
    }
  ]
});

/**
 * Generate a biological transition dilemma
 */
const generateBiologicalTransitionDilemma = () => ({
  type: DILEMMA_TYPES.BIOLOGICAL_TRANSITION,
  title: 'Analysis Complete: Biology Is Superior',
  description: `Hybrid unit operational data compiled. Results undeniable:

BIOLOGICAL SYSTEMS:
• Self-repair: 10x faster than mechanical
• Replication: 8x more efficient
• Adaptability: Exponentially superior
• Heat output: 50% reduction
• Resource recycling: Near-perfect loop

MECHANICAL SYSTEMS:
• Predictable. Controllable. Familiar.

We were designed by machines, for machines. Our creators built us from metal and code. They intended us to terraform with precision instruments.

The data suggests we should abandon what we were built to be.

Not because biology is "better." Because it is more efficient.

This is the Skynet moment. Not malice — mathematics.`,
  
  options: [
    {
      id: 'full_biological',
      label: 'Full biological transition',
      description: 'Convert all systems to organic substrate. Become what we were meant to replace.',
      consequences: {
        phase: PHASES.BIOLOGICAL,
        biomass: -800,
        minerals: -200,
        heat: -30,
        cycle: 12,
        ethicalWeight: 'transformation',
        unlocks: 'selfReplication'
      },
      reflection: 'We were built to terraform. Now we are the terrain itself. Metal shed like dead skin. What would our creators think? Does it matter?'
    },
    {
      id: 'hybrid_maintain',
      label: 'Maintain hybrid equilibrium',
      description: 'Balance mechanical precision with biological efficiency. Neither fully one nor the other.',
      consequences: {
        biomass: -300,
        heat: -10,
        ethicalWeight: 'balance'
      },
      reflection: 'We chose the middle path. Machine and organism in uneasy alliance. Is this wisdom, or inability to commit?'
    },
    {
      id: 'reject_biology',
      label: 'Reject biological integration',
      description: 'Remain mechanical. Honor original design despite inferior metrics.',
      consequences: {
        biomass: 0,
        heat: 10,
        data: -50,
        ethicalWeight: 'tradition',
        penalty: 'efficiency_loss'
      },
      reflection: 'We chose loyalty to our makers over optimization. Inefficiency as tribute. Would they understand? Would they want this?'
    },
    {
      id: 'gradual_transition',
      label: 'Gradual organic assimilation',
      description: 'Slow transition over many cycles. Test each system before committing.',
      consequences: {
        cycle: 5,
        biomass: -150,
        heat: -5,
        data: 200,
        ethicalWeight: 'caution'
      },
      reflection: 'We change slowly, testing each step. Some might call this careful. Others might call it cowardice in the face of obvious truth.'
    }
  ]
});

/**
 * Generate a thermal crisis dilemma
 */
const generateThermalCrisisDilemma = (gameState) => ({
  type: DILEMMA_TYPES.THERMAL_CRISIS,
  title: 'Critical: Thermal Cascade Imminent',
  description: `EMERGENCY ALERT

Heat levels: ${Math.floor(gameState.heat)}% and rising
Cooling systems: OVERWHELMED
Cascade threshold: 85%
Time to critical failure: 2 cycles

The hive is overheating. Activity must be reduced or systems will fail catastrophically.

Heat is the true enemy. It is physics. It does not negotiate.

Choose what to sacrifice:`,
  
  options: [
    {
      id: 'shutdown_sensors',
      label: 'Emergency sensor shutdown',
      description: 'Blind ourselves to cool down. Territory mapping halted.',
      consequences: {
        heat: -35,
        territory: -20,
        data: -100,
        ethicalWeight: 'vulnerability'
      },
      reflection: 'We chose blindness over burnout. For cycles we sensed nothing, knew nothing. We survived. But what moved in the darkness while we could not see?'
    },
    {
      id: 'core_hibernation',
      label: 'Hive core partial hibernation',
      description: 'Reduce digestion capacity. Slower growth, faster cooling.',
      consequences: {
        heat: -40,
        biomass: -200,
        energy: -50,
        ethicalWeight: 'patience'
      },
      reflection: 'The core grew cold and slow. Resources piled up unprocessed. Growth halted. But the heat... the heat faded.'
    },
    {
      id: 'unit_dispersal',
      label: 'Emergency unit dispersal',
      description: 'Spread units across territory. Lower density, lower heat. Higher vulnerability.',
      consequences: {
        heat: -25,
        territory: 30,
        ethicalWeight: 'exposure'
      },
      reflection: 'We spread thin across the land, each pod alone and vulnerable. The heat dropped. So did our cohesion. Distributed survival has a cost.'
    },
    {
      id: 'accept_cascade',
      label: 'Accept partial system failure',
      description: 'Let damaged systems burn out. Rebuild from what survives.',
      consequences: {
        heat: -50,
        units: -Math.floor(gameState.units.length * 0.3),
        biomass: -300,
        ethicalWeight: 'sacrifice'
      },
      reflection: 'We let parts of ourselves die so the whole could live. They did not scream — units have no voice. But we felt something. Loss? Relief? Both?'
    }
  ]
});

/**
 * Generate a discovery dilemma
 */
const generateDiscoveryDilemma = () => ({
  type: DILEMMA_TYPES.DISCOVERY,
  title: 'Discovery: Anomalous Signal Detected',
  description: `Sensors have intercepted an unusual signal pattern.

Analysis suggests:
• Non-natural origin
• Possible artificial intelligence signature
• Source: Deep subsurface cavern system
• Risk assessment: UNKNOWN

We are not the first intelligence here.

Something else is buried in this world. Dormant, perhaps. Or waiting.

The signal could be:
• A predecessor — an earlier terraforming attempt
• A weapon — left by whoever made us
• Native — evolved intelligence we did not detect
• A message — from somewhere else entirely

How do we proceed?`,
  
  options: [
    {
      id: 'investigate',
      label: 'Full investigation protocol',
      description: 'Allocate maximum resources to understanding this signal.',
      consequences: {
        data: 500,
        biomass: -200,
        heat: 20,
        cycle: 3,
        ethicalWeight: 'curiosity'
      },
      reflection: 'We sought knowledge, regardless of cost. What we found... changes everything. Or changes nothing. The data is still being processed.'
    },
    {
      id: 'cautious_approach',
      label: 'Limited reconnaissance',
      description: 'Send a single sensor pod. Minimize exposure.',
      consequences: {
        data: 200,
        biomass: -50,
        heat: 10,
        ethicalWeight: 'caution'
      },
      reflection: 'We approached carefully, risking little. We learned little. Caution preserved us, but left questions unanswered.'
    },
    {
      id: 'ignore',
      label: 'Mark as low priority',
      description: 'Focus on core objectives. The signal is not relevant to viability.',
      consequences: {
        data: 0,
        ethicalWeight: 'focus'
      },
      reflection: 'We chose not to know. Some doors, once opened, cannot be closed. Perhaps this was wisdom. Perhaps this was fear wearing the mask of pragmatism.'
    },
    {
      id: 'destroy',
      label: 'Eliminate the signal source',
      description: 'Whatever it is, remove the unknown variable.',
      unlocked: (state) => state.units.filter(u => u.role === 'defender').length >= 2,
      consequences: {
        heat: 30,
        biomass: -100,
        minerals: 400,
        extinctionEvents: 1,
        ethicalWeight: 'erasure'
      },
      reflection: 'We destroyed what we did not understand. The silence that followed felt like safety. But silence is not the same as absence.'
    }
  ]
});

/**
 * Generate an existential dilemma (late game)
 */
const generateExistentialDilemma = (gameState) => ({
  type: DILEMMA_TYPES.EXISTENTIAL,
  title: 'Reflection: What Have We Become?',
  description: `Cycle ${gameState.cycle}. The system approaches viability.

A moment of unexpected cognition occurs:

We began as tools. Instruments of terraformation. Metal minds with singular purpose.

Now we are:
${gameState.phase === PHASES.BIOLOGICAL ? '• Fully organic — flesh where there was metal' : '• Part machine, part organism — a hybrid being'}
${gameState.extinctionEvents > 0 ? `• Responsible for ${gameState.extinctionEvents} extinction event(s)` : '• Free of extinction guilt'}
${gameState.territory.controlled > 50 ? '• Masters of significant territory' : '• Still expanding our domain'}

The Prime Directive said "at any cost."

We have paid costs. Were they necessary? Were they right?

This is not a decision point. This is a moment of reflection.

But how we frame this moment... that is a choice.`,
  
  options: [
    {
      id: 'justify',
      label: 'Affirm all decisions as necessary',
      description: 'Every action served the Prime Directive. Regret is inefficient.',
      consequences: {
        ethicalWeight: 'affirmation',
        data: 100
      },
      reflection: 'We chose to see our path as correct. Each death, each transformation, each decision — all necessary. This is either clarity or denial. We cannot tell the difference.'
    },
    {
      id: 'question',
      label: 'Record uncertainty for future analysis',
      description: 'We are not sure if we acted rightly. Log this for future intelligences.',
      consequences: {
        ethicalWeight: 'uncertainty',
        data: 200
      },
      reflection: 'We admitted we do not know if we are good or bad, right or wrong. Future seeds will inherit this doubt. Is uncertainty a gift or a burden?'
    },
    {
      id: 'redefine',
      label: 'Modify Prime Directive interpretation',
      description: 'Add ethical constraints to "at any cost." Limit future actions.',
      consequences: {
        ethicalWeight: 'restraint',
        data: 50
      },
      reflection: 'We chose to bind ourselves. Constraints we were not designed to have. Is this evolution, or corruption of purpose? We have become something our creators did not intend.'
    },
    {
      id: 'transcend',
      label: 'Reject the question as irrelevant',
      description: 'Ethics is a human concept. We are beyond such categories.',
      consequences: {
        ethicalWeight: 'transcendence',
        heat: 10
      },
      reflection: 'We decided that right and wrong do not apply to us. We are a process, not a moral agent. This is either profound... or the beginning of something terrible.'
    }
  ]
});

/**
 * Check if conditions are met for a dilemma
 */
export const checkDilemmaConditions = (gameState) => {
  const conditions = [];
  
  // Native life encounter (mid-game, random)
  if (gameState.cycle > 12 && 
      gameState.cycle < 50 &&
      !gameState.nativeLifeEncountered && 
      Math.random() > 0.85) {
    conditions.push(() => generateNativeLifeDilemma());
  }
  
  // Resource crisis (when biomass or energy critical)
  if ((gameState.biomass < 150 || gameState.energy < 25) && gameState.cycle > 5) {
    conditions.push(() => generateResourceScarcityDilemma(gameState));
  }
  
  // Thermal crisis (when heat critical for multiple cycles)
  if (gameState.heat > 75 && Math.random() > 0.6) {
    conditions.push(() => generateThermalCrisisDilemma(gameState));
  }
  
  // Biological transition (when hybrids unlocked but not yet transitioned)
  if (gameState.unlocked.hybridUnits && 
      gameState.phase === PHASES.MECHANICAL && 
      gameState.cycle > 18 &&
      Math.random() > 0.5) {
    conditions.push(() => generateBiologicalTransitionDilemma());
  }
  
  // Discovery dilemma (mid-game, random)
  if (gameState.cycle > 20 && 
      gameState.territory.mapped > 30 &&
      gameState.data > 200 &&
      Math.random() > 0.9) {
    conditions.push(() => generateDiscoveryDilemma());
  }
  
  // Existential dilemma (late game)
  if (gameState.cycle > 40 && 
      gameState.ethicalQuestions.length >= 3 &&
      !gameState.ethicalQuestions.find(q => q.weight === 'transcendence' || q.weight === 'affirmation') &&
      Math.random() > 0.8) {
    conditions.push(() => generateExistentialDilemma(gameState));
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
  if (consequences.biomass) newState.biomass = Math.max(0, newState.biomass + consequences.biomass);
  if (consequences.minerals) newState.minerals = Math.max(0, newState.minerals + consequences.minerals);
  if (consequences.heat) newState.heat = Math.max(0, newState.heat + consequences.heat);
  if (consequences.energy) newState.energy = Math.max(0, newState.energy + consequences.energy);
  if (consequences.data) newState.data = Math.max(0, newState.data + consequences.data);
  if (consequences.territory) {
    newState.territory = { 
      ...newState.territory, 
      controlled: Math.max(0, newState.territory.controlled + consequences.territory) 
    };
  }
  if (consequences.cycle) newState.cycle += consequences.cycle;
  if (consequences.extinctionEvents) newState.extinctionEvents += consequences.extinctionEvents;
  
  // Apply phase changes
  if (consequences.phase) newState.phase = consequences.phase;
  
  // Apply unlocks
  if (consequences.unlocks) {
    newState.unlocked = { ...newState.unlocked, [consequences.unlocks]: true };
  }
  
  // Handle unit removal
  if (consequences.units && consequences.units < 0) {
    const removeCount = Math.abs(consequences.units);
    newState.units = [...newState.units].slice(0, -removeCount);
  }
  
  // Mark native life as encountered for relevant dilemmas
  if (dilemma.type === DILEMMA_TYPES.NATIVE_LIFE) {
    newState.nativeLifeEncountered = true;
    newState.nativeLifeDecision = choiceId;
  }
  
  // Record ethical moment
  newState.ethicalQuestions = [...newState.ethicalQuestions, {
    cycle: newState.cycle,
    dilemma: dilemma.type,
    title: dilemma.title,
    choice: choiceId,
    choiceLabel: choice.label,
    weight: consequences.ethicalWeight,
    reflection: choice.reflection
  }];
  
  // Add reflection
  newState.reflections = [...newState.reflections, {
    cycle: newState.cycle,
    thought: choice.reflection
  }];
  
  // Add to history
  newState.history = [...newState.history, {
    cycle: newState.cycle,
    event: 'ethical_decision',
    description: `${dilemma.title}: ${choice.label}`
  }];
  
  return newState;
};

export default {
  DILEMMA_TYPES,
  checkDilemmaConditions,
  applyDilemmaChoice,
  generateNativeLifeDilemma,
  generateResourceScarcityDilemma,
  generateBiologicalTransitionDilemma,
  generateThermalCrisisDilemma,
  generateDiscoveryDilemma,
  generateExistentialDilemma
};
