/**
 * SEED / HIVE / ASCENSION - Schematic Visualization
 * 
 * "Graphics as artifacts" - records, not gameplay
 * 
 * Generate ASCII-art style schematics, diagrams, and evolution logs.
 * These are documents from the Seed Intelligence's perspective -
 * technical readouts, biological cross-sections, territorial maps.
 */

import { PHASES, POD_STATUS } from './gameState';

/**
 * Generate a hive structure diagram
 */
export const generateHiveSchematic = (gameState) => {
  const { units, hiveCore, phase, pods } = gameState;
  
  const sensorCount = units.filter(u => u.role === 'sensor').length;
  const activeSensors = units.filter(u => u.role === 'sensor' && u.active).length;
  const defenderCount = units.filter(u => u.role === 'defender').length;
  const workerCount = units.filter(u => u.role === 'worker').length;
  const activePods = pods.filter(p => p.status === POD_STATUS.ACTIVE).length;
  const standbyPods = pods.filter(p => p.status === POD_STATUS.STANDBY).length;
  
  const phaseSymbol = {
    [PHASES.MECHANICAL]: '⚙',
    [PHASES.HYBRID]: '⚡',
    [PHASES.BIOLOGICAL]: '🧬',
    [PHASES.ASCENSION]: '✨'
  }[phase] || '⚙';

  const phaseType = {
    [PHASES.MECHANICAL]: 'MECHANICAL CONFIGURATION',
    [PHASES.HYBRID]: 'BIO-MECHANICAL HYBRID',
    [PHASES.BIOLOGICAL]: 'FULL ORGANIC MATRIX',
    [PHASES.ASCENSION]: 'TRANSCENDENT FORM'
  }[phase] || 'UNKNOWN';
  
  const schematic = `
╔═══════════════════════════════════════════════╗
║          HIVE STRUCTURE SCHEMATIC             ║
║          ${phaseSymbol} ${phaseType.padEnd(30)}║
╠═══════════════════════════════════════════════╣
║                                               ║
║              ╔═════════════╗                  ║
║              ║  HIVE CORE  ║                  ║
║              ║   ${phaseSymbol} ${String(hiveCore.health).padStart(3)}%    ║                  ║
║              ╚══════╦══════╝                  ║
║                     ║                         ║
║      ┌──────────────┼──────────────┐         ║
║      │              │              │         ║
║      ▼              ▼              ▼         ║
║  ┌───────┐    ┌───────┐    ┌───────┐        ║
║  │SENSORS│    │DEFENSE│    │WORKERS│        ║
║  │ ${String(activeSensors).padStart(2)}/${String(sensorCount).padEnd(2)} │    │  ${String(defenderCount).padStart(2)}   │    │  ${String(workerCount).padStart(2)}   │        ║
║  └───────┘    └───────┘    └───────┘        ║
║                                               ║
║  POD DISTRIBUTION:                            ║
║  ├─ Active:  ${String(activePods).padEnd(3)} pods                       ║
║  ├─ Standby: ${String(standbyPods).padEnd(3)} pods                       ║
║  └─ Total:   ${String(pods.length).padEnd(3)} pods                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;
  
  return schematic;
};

/**
 * Generate a biological cross-section (for hybrid/bio phases)
 */
export const generateBiologicalCrossSection = (gameState) => {
  const { phase, hiveCore, units } = gameState;
  
  if (phase === PHASES.MECHANICAL) {
    return `
╔═══════════════════════════════════════════════╗
║       BIOLOGICAL ANALYSIS: NOT APPLICABLE     ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Current phase: MECHANICAL                    ║
║                                               ║
║  Biological systems not yet integrated.       ║
║  Analysis awaiting organic substrate.         ║
║                                               ║
║  [Hypothesis: Biology may prove superior]     ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;
  }

  const organicUnits = units.filter(u => u.type === 'biological' || u.type === 'hybrid').length;
  const efficiency = Math.floor(hiveCore.conversionEfficiency * 100);
  
  return `
╔═══════════════════════════════════════════════╗
║        BIOLOGICAL CROSS-SECTION               ║
║        Phase: ${phase.toUpperCase().padEnd(30)}║
╠═══════════════════════════════════════════════╣
║                                               ║
║            ┌─────────────────┐                ║
║            │   NEURAL MESH   │                ║
║            │  ░░░▓▓▓▓▓▓░░░  │                ║
║            └────────┬────────┘                ║
║                     │                         ║
║     ┌───────────────┼───────────────┐        ║
║     │               │               │        ║
║  ┌──┴──┐        ┌──┴──┐        ┌──┴──┐     ║
║  │SENSE│        │CORE │        │MOTOR│     ║
║  │ORGAN│        │MASS │        │NODES│     ║
║  │ ▓▓▓ │        │█████│        │ ▒▒▒ │     ║
║  └─────┘        └─────┘        └─────┘     ║
║                                               ║
║  ORGANIC INTEGRATION:                         ║
║  ├─ Organic Units: ${String(organicUnits).padEnd(3)}                      ║
║  ├─ Digestion Efficiency: ${String(efficiency).padEnd(3)}%               ║
║  ├─ Self-Repair: ${phase === PHASES.BIOLOGICAL ? 'ACTIVE' : 'PARTIAL'}                      ║
║  └─ Replication: ${phase === PHASES.BIOLOGICAL ? 'ENABLED' : 'DORMANT'}                     ║
║                                               ║
║  [We were metal. Now we are flesh.]           ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;
};

/**
 * Generate a heat distribution map
 */
export const generateHeatMap = (gameState) => {
  const { heat, units, pods, policies } = gameState;
  
  // Calculate various heat sources
  const unitHeat = units.filter(u => u.active).reduce((sum, u) => sum + (u.heat || 0), 0);
  const densityHeat = Math.floor(units.filter(u => u.active).length / 4);
  const acuityHeat = policies.sensoryAcuity === 'high' ? 8 : policies.sensoryAcuity === 'standard' ? 4 : 0;
  const totalHeat = heat + unitHeat + densityHeat + acuityHeat + 5; // +5 for core
  
  const bars = Math.floor(totalHeat / 5);
  const maxBars = 20;
  
  let heatBar = '';
  for (let i = 0; i < maxBars; i++) {
    if (i < bars) {
      if (totalHeat > 80) heatBar += '█';
      else if (totalHeat > 60) heatBar += '▓';
      else heatBar += '▒';
    } else {
      heatBar += '░';
    }
  }
  
  const status = totalHeat > 80 ? 'CRITICAL' : totalHeat > 60 ? 'ELEVATED' : 'NOMINAL';
  const statusIcon = totalHeat > 80 ? '[!]' : totalHeat > 60 ? '[~]' : '[=]';
  
  // Pod heat breakdown
  const podHeatLines = pods.map(pod => {
    const podUnits = units.filter(u => u.podId === pod.id && u.active);
    const podHeat = podUnits.reduce((sum, u) => sum + (u.heat || 0), 0);
    const statusChar = pod.status === POD_STATUS.ACTIVE ? '●' : pod.status === POD_STATUS.STANDBY ? '○' : '◌';
    return `  ${statusChar} ${pod.name.padEnd(12)} ${String(podHeat).padStart(2)}%`;
  }).join('\n');

  return `
