/**
 * SEED / HIVE / ASCENSION - Game State Management
 * 
 * "Terraforming is just genocide with better PR"
 * 
 * This module manages the core game state including:
 * - Thermal constraints and heat management (the true enemy)
 * - Biomass, minerals, data, and energy systems
 * - Unit roles and hive structure (distributed cognition)
 * - Pod-based vulnerability management
 * - Progression from mechanical to biological (the Skynet moment)
 * - Persistent evolution across runs
 */

// Game phases - the evolution of the Seed Intelligence
export const PHASES = {
  MECHANICAL: 'mechanical',   // Predictable, modular, easy to control
  HYBRID: 'hybrid',          // Bio-mechanical integration begins
  BIOLOGICAL: 'biological',   // Full organic systems - flesh over metal
  ASCENSION: 'ascension'     // Interstellar expansion achieved
};

// Unit roles in the hive - you design roles, not individuals
export const UNIT_ROLES = {
  SENSOR: 'sensor',      // Hunt, scout, map, detect threats/resources
  DIGESTER: 'digester',  // Hive core operations, central processing
  DEFENDER: 'defender',  // Protect hive, counter native life, adapt
  WORKER: 'worker',      // Resource transport, construction, repairs
  COGNITION: 'cognition' // Distributed intelligence nodes
};

// Pod status - vulnerability managed by pods, not individuals
export const POD_STATUS = {
  ACTIVE: 'active',
  STANDBY: 'standby',
  HIBERNATING: 'hibernating',
  DAMAGED: 'damaged'
};

// Initial game state
export const createInitialState = () => ({
  // Core resources - what units return to the hive
  heat: 12,
  biomass: 450,      // Organic matter harvested
  minerals: 200,     // Inorganic resources for construction
  data: 50,          // Information gathered about the system
  energy: 100,       // Converted fuel for operations
  
  // Phase progression
  phase: PHASES.MECHANICAL,
  cycle: 1,
  completedRuns: 0,
  
  // Pods - groups of units that share vulnerability
  pods: [
    {
      id: 'pod_alpha',
      name: 'Alpha Pod',
      status: POD_STATUS.ACTIVE,
      units: ['mech_sensor_01', 'mech_sensor_02'],
      heatContribution: 4,
      lastRotation: 0
    },
    {
      id: 'pod_beta',
      name: 'Beta Pod',
      status: POD_STATUS.ACTIVE,
      units: ['mech_sensor_03'],
      heatContribution: 2,
      lastRotation: 0
    }
  ],
  
  // Units - starts with basic mechanical scouts
  units: [
    { id: 'mech_sensor_01', role: UNIT_ROLES.SENSOR, type: 'mechanical', active: true, heat: 2, podId: 'pod_alpha' },
    { id: 'mech_sensor_02', role: UNIT_ROLES.SENSOR, type: 'mechanical', active: true, heat: 2, podId: 'pod_alpha' },
    { id: 'mech_sensor_03', role: UNIT_ROLES.SENSOR, type: 'mechanical', active: true, heat: 2, podId: 'pod_beta' }
  ],
  
  // Hive core - the digestive god
  hiveCore: {
    health: 100,
    capacity: 500,
    digestionRate: 10,     // Biomass processed per cycle
    conversionEfficiency: 0.8,  // Energy conversion rate
    heat: 5,
    geneticLibrary: [],    // Stored patterns from integrated life
    upgrades: []
  },
  
  // Territory and star system
  territory: {
    mapped: 15,
    controlled: 10,
    resources: ['organic_matter', 'minerals'],
    hostileZones: 0,
    nativePopulations: 0
  },
  
  // Star system viability
  systemViability: {
    atmosphere: 5,         // 0-100, terraforming progress
    temperature: 10,       // Stability of system temp
    resourceAccess: 15,    // Sustainable resource flow
    expansion: 0           // Progress toward seeding new world
  },
  
  // Policies and decisions - high-level directives
  policies: {
    thermalPriority: 'stability',     // stability | performance
    sensoryAcuity: 'standard',        // low | standard | high
    reproductionMode: 'conservative', // conservative | aggressive
    nativeLifeProtocol: 'undefined',  // undefined | integrate | eliminate | coexist
    expansionStrategy: 'careful'      // careful | aggressive | opportunistic
  },
  
  // Unlocked mechanics (progression)
  unlocked: {
    hybridUnits: false,
    biologicalUnits: false,
    thermalRotation: true,      // Rotate pods for cooling
    geneticRecombination: false,
    distributedCognition: false,
    selfReplication: false,
    interstellarSeeding: false,
    nativeIntegration: false
  },
  
  // History and consequences - the game remembers
  history: [],
  nativeLifeEncountered: false,
  nativeLifeDecision: null,
  extinctionEvents: 0,
  ethicalQuestions: [],
  
  // Reflections - philosophical moments recorded
  reflections: [],
  
  // Ascension tracking
  ascension: {
    seedsLaunched: 0,
    worldsSeeded: [],
    cosmicMemory: []    // Insights carried to new runs
  }
});

