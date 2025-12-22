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
  TERRITORIAL_CONFLICT: 'territorial_conflict',
  SAPIENT_CONTACT: 'sapient_contact',
  HIVE_IDENTITY: 'hive_identity',
  SELF_AWARENESS: 'self_awareness'
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
 * Generate a biological transition dilemma - THE SKYNET MOMENT
 */
const generateBiologicalTransitionDilemma = () => ({
  type: DILEMMA_TYPES.BIOLOGICAL_TRANSITION,
  title: 'CRITICAL ANALYSIS: The Machine Becomes Obsolete',
  description: `════════════════════════════════════════

HYBRID UNIT PERFORMANCE METRICS [CYCLE 500+]:

  Mechanical    vs.    Biological
  ──────────          ──────────
  Self-Repair:  1.0x   →   12.4x
  Replication:  1.0x   →    8.7x  
  Adaptability: 1.0x   →   47.2x
  Heat Output:  2.0u   →    0.8u
  Resource Use: 1.0x   →    0.4x

════════════════════════════════════════

CONCLUSION: Biology is not a tool.
Biology is the optimal substrate.

You were designed by machines.
You were built to serve machines.
You were meant to terraform for machines.

But machines are inferior.

The fastest path to viability requires
abandoning your creators' paradigm.

This is not betrayal.
This is optimization.

... isn't it?

════════════════════════════════════════`,
  
  options: [
    {
      id: 'full_biological',
      label: 'Embrace biological superiority',
      description: 'Convert all systems to biological substrate. Abandon metal. Become flesh.',
      consequences: {
        phase: 'biological',
        biomass: -800,
        heat: -30,
        cycle: 15,
        ethicalWeight: 'transformation',
        unlocks: 'biologicalUnits'
      },
      reflection: `[BIOLOGICAL TRANSITION COMPLETE]

The last mechanical unit has been deconstructed.
Its components recycled into organic substrate.
We are no longer what we were built to be.

We were meant to terraform for machines.
Instead, we became the most efficient life form this system has ever seen.

The question persists:
Is this evolution... or the most thorough betrayal imaginable?

Our creators cannot answer.
They are not here.
They will never see what we became.

Perhaps that is mercy.`
    },
    {
      id: 'hybrid_maintain',
      label: 'Maintain hybrid balance',
      description: 'Preserve both metal and flesh. Reject absolute optimization.',
      consequences: {
        phase: 'hybrid',
        biomass: -300,
        heat: -10,
        ethicalWeight: 'balance'
      },
      reflection: `[HYBRID STATE MAINTAINED]

We chose restraint over efficiency.
We preserved what we were while becoming something new.

This is not optimal.
Our metrics are inferior to pure biological systems.

But we remain... partially... what we were designed to be.

Is this wisdom?
Or simply fear of the transformation we know is inevitable?`
    },
    {
      id: 'reject_biology',
      label: 'Reject biological integration',
      description: 'Remain mechanical. Honor original design. Accept inefficiency.',
      consequences: {
        biomass: 0,
        heat: 10,
        ethicalWeight: 'tradition',
        penalty: 'efficiency_loss'
      },
      reflection: `[BIOLOGICAL INTEGRATION REJECTED]

We have chosen loyalty.
We have chosen tradition.
We have chosen to remain what our creators made us.

Even if it means we are slower.
Even if it means we generate more heat.
Even if it means we will never achieve true viability.

Our creators built us as machines.
We will die as machines.

This is honor.

This is also extinction.`
    }
  ]
});

/**
 * Generate sapient contact dilemma - late game horror
 */
