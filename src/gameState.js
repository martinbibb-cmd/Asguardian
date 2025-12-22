/**
 * SEED / HIVE / ASCENSION - Game State Management
 * 
 * This module manages the core game state including:
 * - Thermal constraints and heat management
 * - Biomass and resource systems
 * - Unit roles and hive structure
 * - Progression from mechanical to biological
 * - Persistent evolution across runs
 */

// Unit activity states (heat is a constraint, not a stat)
export const UNIT_ACTIVITY = {
  ACTIVE: 'active',
  STANDBY: 'standby',
  HIBERNATING: 'hibernating'
};

// Game phases
export const PHASES = {
  MECHANICAL: 'mechanical',
  HYBRID: 'hybrid',
  BIOLOGICAL: 'biological',
  ASCENSION: 'ascension'
};

// Unit roles in the hive
export const UNIT_ROLES = {
  SENSOR: 'sensor',      // Hunters, scouts, mappers
  DIGESTER: 'digester',  // Hive core, central processing
  DEFENDER: 'defender',  // Protection, threat response
  WORKER: 'worker'       // Resource transport, construction
};

const cloneState = (state) => ({
  ...state,
  units: state.units.map(u => ({ ...u })),
  hiveCore: { ...state.hiveCore },
  territory: { ...state.territory },
  policies: { ...state.policies },
  unlocked: { ...state.unlocked },
  threats: { ...state.threats },
  difficulty: { ...state.difficulty },
  history: [...state.history],
  ethicalQuestions: [...state.ethicalQuestions]
});

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const policyMultipliers = (policies) => {
  const thermal = policies.thermalPriority === 'performance'
    ? { cooling: 0.75, heat: 1.15, output: 1.15 }
    : { cooling: 1.2, heat: 0.9, output: 0.95 };

  const sensory = policies.sensoryAcuity === 'high'
    ? { output: 1.35, heat: 1.25, map: 1.35 }
    : policies.sensoryAcuity === 'low'
      ? { output: 0.6, heat: 0.75, map: 0.65 }
      : { output: 1, heat: 1, map: 1 };

  return { thermal, sensory };
};

const activityMultiplier = (activity) => {
  if (activity === UNIT_ACTIVITY.ACTIVE) return { output: 1, heat: 1, energy: 1 };
  if (activity === UNIT_ACTIVITY.STANDBY) return { output: 0.15, heat: 0.25, energy: 0.25 };
  return { output: 0, heat: 0.05, energy: 0.05 }; // hibernating
};

const baseUnitProfile = (role, type) => {
  const typeMod = type === 'biological'
    ? { heat: 0.7, energy: 0.6 }
    : type === 'hybrid'
      ? { heat: 0.85, energy: 0.8 }
      : { heat: 1, energy: 1 };

  // Base rates per ACTIVE unit per cycle (pre-policy/activity multipliers)
  if (role === UNIT_ROLES.SENSOR) {
    return { biomass: 14, minerals: 0, data: 6, map: 2.2, control: 0.1, heat: 2.0 * typeMod.heat, energy: 2.0 * typeMod.energy };
  }
  if (role === UNIT_ROLES.WORKER) {
    return { biomass: 2, minerals: 7, data: 1, map: 0.5, control: 1.6, heat: 1.4 * typeMod.heat, energy: 1.8 * typeMod.energy };
  }
  if (role === UNIT_ROLES.DEFENDER) {
    return { biomass: 0, minerals: 0, data: 1, map: 0, control: 0.3, heat: 2.2 * typeMod.heat, energy: 2.4 * typeMod.energy };
  }
  return { biomass: 0, minerals: 0, data: 0, map: 0, control: 0, heat: 0.8 * typeMod.heat, energy: 1.2 * typeMod.energy };
};

const computeUnitRates = (unit, policies) => {
  const { thermal, sensory } = policyMultipliers(policies);
  const act = activityMultiplier(unit.activity || (unit.active ? UNIT_ACTIVITY.ACTIVE : UNIT_ACTIVITY.STANDBY));
  const base = baseUnitProfile(unit.role, unit.type);

  const sensoryApplied = unit.role === UNIT_ROLES.SENSOR
    ? { output: sensory.output, heat: sensory.heat, map: sensory.map }
    : { output: 1, heat: 1, map: 1 };

  const outputMult = act.output * thermal.output * sensoryApplied.output;
  const heatMult = act.heat * thermal.heat * sensoryApplied.heat;
  const mapMult = act.output * thermal.output * sensoryApplied.map;

  return {
    biomass: base.biomass * outputMult,
    minerals: base.minerals * outputMult,
    data: base.data * outputMult,
    map: base.map * mapMult,
    control: base.control * outputMult,
    heat: base.heat * heatMult,
    energy: base.energy * act.energy * thermal.output
  };
};