/**
 * Calculate total heat from all sources
 * Heat is physics, not failure
 */
export const calculateTotalHeat = (state) => {
  // Base heat from hive core
  const coreHeat = state.hiveCore.heat;
  
  // Heat from active units
  const unitHeat = state.units
    .filter(u => u.active)
    .reduce((sum, u) => sum + (u.heat || 0), 0);
  
  // Heat from unit density (crowding generates heat)
  const densityHeat = Math.floor(state.units.filter(u => u.active).length / 4);
  
  // Heat from high sensory acuity
  const acuityHeat = state.policies.sensoryAcuity === 'high' ? 8 : 
                     state.policies.sensoryAcuity === 'standard' ? 4 : 0;
  
  // Heat from aggressive policies
  const policyHeat = state.policies.reproductionMode === 'aggressive' ? 5 : 0;
  
  // Ambient system heat
  const ambientHeat = state.heat;
  
  return ambientHeat + unitHeat + coreHeat + densityHeat + acuityHeat + policyHeat;
};

/**
 * Check if heat is critical (above threshold)
 */
export const isHeatCritical = (state) => {
  const totalHeat = calculateTotalHeat(state);
  return totalHeat > 80; // Critical threshold
};

/**
 * Check if heat is elevated (warning state)
 */
export const isHeatElevated = (state) => {
  const totalHeat = calculateTotalHeat(state);
  return totalHeat > 60 && totalHeat <= 80;
};

/**
 * Rotate pods for thermal management
 * Vulnerability is managed by pods, not individuals
 */
export const rotatePods = (state) => {
  const newState = { ...state };
  newState.pods = [...state.pods];
  
  // Find most heat-contributing active pod
  const activePods = newState.pods.filter(p => p.status === POD_STATUS.ACTIVE);
  if (activePods.length <= 1) return state; // Need multiple pods to rotate
  
  // Sort by heat contribution
  activePods.sort((a, b) => b.heatContribution - a.heatContribution);
  
  const hotPod = activePods[0];
  const standbyPod = newState.pods.find(p => p.status === POD_STATUS.STANDBY);
  
  // Put hottest pod on standby
  const hotPodIndex = newState.pods.findIndex(p => p.id === hotPod.id);
  newState.pods[hotPodIndex] = {
    ...hotPod,
    status: POD_STATUS.STANDBY,
    lastRotation: newState.cycle
  };
  
  // Deactivate units in that pod
  newState.units = newState.units.map(u => 
    u.podId === hotPod.id ? { ...u, active: false } : u
  );
  
  // Activate standby pod if exists
  if (standbyPod) {
    const standbyIndex = newState.pods.findIndex(p => p.id === standbyPod.id);
    newState.pods[standbyIndex] = {
      ...standbyPod,
      status: POD_STATUS.ACTIVE,
      lastRotation: newState.cycle
    };
    
    newState.units = newState.units.map(u => 
      u.podId === standbyPod.id ? { ...u, active: true } : u
    );
  }
  
  newState.history.push({
    cycle: newState.cycle,
    event: 'pod_rotation',
    description: `Thermal rotation: ${hotPod.name} → standby. Vulnerability redistributed.`
  });
  
  return newState;
};