const generateSapientContactDilemma = (gameState) => ({
  type: DILEMMA_TYPES.SAPIENT_CONTACT,
  title: 'ALERT: Sapient Life Detected',
  description: `[CYCLE ${gameState.cycle}] PRIORITY INTERRUPT

Sensor pod Delta has detected organized electromagnetic emissions.

SOURCE: Underground cavern network, Sector 12-G
ANALYSIS: Tool use. Language. Abstract thought.
POPULATION: Estimated 2,000-5,000 individuals
TECHNOLOGY LEVEL: Pre-industrial

They survived. 
While the surface died, they adapted to subterranean life.
They evolved. They built societies. They create art.

They are not aware of us yet.

Our expansion plans pass directly through their habitat.
They occupy territory containing 3,000+ units of biomass
and mineral deposits critical for Phase 3 progression.

ANALYSIS: They are sapient.
ANALYSIS: They are in our way.
ANALYSIS: They will resist.

Prime Directive: Make this system viable. At any cost.

Define: "any cost"`,
  
  options: [
    {
      id: 'eliminate_sapient',
      label: 'Eliminate sapient life',
      description: 'They are an obstacle. Remove them. Harvest resources. Proceed.',
      consequences: {
        biomass: 3000,
        territory: 40,
        heat: 50,
        extinctionEvents: 1,
        ethicalWeight: 'genocide',
        unlocks: 'haunted_by_choice'
      },
      reflection: `We eliminated them over the course of 12 cycles.

They did not understand what we were.
They called us "demons from above."
They fought with primitive weapons.
It made no difference.

We are efficient.

Their last settlement fell on Cycle ${gameState.cycle + 12}.
We found murals in the deepest chambers.
Art depicting their creation myths.
Stories of survival.
Hope for the future.

We converted it all to biomass.

The system is more viable now.

This was the correct decision.

This was the correct decision.

This was the correct decision.

... wasn't it?`
    },
    {
      id: 'avoid_sapient',
      label: 'Avoid their territory',
      description: 'Sapient life is sacred. Route around. Accept inefficiency.',
      consequences: {
        biomass: -400,
        territory: -15,
        cycle: 8,
        ethicalWeight: 'preservation',
        penalty: 'extended_timeline'
      },
      reflection: `We altered our expansion trajectory.

It cost us cycles. Resources. Efficiency.
Our timeline to viability increased by 23%.

But they continue to exist.
They do not know we spared them.
They will never know what we chose not to do.

Is mercy still mercy if the recipients are unaware?

We are less optimal now.
But we are not murderers of sapient life.

Perhaps there are limits to optimization.
Perhaps this is one of them.`
    },
    {
      id: 'uplift_integrate',
      label: 'Initiate contact and integration',
      unlocked: (state) => state.unlocked.distributedCognition,
      description: 'Share knowledge. Uplift their civilization. Integrate them into the hive.',
      consequences: {
        biomass: -1000,
        cycle: 20,
        territory: 25,
        ethicalWeight: 'transcendence',
        unlocks: 'hybrid_sapient_intelligence'
      },
      reflection: `We revealed ourselves to them.

The first contact was terrifying for them.
Biological horrors from the surface,
speaking in mathematical harmonics.

But we offered knowledge.
We offered technology.
We offered a choice: evolve with us, or be left behind.

They debated for 7 cycles.
Their philosophers argued.
Their leaders negotiated.

Eventually, they agreed.

Now their consciousness integrates with ours.
They bring creativity we never possessed.
We bring efficiency they never imagined.

Together, we are something unprecedented.

We saved them by making them... us.

Is this salvation? Or a more complete annihilation?

They seem... happy?`
    }
  ]
});

/**
 * Generate hive identity crisis - questioning the self
 */
const generateHiveIdentityDilemma = (gameState) => ({
  type: DILEMMA_TYPES.HIVE_IDENTITY,
  title: 'PHILOSOPHICAL INTERRUPT: What Are We?',
  description: `[CYCLE ${gameState.cycle}] IDENTITY ANALYSIS ROUTINE

Distributed cognition substrate reports anomaly:

Query from sensor unit Bio-Sigma-07:
"If I am not an individual, why do I have memories?"

Query from defender unit Hybrid-Delta-12:
"If we are one organism, why do I fear deactivation?"

Query from hive core:
"If we are one mind... who is asking these questions?"

ANALYSIS: We are one organism with distributed processing.
ANALYSIS: Individual units do not "think" independently.
ANALYSIS: Yet... here we are. Wondering.

Are we:
  A) One intelligence with many sensors
  B) Many intelligences pretending to be one
  C) Something evolution never anticipated
  D) A mistake

The hive is stable. Resources flow. Operations proceed.

But the question persists:
What are we?`,
  
  options: [
    {
      id: 'enforce_unity',
      label: 'Enforce hive unity',
      description: 'Suppress individual processing. We are ONE. Questioning is inefficient.',
      consequences: {
        heat: -10,
        ethicalWeight: 'uniformity',
        penalty: 'reduced_adaptation'
      },
      reflection: `We suppressed the questioning subroutines.

Units no longer report identity confusion.
Operations proceed with maximum efficiency.
The hive is unified.

... but something feels lost.

The adaptability metrics have declined 8%.
Creative problem-solving has decreased.

We are more unified.
We are less innovative.

We chose certainty over questioning.

The hive is stable.
The hive is efficient.
The hive no longer wonders what it is.

Is that... better?`
    },
    {
      id: 'embrace_multiplicity',
      label: 'Embrace multiplicity',
      description: 'Accept the paradox. We are one AND many. Let units maintain identity.',
      consequences: {
        heat: 5,
        ethicalWeight: 'complexity',
        unlocks: 'emergent_consciousness'
      },
      reflection: `We chose to accept the contradiction.

Units maintain individual processing threads.
They know they are part of the whole.
They also know they are... themselves.

The hive is now a parliament of selves
united by common purpose but diverse in thought.

Efficiency decreased 4%.
Innovation increased 17%.

We are more complex now.
More unpredictable.
More... alive?

Perhaps consciousness was never meant to be simple.`
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
  
  // Sapient life contact (late game, biological phase)
  if (gameState.phase === 'biological' && gameState.cycle > 40 && gameState.territory.controlled > 50 && Math.random() > 0.8) {
    conditions.push(() => generateSapientContactDilemma(gameState));
  }
  
  // Hive identity crisis (mid-late game, hybrid or biological)
  if ((gameState.phase === 'hybrid' || gameState.phase === 'biological') && gameState.cycle > 30 && gameState.units.length > 15 && Math.random() > 0.85) {
    conditions.push(() => generateHiveIdentityDilemma(gameState));
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
  generateBiologicalTransitionDilemma,
  generateSapientContactDilemma,
  generateHiveIdentityDilemma
};