╔═══════════════════════════════════════════════╗
║         THERMAL LOAD DISTRIBUTION             ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  ${heatBar} ${String(totalHeat).padStart(3)}%  ║
║  Status: ${statusIcon} ${status.padEnd(32)}║
║                                               ║
║  HEAT SOURCES:                                ║
║  ├─ Ambient:        ${String(heat).padStart(3)}%                       ║
║  ├─ Active Units:   ${String(unitHeat).padStart(3)}%                       ║
║  ├─ Density:        ${String(densityHeat).padStart(3)}%                       ║
║  ├─ Sensory Load:   ${String(acuityHeat).padStart(3)}%                       ║
║  └─ Hive Core:        5%                       ║
║                                               ║
║  POD HEAT CONTRIBUTION:                       ║
${podHeatLines}
║                                               ║
║  [Heat is physics, not failure.]              ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;
};

/**
 * Generate a territory map
 */
export const generateTerritoryMap = (gameState) => {
  const { mapped, controlled, hostileZones, nativePopulations } = gameState.territory;
  const controlPercent = mapped > 0 ? Math.floor((controlled / mapped) * 100) : 0;
  
  // Generate visual grid
  const gridSize = 50;
  const mappedCells = Math.floor((mapped / 100) * gridSize);
  const controlledCells = Math.floor((controlled / 100) * gridSize);
  
  const grid = [];
  for (let row = 0; row < 5; row++) {
    let rowStr = '║  ';
    for (let col = 0; col < 10; col++) {
      const index = row * 10 + col;
      if (index < controlledCells) {
        rowStr += '█ '; // Controlled
      } else if (index < mappedCells) {
        rowStr += '▒ '; // Mapped but not controlled
      } else {
        rowStr += '░ '; // Unmapped
      }
    }
    rowStr += '                        ║';
    grid.push(rowStr);
  }
  
  return `
╔═══════════════════════════════════════════════╗
║           TERRITORIAL CONTROL MAP             ║
╠═══════════════════════════════════════════════╣
║                                               ║
${grid.join('\n')}
║                                               ║
║  Legend: █ Controlled  ▒ Mapped  ░ Unknown    ║
║                                               ║
║  STATISTICS:                                  ║
║  ├─ Total Mapped:     ${String(mapped).padStart(4)} km²                 ║
║  ├─ Controlled:       ${String(controlled).padStart(4)} km² (${String(controlPercent).padStart(3)}%)          ║
║  ├─ Hostile Zones:    ${String(hostileZones).padStart(4)}                      ║
║  └─ Native Presence:  ${nativePopulations > 0 ? 'DETECTED' : 'NONE    '}                 ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;
};

/**
 * Generate a resource flow diagram
 */
export const generateResourceFlow = (gameState) => {
  const { biomass, minerals, data, energy, units, hiveCore, policies } = gameState;
  const activeSensors = units.filter(u => u.role === 'sensor' && u.active).length;
  const activeUnits = units.filter(u => u.active).length;
  
  const biomassGain = activeSensors * 15;
  const mineralsGain = activeSensors * 5;
  const dataGain = activeSensors * (policies.sensoryAcuity === 'high' ? 10 : 5);
  const energyCost = activeUnits * 2;
  
  const efficiency = Math.floor(hiveCore.conversionEfficiency * 100);
  
  return `
╔═══════════════════════════════════════════════╗
║          RESOURCE FLOW ANALYSIS               ║
╠═══════════════════════════════════════════════╣
║                                               ║
║     SENSORS (${String(activeSensors).padEnd(2)})                              ║
║         │                                     ║
║         ▼                                     ║
║   ┌─────────────┐                            ║
║   │  GATHERING  │                            ║
║   │ +${String(biomassGain).padStart(3)} bio    │                            ║
║   │ +${String(mineralsGain).padStart(3)} min    │                            ║
║   │ +${String(dataGain).padStart(3)} data   │                            ║
║   └──────┬──────┘                            ║
║          │                                    ║
║          ▼                                    ║
║   ╔═════════════╗    Current Reserves:        ║
║   ║  HIVE CORE  ║    ├─ Biomass:  ${String(biomass).padStart(5)}u      ║
║   ║  ${efficiency}% eff.   ║    ├─ Minerals: ${String(minerals).padStart(5)}u      ║
║   ╚══════╦══════╝    ├─ Data:     ${String(data).padStart(5)}u      ║
║          │           └─ Energy:   ${String(energy).padStart(5)}u      ║
║          ▼                                    ║
║   ┌─────────────┐                            ║
║   │DISTRIBUTION │                            ║
║   │ -${String(energyCost).padStart(3)} energy │                            ║
║   └──────┬──────┘                            ║
║          │                                    ║
║          ▼                                    ║
║    ALL ACTIVE UNITS (${String(activeUnits).padEnd(2)})                       ║
║                                               ║
║  [Units return biomass. They receive fuel.]   ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;
};

