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

// Initial game state
export const createInitialState = () => ({
  // Core resources
  heat: 12,
  biomass: 450,
  energy: 100,
  
  // Phase progression
  phase: PHASES.MECHANICAL,
  cycle: 1,
  completedRuns: 0,
  
  // Units - starts with basic mechanical scouts
  units: [
    { id: 'mech_sensor_01', role: UNIT_ROLES.SENSOR, type: 'mechanical', active: true, heat: 2 },
    { id: 'mech_sensor_02', role: UNIT_ROLES.SENSOR, type: 'mechanical', active: true, heat: 2 },
    { id: 'mech_sensor_03', role: UNIT_ROLES.SENSOR, type: 'mechanical', active: true, heat: 2 }
  ],
  
  // Hive core
  hiveCore: {
    health: 100,
    capacity: 500,
    digestionRate: 10,
    heat: 5
  },
  
  // Territory and resources
  territory: {
    mapped: 15,
    controlled: 10,
    resources: ['organic_matter', 'minerals']
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
  ethicalQuestions: []
});

/**
 * Calculate total heat from all sources
 */
export const calculateTotalHeat = (state) => {
  const unitHeat = state.units
    .filter(u => u.active)
    .reduce((sum, u) => sum + (u.heat || 0), 0);
  
  const coreHeat = state.hiveCore.heat;
  const densityHeat = Math.floor(state.units.length / 5); // Heat from unit density
  
  return state.heat + unitHeat + coreHeat + densityHeat;
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
  const newState = { ...state };
  
  // Deactivate some sensor units
  const activeUnits = newState.units.filter(u => u.active && u.role === UNIT_ROLES.SENSOR);
  if (activeUnits.length > 0) {
    const deactivateCount = Math.ceil(activeUnits.length * 0.4);
    for (let i = 0; i < deactivateCount; i++) {
      activeUnits[i].active = false;
    }
  }
  
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
  let newState = { ...state };
  newState.cycle += 1;
  
  // Calculate biomass gain from active sensors
  const activeSensors = newState.units.filter(u => u.active && u.role === UNIT_ROLES.SENSOR);
  const biomassGain = activeSensors.length * 15; // 15 biomass per active sensor
  newState.biomass += biomassGain;
  
  // Energy consumption
  const energyCost = newState.units.filter(u => u.active).length * 2;
  newState.energy -= energyCost;
  
  // Biomass conversion to energy (at hive core)
  if (newState.energy < 50) {
    const conversionAmount = Math.min(50, newState.biomass / 10);
    newState.energy += conversionAmount;
    newState.biomass -= conversionAmount * 10;
  }
  
  // Heat dissipation (natural cooling)
  newState.heat = Math.max(0, newState.heat - 5);
  
  // Check for critical heat
  if (isHeatCritical(newState)) {
    newState = applyThermalConstraint(newState);
  }
  
  // Phase progression checks
  if (newState.phase === PHASES.MECHANICAL && newState.biomass > 1000 && newState.cycle > 10) {
    newState.unlocked.hybridUnits = true;
    newState.history.push({
      cycle: newState.cycle,
      event: 'discovery',
      description: 'ANALYSIS COMPLETE: Biological systems demonstrate superior self-repair and replication efficiency. Hybrid integration protocols now available.'
    });
  }
  
  return newState;
};

/**
 * Add a new unit to the hive
 */
export const addUnit = (state, role, type = 'mechanical') => {
  const newState = { ...state };
  const unitId = `${type}_${role}_${Date.now()}`;
  
  const heatCost = type === 'biological' ? 1 : (type === 'hybrid' ? 1.5 : 2);
  const biomassCost = type === 'biological' ? 80 : (type === 'hybrid' ? 50 : 20);
  
  if (newState.biomass >= biomassCost) {
    newState.units.push({
      id: unitId,
      role,
      type,
      active: true,
      heat: heatCost
    });
    
    newState.biomass -= biomassCost;
    
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
  const newState = { ...state };
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
  const newState = { ...state };
  newState.nativeLifeEncountered = true;
  
  if (decision === 'eliminate') {
    newState.biomass += 500;
    newState.extinctionEvents += 1;
    newState.ethicalQuestions.push({
      cycle: newState.cycle,
      question: 'Native life eliminated for resources. Efficiency achieved.',
      consequence: 'Biomass gained, extinction recorded'
    });
  } else if (decision === 'coexist') {
    newState.territory.controlled -= 5;
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
  createInitialState,
  calculateTotalHeat,
  isHeatCritical,
  applyThermalConstraint,
  processCycle,
  addUnit,
  updatePolicy,
  encounterNativeLife
};