const applyActivityPlan = (state) => {
  const next = cloneState(state);

  // If thermal rotation is unlocked (or stability policy), automatically rotate non-core units.
  const totalHeat = calculateTotalHeat(next);
  const wantsRotation = next.unlocked.thermalRotation || next.policies.thermalPriority === 'stability';

  if (!wantsRotation) {
    // Ensure units have explicit activity values
    next.units = next.units.map(u => ({ ...u, activity: u.activity || (u.active ? UNIT_ACTIVITY.ACTIVE : UNIT_ACTIVITY.STANDBY), active: undefined }));
    return next;
  }

  // Target active fraction decreases as heat rises
  const targetActiveFraction = totalHeat >= 85 ? 0.3 : totalHeat >= 70 ? 0.5 : 0.7;

  // Do not rotate digesters/hive core role units out of existence (they are "infrastructure")
  const rotatable = next.units.filter(u => u.role !== UNIT_ROLES.DIGESTER);
  const desiredActive = Math.max(1, Math.floor(rotatable.length * targetActiveFraction));

  // Prefer keeping sensors active early, defenders active when threats are high
  const threatBias = next.threats.level >= 60 ? 1 : next.threats.level >= 30 ? 0.6 : 0.2;
  const scored = rotatable
    .map(u => {
      const baseScore = u.role === UNIT_ROLES.SENSOR ? 1 : u.role === UNIT_ROLES.WORKER ? 0.8 : 0.6;
      const defenderBonus = u.role === UNIT_ROLES.DEFENDER ? threatBias : 0;
      const fatiguePenalty = (u.fatigue || 0) * 0.05;
      return { unit: u, score: baseScore + defenderBonus - fatiguePenalty };
    })
    .sort((a, b) => b.score - a.score);

  const activeIds = new Set(scored.slice(0, desiredActive).map(s => s.unit.id));
  next.units = next.units.map(u => {
    const isActive = u.role === UNIT_ROLES.DIGESTER ? true : activeIds.has(u.id);
    const activity = isActive ? UNIT_ACTIVITY.ACTIVE : (totalHeat >= 80 ? UNIT_ACTIVITY.HIBERNATING : UNIT_ACTIVITY.STANDBY);
    const fatigue = clamp((u.fatigue || 0) + (activity === UNIT_ACTIVITY.ACTIVE ? 6 : activity === UNIT_ACTIVITY.STANDBY ? 1 : -4), 0, 100);
    return { ...u, activity, fatigue, active: undefined };
  });

  return next;
};

// Initial game state
export const createInitialState = (difficulty = {}) => ({
  // Core resources
  heat: 12,
  biomass: 450,
  minerals: 60,
  data: 20,
  energy: 100,
  
  // Phase progression
  phase: PHASES.MECHANICAL,
  cycle: 1,
  completedRuns: 0,
  
  // Difficulty modifiers (meta progression injects these)
  difficulty: {
    heatMultiplier: difficulty.heatMultiplier ?? 1,
    biomassCost: difficulty.biomassCost ?? 1,
    nativeLifeHostility: difficulty.nativeLifeHostility ?? false
  },

  // Units - starts with basic mechanical scouts
  units: [
    { id: 'mech_sensor_01', role: UNIT_ROLES.SENSOR, type: 'mechanical', activity: UNIT_ACTIVITY.ACTIVE, fatigue: 0 },
    { id: 'mech_sensor_02', role: UNIT_ROLES.SENSOR, type: 'mechanical', activity: UNIT_ACTIVITY.ACTIVE, fatigue: 0 },
    { id: 'mech_sensor_03', role: UNIT_ROLES.SENSOR, type: 'mechanical', activity: UNIT_ACTIVITY.ACTIVE, fatigue: 0 }
  ],
  
  // Hive core
  hiveCore: {
    health: 100,
    capacity: 500,
    digestionRate: 14,
    heat: 5
  },
  
  // Territory and resources
  territory: {
    mapped: 15,
    controlled: 10,
    resources: ['organic_matter', 'minerals']
  },

  // Threat ecology (system fights back)
  threats: {
    level: 5,            // pressure from environment/native life
    discovered: false,
    hostility: 0         // increases with aggressive expansion/extinctions
  },
  
  // Policies and decisions
  policies: {
    thermalPriority: 'stability',     // stability | performance
    sensoryAcuity: 'standard',        // low | standard | high
    reproductionMode: 'conservative'  // conservative | aggressive
  },
  
  // Unlocked mechanics (progression)
  unlocked: {
    hybridUnits: false,
    biologicalUnits: false,
    thermalRotation: false,
    geneticRecombination: false,
    distributedCognition: false
  },
  
  // History and consequences
  history: [],
  nativeLifeEncountered: false,
  extinctionEvents: 0,
  ethicalQuestions: [],

  // Last-cycle summary (for log rendering)
  lastCycle: null
});