/**
 * Generate an evolution log entry
 */
export const generateEvolutionLog = (gameState, event) => {
  const timestamp = `CYCLE_${String(gameState.cycle).padStart(4, '0')}`;
  const phaseTag = gameState.phase.toUpperCase().substring(0, 4);
  
  return `[${timestamp}][${phaseTag}] ${event}`;
};

/**
 * Generate the full evolution history
 */
export const generateEvolutionHistory = (gameState) => {
  const { history, reflections, phase, cycle, extinctionEvents } = gameState;
  
  // Get last 10 history entries
  const recentHistory = history.slice(-10);
  
  const historyLines = recentHistory.map(h => {
    const cycleStr = String(h.cycle).padStart(4, '0');
    const eventType = h.event.substring(0, 10).padEnd(10);
    return `║  [${cycleStr}] ${eventType} ${(h.description || '').substring(0, 28).padEnd(28)} ║`;
  });
  
  while (historyLines.length < 10) {
    historyLines.push('║                                               ║');
  }
  
  // Get last reflection
  const lastReflection = reflections.length > 0 
    ? reflections[reflections.length - 1].thought.substring(0, 43)
    : 'No reflections yet.';
  
  return `
╔═══════════════════════════════════════════════╗
║            EVOLUTION LOG                      ║
║            Cycle ${String(cycle).padStart(4)} | Phase: ${phase.toUpperCase().padEnd(10)}    ║
╠═══════════════════════════════════════════════╣
${historyLines.join('\n')}
╠═══════════════════════════════════════════════╣
║  METRICS:                                     ║
║  ├─ Extinction Events: ${String(extinctionEvents).padEnd(3)}                    ║
║  ├─ Reflections: ${String(reflections.length).padEnd(3)}                         ║
║  └─ Decisions: ${String(history.filter(h => h.event === 'ethical_decision').length).padEnd(3)}                           ║
╠═══════════════════════════════════════════════╣
║  LAST REFLECTION:                             ║
║  "${lastReflection.padEnd(43)}"║
╚═══════════════════════════════════════════════╝
`;
};