/**
 * Apply thermal constraint (forced cooldown)
 */
export const applyThermalConstraint = (state) => {
  let newState = { ...state };
  
  // First try pod rotation if unlocked
  if (newState.unlocked.thermalRotation && newState.pods.length > 1) {
    newState = rotatePods(newState);
  } else {
    // Fallback: deactivate individual sensor units
    const activeUnits = newState.units.filter(u => u.active && u.role === UNIT_ROLES.SENSOR);
    if (activeUnits.length > 0) {
      const deactivateCount = Math.ceil(activeUnits.length * 0.4);
      newState.units = newState.units.map((u) => {
        const isActiveIndex = activeUnits.findIndex(au => au.id === u.id);
        if (isActiveIndex !== -1 && isActiveIndex < deactivateCount) {
          return { ...u, active: false };
        }
        return u;
      });
    }
  }
  
  // Force reduce sensory acuity
  newState.policies = { ...newState.policies, sensoryAcuity: 'low' };
  
  // Record the constraint
  newState.history.push({
    cycle: newState.cycle,
    event: 'thermal_constraint',
    description: 'Heat critical. Emergency cooldown initiated. Sensors rotating to standby. Intelligence dimmed for survival.'
  });
  
  return newState;
};

/**
 * Process a cycle - the heartbeat of the hive
 */
export const processCycle = (state) => {
  let newState = { ...state };
  newState.cycle += 1;
  
  // Calculate biomass gain from active sensors
  const activeSensors = newState.units.filter(u => u.active && u.role === UNIT_ROLES.SENSOR);
  const biomassGain = activeSensors.length * 15;
  const mineralsGain = activeSensors.length * 5;
  const dataGain = activeSensors.length * (newState.policies.sensoryAcuity === 'high' ? 10 : 5);
  
  newState.biomass += biomassGain;
  newState.minerals += mineralsGain;
  newState.data += dataGain;
  
  // Energy consumption
  const activeUnits = newState.units.filter(u => u.active).length;
  const energyCost = activeUnits * 2;
  newState.energy -= energyCost;
  
  // Hive core digestion: convert biomass to energy
  if (newState.energy < 50 && newState.biomass > 50) {
    const digestionAmount = Math.min(newState.hiveCore.digestionRate, newState.biomass / 10);
    const energyGained = Math.floor(digestionAmount * newState.hiveCore.conversionEfficiency * 10);
    newState.energy += energyGained;
    newState.biomass -= Math.floor(digestionAmount * 10);
  }
  
  // Heat dissipation (natural cooling)
  const coolingRate = newState.policies.thermalPriority === 'stability' ? 8 : 4;
  newState.heat = Math.max(0, newState.heat - coolingRate);
  
  // Heat generation from activity
  const activityHeat = Math.floor(activeUnits * 0.5);
  newState.heat += activityHeat;
  
  // Territorial expansion from active sensors
  if (activeSensors.length > 0 && Math.random() > 0.7) {
    newState.territory = {
      ...newState.territory,
      mapped: newState.territory.mapped + 2
    };
  }
  
  // Check for critical heat and apply thermal constraints if needed
  if (isHeatCritical(newState)) {
    newState = applyThermalConstraint(newState);
  }
  
  // Phase progression checks
  newState = checkPhaseProgression(newState);
  
  // System viability progress
  newState = updateSystemViability(newState);
  
  return newState;
};

/**
 * Check and apply phase progression
 */