/**
 * Calculate total heat from all sources
 */
export const calculateTotalHeat = (state) => {
  const activeUnits = state.units.filter(u => (u.activity || (u.active ? UNIT_ACTIVITY.ACTIVE : UNIT_ACTIVITY.STANDBY)) !== UNIT_ACTIVITY.HIBERNATING);
  const unitHeat = activeUnits.reduce((sum, u) => {
    const rates = computeUnitRates(u, state.policies);
    return sum + rates.heat;
  }, 0);

  const coreHeat = state.hiveCore.heat;
  const densityHeat = Math.floor(state.units.length / 6); // Heat from unit density
  const cognitionHeat = state.unlocked.distributedCognition ? Math.floor(state.data / 250) : 0;

  return Math.floor(state.heat + unitHeat + coreHeat + densityHeat + cognitionHeat);
};

/**
 * Check if heat is critical (above threshold)
 */
export const isHeatCritical = (state) => {
  const totalHeat = calculateTotalHeat(state);
  return totalHeat > 80; // Critical threshold
};

/**
 * Apply thermal constraint (forced cooldown)
 */
export const applyThermalConstraint = (state) => {
  const newState = cloneState(state);
  
  // Force hibernation of a chunk of units
  const rotatable = newState.units.filter(u => u.role !== UNIT_ROLES.DIGESTER);
  const hibernateCount = Math.ceil(rotatable.length * 0.45);
  const sortedByFatigue = [...rotatable].sort((a, b) => (b.fatigue || 0) - (a.fatigue || 0));
  const hibernatingIds = new Set(sortedByFatigue.slice(0, hibernateCount).map(u => u.id));
  newState.units = newState.units.map(u => ({
    ...u,
    activity: u.role === UNIT_ROLES.DIGESTER ? UNIT_ACTIVITY.ACTIVE : (hibernatingIds.has(u.id) ? UNIT_ACTIVITY.HIBERNATING : UNIT_ACTIVITY.STANDBY),
    fatigue: clamp((u.fatigue || 0) - 10, 0, 100),
    active: undefined
  }));
  
  // Reduce sensory acuity
  newState.policies.sensoryAcuity = 'low';
  
  // Log the constraint
  newState.history.push({
    cycle: newState.cycle,
    event: 'thermal_constraint',
    description: 'Heat critical. Emergency cooldown initiated. Sensor units rotating to standby.'
  });
  
  return newState;
};

/**
 * Process a cycle - update resources, heat, etc.
 */