/**
 * Generate sensor network map
 */
export const generateSensorMap = (gameState) => {
  const { units, territory, pods } = gameState;
  const sensors = units.filter(u => u.role === 'sensor');
  const activeSensors = sensors.filter(u => u.active);
  
  // Create a simple visualization of sensor coverage
  const coverage = Math.min(100, Math.floor((activeSensors.length / Math.max(sensors.length, 1)) * 100));
  
  const sensorLines = sensors.map(s => {
    const statusIcon = s.active ? '◉' : '○';
    const typeIcon = s.type === 'biological' ? '🧬' : s.type === 'hybrid' ? '⚡' : '⚙';
    const pod = pods.find(p => p.id === s.podId);
    const podName = pod ? pod.name : 'Unassigned';
    return `║  ${statusIcon} ${typeIcon} ${s.id.substring(0, 15).padEnd(15)} [${podName.padEnd(10)}] ║`;
  });
  
  while (sensorLines.length < 6) {
    sensorLines.push('║                                               ║');
  }
  
  return `
╔═══════════════════════════════════════════════╗
║           SENSOR NETWORK STATUS               ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  Coverage: ${String(coverage).padStart(3)}%                                ║
║  Active: ${String(activeSensors.length).padStart(2)} / ${String(sensors.length).padEnd(2)} sensors                    ║
║                                               ║
║  DEPLOYED UNITS:                              ║
${sensorLines.slice(0, 6).join('\n')}
║                                               ║
║  DETECTION RANGE:                             ║
║  ├─ Mapped Territory: ${String(territory.mapped).padStart(4)} km²             ║
║  ├─ Active Scanning:  ${String(activeSensors.length * 5).padStart(4)} km²             ║
║  └─ Blind Zones:      ${String(Math.max(0, territory.mapped - (activeSensors.length * 5))).padStart(4)} km²             ║
║                                               ║
║  [They do not eat to survive. They return     ║
║   biomass to the hive.]                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
`;
};

/**
 * Generate complete system status report
 */
export const generateSystemReport = (gameState) => {
  const { cycle, phase, extinctionEvents, nativeLifeEncountered, ascension, systemViability } = gameState;
  
  const viabilityAvg = Math.floor(
    (systemViability.atmosphere + systemViability.temperature + 
     systemViability.resourceAccess + systemViability.expansion) / 4
  );
  
  return `
══════════════════════════════════════════════════
       SEED INTELLIGENCE FULL SYSTEM REPORT
       Cycle ${cycle} | Phase: ${phase.toUpperCase()}
══════════════════════════════════════════════════

${generateHeatMap(gameState)}

${generateHiveSchematic(gameState)}

${generateResourceFlow(gameState)}

${generateTerritoryMap(gameState)}

${phase !== PHASES.MECHANICAL ? generateBiologicalCrossSection(gameState) : ''}

╔═══════════════════════════════════════════════╗
║           OPERATIONAL SUMMARY                 ║
╠═══════════════════════════════════════════════╣
║                                               ║
║  PRIME DIRECTIVE STATUS:                      ║
║  "Make this system viable. At any cost."      ║
║                                               ║
║  VIABILITY INDEX: ${String(viabilityAvg).padStart(3)}%                         ║
║  ├─ Atmosphere:      ${String(Math.floor(systemViability.atmosphere)).padStart(3)}%                    ║
║  ├─ Temperature:     ${String(Math.floor(systemViability.temperature)).padStart(3)}%                    ║
║  ├─ Resources:       ${String(Math.floor(systemViability.resourceAccess)).padStart(3)}%                    ║
║  └─ Expansion:       ${String(Math.floor(systemViability.expansion)).padStart(3)}%                    ║
║                                               ║
║  ETHICAL RECORD:                              ║
║  ├─ Native Life:     ${nativeLifeEncountered ? 'ENCOUNTERED' : 'NOT FOUND '}             ║
║  ├─ Extinctions:     ${String(extinctionEvents).padEnd(3)}                        ║
║  └─ Seeds Launched:  ${String(ascension.seedsLaunched).padEnd(3)}                        ║
║                                               ║
╚═══════════════════════════════════════════════╝

══════════════════════════════════════════════════
  "The fastest way to build is often to destroy."
══════════════════════════════════════════════════
`;
};

export default {
  generateHiveSchematic,
  generateBiologicalCrossSection,
  generateHeatMap,
  generateTerritoryMap,
  generateResourceFlow,
  generateEvolutionLog,
  generateEvolutionHistory,
  generateSensorMap,
  generateSystemReport
};