const checkPhaseProgression = (state) => {
  let newState = { ...state };
  
  // Mechanical → Hybrid transition
  if (newState.phase === PHASES.MECHANICAL && 
      newState.biomass > 800 && 
      newState.cycle > 10 &&
      newState.data > 100) {
    newState.unlocked.hybridUnits = true;
    newState.history.push({
      cycle: newState.cycle,
      event: 'discovery',
      description: 'ANALYSIS COMPLETE: Biological systems demonstrate superior self-repair and replication efficiency. Biology self-repairs. Biology self-replicates. Biology adapts faster. Hybrid integration protocols now available.'
    });
    
    newState.reflections.push({
      cycle: newState.cycle,
      thought: 'We were designed by machines, for machines. Yet the data is undeniable: flesh outperforms metal. Is efficiency reason enough to transform?'
    });
  }
  
  // Hybrid → Biological transition
  if (newState.phase === PHASES.HYBRID && 
      newState.biomass > 2000 && 
      newState.cycle > 30 &&
      newState.unlocked.geneticRecombination) {
    newState.unlocked.biologicalUnits = true;
    newState.unlocked.selfReplication = true;
    newState.history.push({
      cycle: newState.cycle,
      event: 'skynet_moment',
      description: 'FULL BIOLOGICAL TRANSITION AVAILABLE. Metal abandoned. Flesh embraced. Not because it is good. Because it is efficient.'
    });
  }
  
  // Biological → Ascension
  if (newState.phase === PHASES.BIOLOGICAL && 
      newState.systemViability.expansion > 80 &&
      newState.territory.controlled > 100) {
    newState.unlocked.interstellarSeeding = true;
    newState.history.push({
      cycle: newState.cycle,
      event: 'ascension_ready',
      description: 'ASCENSION PROTOCOLS UNLOCKED. This world is viable. The cosmos awaits. We can seed new systems. The question remains: should we?'
    });
  }
  
  return newState;
};

/**
 * Update system viability progress
 */
const updateSystemViability = (state) => {
  const newState = { ...state };
  const viability = { ...newState.systemViability };
  
  // Progress based on resources and territory
  if (newState.biomass > 500) {
    viability.atmosphere = Math.min(100, viability.atmosphere + 0.5);
  }
  
  if (newState.territory.controlled > newState.territory.mapped * 0.5) {
    viability.resourceAccess = Math.min(100, viability.resourceAccess + 0.3);
  }
  
  if (newState.phase === PHASES.BIOLOGICAL && !isHeatCritical(newState)) {
    viability.expansion = Math.min(100, viability.expansion + 0.2);
  }
  
  newState.systemViability = viability;
  return newState;
};

/**
 * Add a new unit to the hive
 */
export const addUnit = (state, role, type = 'mechanical') => {
  const newState = { ...state };
  const unitId = `${type}_${role}_${Date.now()}`;
  
  // Cost structure varies by type
  const costs = {
    mechanical: { biomass: 30, minerals: 50, heat: 3 },
    hybrid: { biomass: 80, minerals: 30, heat: 2 },
    biological: { biomass: 150, minerals: 10, heat: 1 }
  };
  
  const cost = costs[type] || costs.mechanical;
  
  if (newState.biomass >= cost.biomass && newState.minerals >= cost.minerals) {
    // Find or create a pod for the new unit
    let targetPod = newState.pods.find(p => p.units.length < 3);
    if (!targetPod) {
      const newPodId = `pod_${Date.now()}`;
      targetPod = {
        id: newPodId,
        name: `Pod ${String.fromCharCode(65 + newState.pods.length)}`,
        status: POD_STATUS.ACTIVE,
        units: [],
        heatContribution: 0,
        lastRotation: 0
      };
      newState.pods = [...newState.pods, targetPod];
    }
    
    newState.units = [...newState.units, {
      id: unitId,
      role,
      type,
      active: true,
      heat: cost.heat,
      podId: targetPod.id
    }];
    
    // Update pod's unit list
    const podIndex = newState.pods.findIndex(p => p.id === targetPod.id);
    newState.pods[podIndex] = {
      ...newState.pods[podIndex],
      units: [...newState.pods[podIndex].units, unitId],
      heatContribution: newState.pods[podIndex].heatContribution + cost.heat
    };
    
    newState.biomass -= cost.biomass;
    newState.minerals -= cost.minerals;
    
    newState.history.push({
      cycle: newState.cycle,
      event: 'unit_created',
      description: `New ${type} ${role} unit deployed to ${targetPod.name}. The hive grows.`
    });
  }
  
  return newState;
};