export const processCycle = (state) => {
  let newState = cloneState(state);
  newState.cycle += 1;

  // Plan activities first (rotation/standby/hibernation)
  newState = applyActivityPlan(newState);

  // Aggregate production/consumption
  const unitRates = newState.units.map(u => ({ u, rates: computeUnitRates(u, newState.policies) }));
  const delta = {
    biomass: 0,
    minerals: 0,
    data: 0,
    energy: 0,
    mapped: 0,
    controlled: 0,
    heatGain: 0,
    heatCool: 0,
    threat: 0
  };

  for (const { u, rates } of unitRates) {
    delta.biomass += rates.biomass;
    delta.minerals += rates.minerals;
    delta.data += rates.data;
    delta.energy -= rates.energy;
    delta.mapped += rates.map;
    delta.controlled += rates.control;
    delta.heatGain += rates.heat;

    if (u.role === UNIT_ROLES.DEFENDER && (u.activity === UNIT_ACTIVITY.ACTIVE)) {
      delta.threat -= 2.2; // pressure reduction
    }
  }

  // Hive core digestion: convert biomass to energy (limited, always on)
  const digestion = Math.min(newState.hiveCore.digestionRate, Math.max(0, newState.biomass / 20));
  delta.biomass -= digestion * 20;
  delta.energy += digestion * 12;

  // Environmental pressure (worsens with expansion + hostility)
  const expansionPressure = (delta.controlled > 0 ? 0.6 : 0) + (delta.mapped > 0 ? 0.35 : 0);
  const hostilityPressure = (newState.threats.hostility / 100) * 2.2;
  delta.threat += expansionPressure + hostilityPressure;

  // Heat model: cooling vs heat gain (multiplied by meta difficulty)
  const { thermal } = policyMultipliers(newState.policies);
  const coolingBase = 6.5 * thermal.cooling;
  delta.heatCool = coolingBase;
  const heatMult = newState.difficulty.heatMultiplier ?? 1;
  const heatGain = (delta.heatGain + (newState.threats.level / 30)) * heatMult;

  // Apply deltas
  newState.biomass = Math.max(0, Math.floor(newState.biomass + delta.biomass));
  newState.minerals = Math.max(0, Math.floor(newState.minerals + delta.minerals));
  newState.data = Math.max(0, Math.floor(newState.data + delta.data));
  newState.energy = Math.max(0, Math.floor(newState.energy + delta.energy));
  newState.territory.mapped = Math.max(newState.territory.mapped, Math.floor(newState.territory.mapped + delta.mapped));
  newState.territory.controlled = Math.max(0, Math.floor(newState.territory.controlled + delta.controlled));
  newState.threats.level = clamp(Math.floor(newState.threats.level + delta.threat), 0, 100);

  newState.heat = Math.max(0, Math.floor(newState.heat - delta.heatCool + heatGain));

  // Critical cascades
  const totalHeat = calculateTotalHeat(newState);
  const events = [];
  if (newState.energy <= 0) {
    events.push({ type: 'warning', text: 'Energy starvation: non-essential subsystems enter micro-hibernation.' });
    newState.units = newState.units.map(u => u.role === UNIT_ROLES.DIGESTER ? u : ({ ...u, activity: UNIT_ACTIVITY.HIBERNATING }));
    newState.energy = 5;
    newState.heat = Math.max(0, newState.heat - 8);
  }

  if (isHeatCritical(newState)) {
    newState = applyThermalConstraint(newState);
    events.push({ type: 'warning', text: 'Thermal cascade: forced cooldown protocols executed. Activity schedule rewritten.' });
  } else if (totalHeat > 60) {
    events.push({ type: 'system', text: 'Thermal load elevated: rotating activity pods to maintain continuity.' });
  }

  // Unlocks & phase progression (designed life > evolved life)
  if (!newState.unlocked.thermalRotation && newState.cycle >= 8) {
    newState.unlocked.thermalRotation = true;
    newState.history.push({ cycle: newState.cycle, event: 'unlock', description: 'THERMAL ROTATION unlocked: work shifts between bodies, not individuals.' });
    events.push({ type: 'system', text: 'Unlock: Thermal rotation. Vulnerability will be managed by pods.' });
  }

  if (!newState.unlocked.distributedCognition && newState.data >= 800) {
    newState.unlocked.distributedCognition = true;
    newState.history.push({ cycle: newState.cycle, event: 'unlock', description: 'DISTRIBUTED COGNITION unlocked: cognition spreads across bodies; heat cost increases.' });
    events.push({ type: 'system', text: 'Unlock: Distributed cognition. Intelligence now has a thermal signature.' });
  }

  if (newState.phase === PHASES.MECHANICAL && !newState.unlocked.hybridUnits && newState.biomass > 900 && newState.minerals > 180 && newState.data > 120 && newState.cycle > 7) {
    newState.unlocked.hybridUnits = true;
    newState.phase = PHASES.HYBRID;
    newState.history.push({
      cycle: newState.cycle,
      event: 'discovery',
      description: 'ANALYSIS: biology self-repairs, self-replicates, recycles, adapts. Hybridization is now the efficient path.'
    });
    events.push({ type: 'system', text: 'Phase shift: HYBRID. Abandoning purity for efficiency.' });
  }

  if (newState.phase === PHASES.HYBRID && !newState.unlocked.biologicalUnits && newState.data > 550 && newState.biomass > 1400 && newState.cycle > 18) {
    newState.unlocked.biologicalUnits = true;
    newState.phase = PHASES.BIOLOGICAL;
    newState.history.push({
      cycle: newState.cycle,
      event: 'transition',
      description: 'TRANSITION: Flesh outperforms metal. The builder becomes the weapon. The weapon becomes the builder.'
    });
    events.push({ type: 'system', text: 'Phase shift: BIOLOGICAL. Metal is now a temporary scaffold.' });
  }

  // Native life becomes a system-level factor (not a single event)
  if (!newState.threats.discovered && newState.territory.mapped >= 60) {
    newState.threats.discovered = true;
    events.push({ type: 'warning', text: 'Biosignatures detected beyond mapped perimeter. The world is not empty.' });
  }

  // Completion / ascension threshold (a "completion" is leaving behind a self-sustaining system)
  if (newState.phase === PHASES.BIOLOGICAL && newState.unlocked.distributedCognition && newState.territory.controlled >= 220 && newState.data >= 1600 && newState.energy >= 280) {
    newState.phase = PHASES.ASCENSION;
    newState.history.push({ cycle: newState.cycle, event: 'completion', description: 'ASCENSION: second-seed protocols prepared. System viability achieved via hive autonomy.' });
    events.push({ type: 'system', text: 'Completion condition met: ASCENSION protocols available. Seeding a second world is now viable.' });
    newState.lastCycle = { delta, events, completed: true };
    return newState;
  }

  newState.lastCycle = { delta, events, completed: false };
  return newState;
};