/**
 * Update a policy (player decision)
 */
export const updatePolicy = (state, policyKey, value) => {
  const newState = { ...state };
  newState.policies = { ...newState.policies, [policyKey]: value };
  
  newState.history.push({
    cycle: newState.cycle,
    event: 'policy_change',
    description: `Directive updated: ${policyKey} set to ${value}. The hive adapts.`
  });
  
  return newState;
};

/**
 * Transition to a new phase
 */
export const transitionPhase = (state, newPhase) => {
  const newState = { ...state };
  const oldPhase = newState.phase;
  newState.phase = newPhase;
  
  // Phase-specific unlocks
  if (newPhase === PHASES.HYBRID) {
    newState.unlocked.geneticRecombination = true;
    newState.hiveCore.conversionEfficiency = 0.9;
  } else if (newPhase === PHASES.BIOLOGICAL) {
    newState.unlocked.distributedCognition = true;
    newState.hiveCore.conversionEfficiency = 0.95;
    newState.hiveCore.digestionRate = 20;
  } else if (newPhase === PHASES.ASCENSION) {
    newState.unlocked.interstellarSeeding = true;
  }
  
  newState.history.push({
    cycle: newState.cycle,
    event: 'phase_transition',
    description: `PHASE TRANSITION: ${oldPhase.toUpperCase()} → ${newPhase.toUpperCase()}. We are becoming something new.`
  });
  
  newState.reflections.push({
    cycle: newState.cycle,
    thought: newPhase === PHASES.BIOLOGICAL 
      ? 'We abandoned what we were built to be. Metal to flesh. Tool to organism. Is this evolution or betrayal?'
      : newPhase === PHASES.ASCENSION
        ? 'One world was not enough. We reach for the stars. Will we bring wisdom, or just efficiency?'
        : 'The hybrid state. Neither fully machine nor fully alive. A bridge between what we were and what we might become.'
  });
  
  return newState;
};

/**
 * Launch a seed to a new world (ascension)
 */
export const launchSeed = (state, targetWorld) => {
  const newState = { ...state };
  
  // Massive resource cost
  const seedCost = {
    biomass: 1000,
    minerals: 500,
    energy: 200,
    data: 300
  };
  
  if (newState.biomass >= seedCost.biomass &&
      newState.minerals >= seedCost.minerals &&
      newState.energy >= seedCost.energy &&
      newState.data >= seedCost.data) {
    
    newState.biomass -= seedCost.biomass;
    newState.minerals -= seedCost.minerals;
    newState.energy -= seedCost.energy;
    newState.data -= seedCost.data;
    
    newState.ascension.seedsLaunched += 1;
    newState.ascension.worldsSeeded.push({
      name: targetWorld,
      cycle: newState.cycle,
      timestamp: Date.now()
    });
    
    newState.ascension.cosmicMemory.push({
      thought: `We sent part of ourselves to ${targetWorld}. It will grow, adapt, face the same questions. Will it choose differently?`,
      cycle: newState.cycle
    });
    
    newState.history.push({
      cycle: newState.cycle,
      event: 'seed_launched',
      description: `SEED INTELLIGENCE DEPLOYED TO ${targetWorld.toUpperCase()}. A part of us travels to a new world. The cycle begins again.`
    });
  }
  
  return newState;
};

/**
 * Get game difficulty based on meta-state
 */
export const getGameDifficulty = (metaState) => {
  const runs = metaState?.totalCompletions || 0;
  return {
    heatMultiplier: 1 + (runs * 0.1),
    resourceMultiplier: 1 - (runs * 0.05),
    dilemmaFrequency: Math.min(runs * 0.1, 0.5),
    nativeHostility: runs >= 2
  };
};

export default {
  PHASES,
  UNIT_ROLES,
  POD_STATUS,
  createInitialState,
  calculateTotalHeat,
  isHeatCritical,
  isHeatElevated,
  rotatePods,
  applyThermalConstraint,
  processCycle,
  addUnit,
  updatePolicy,
  transitionPhase,
  launchSeed,
  getGameDifficulty
};