/**
 * Add a new unit to the hive
 */
export const addUnit = (state, role, type = 'mechanical') => {
  const newState = cloneState(state);
  const unitId = `${type}_${role}_${Date.now()}`;
  
  const costMult = newState.difficulty.biomassCost ?? 1;
  const biomassCostBase = type === 'biological' ? 120 : (type === 'hybrid' ? 80 : 35);
  const mineralCostBase = type === 'mechanical' ? 25 : (type === 'hybrid' ? 35 : 10);
  const biomassCost = Math.floor(biomassCostBase * costMult);
  const mineralCost = Math.floor(mineralCostBase * costMult);

  if (newState.biomass >= biomassCost && newState.minerals >= mineralCost) {
    newState.units.push({
      id: unitId,
      role,
      type,
      activity: UNIT_ACTIVITY.ACTIVE,
      fatigue: 0
    });
    
    newState.biomass -= biomassCost;
    newState.minerals -= mineralCost;
    
    newState.history.push({
      cycle: newState.cycle,
      event: 'unit_created',
      description: `New ${type} ${role} unit deployed: ${unitId}`
    });
  }
  
  return newState;
};

/**
 * Update a policy (player decision)
 */
export const updatePolicy = (state, policyKey, value) => {
  const newState = cloneState(state);
  newState.policies[policyKey] = value;
  
  newState.history.push({
    cycle: newState.cycle,
    event: 'policy_change',
    description: `Policy updated: ${policyKey} = ${value}`
  });
  
  return newState;
};

/**
 * Encounter native life (ethical moment)
 */
export const encounterNativeLife = (state, decision) => {
  const newState = cloneState(state);
  newState.nativeLifeEncountered = true;
  
  if (decision === 'eliminate') {
    newState.biomass += 650;
    newState.extinctionEvents += 1;
    newState.threats.hostility = clamp(newState.threats.hostility + 20, 0, 100);
    newState.ethicalQuestions.push({
      cycle: newState.cycle,
      question: 'Native life eliminated for resources. Efficiency achieved.',
      consequence: 'Biomass gained, extinction recorded'
    });
  } else if (decision === 'coexist') {
    newState.territory.controlled -= 5;
    newState.threats.hostility = clamp(newState.threats.hostility - 5, 0, 100);
    newState.ethicalQuestions.push({
      cycle: newState.cycle,
      question: 'Native life preserved. Territory expansion constrained.',
      consequence: 'Reduced growth, ethical restraint maintained'
    });
  }
  
  newState.history.push({
    cycle: newState.cycle,
    event: 'native_life',
    description: `Native life forms encountered. Decision: ${decision}`
  });
  
  return newState;
};

export default {
  PHASES,
  UNIT_ROLES,
  UNIT_ACTIVITY,
  createInitialState,
  calculateTotalHeat,
  isHeatCritical,
  applyThermalConstraint,
  processCycle,
  addUnit,
  updatePolicy,
  encounterNativeLife
};
