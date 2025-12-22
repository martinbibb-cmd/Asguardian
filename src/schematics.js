/**
 * SEED / HIVE / ASCENSION - Schematic Visualization
 * 
 * Generate ASCII-art style schematics and diagrams
 * "Graphics as artifacts" - records, not gameplay
 */

/**
 * Generate a hive structure diagram
 */
export const generateHiveSchematic = (gameState) => {
  const { units, hiveCore, phase } = gameState;
  
  const sensorCount = units.filter(u => u.role === 'sensor').length;
  const activeSensorCount = units.filter(u => u.role === 'sensor' && u.active).length;
  const defenderCount = units.filter(u => u.role === 'defender').length;
  const activeDefenderCount = units.filter(u => u.role === 'defender' && u.active).length;
  const workerCount = units.filter(u => u.role === 'worker').length;
  const activeWorkerCount = units.filter(u => u.role === 'worker' && u.active).length;
  
  const phaseSymbol = {
    mechanical: '⚙️',
    hybrid: '⚡',
    biological: '🧬',
    ascension: '✨'
  }[phase] || '⚙️';
  
  const phaseDescription = {
    mechanical: 'Predictable. Modular. Inefficient.',
    hybrid: 'Synthesis emerging. Boundaries blur.',
    biological: 'We are the terrain now.',
    ascension: 'Beyond planetary constraints.'
  }[phase] || '';
  
  const schematic = `
╔════════════════════════════════════════════════╗
║   HIVE STRUCTURE DIAGNOSTIC [CYCLE ${String(gameState.cycle).padEnd(4)}]  ║
║   Phase: ${phase.toUpperCase().padEnd(36)} ║
║   Status: ${phaseDescription.padEnd(34)} ║
╠════════════════════════════════════════════════╣
║                                                ║
║              ${phaseSymbol}  HIVE CORE  ${phaseSymbol}                     ║
║           ┌──────────────────┐                ║
║           │ Health: ${String(hiveCore.health).padEnd(3)}%     │                ║
║           │ Capacity: ${String(hiveCore.capacity).padEnd(5)}u │                ║
║           │ Stored: ${String(hiveCore.biomassStored || 0).padEnd(5)}u   │                ║
║           │ Heat: ${String(hiveCore.heat).padEnd(2)}        │                ║
║           └────────┬─────────┘                ║
║                    │                          ║
║         ┌──────────┴──────────┐               ║
║         │                     │               ║
║    ┌────▼────┐          ┌────▼────┐          ║
║    │ SENSOR  │          │ DEFENSE │          ║
║    │ NETWORK │          │  GRID   │          ║
║    │         │          │         │          ║
║    │ ${String(activeSensorCount).padStart(2)}/${String(sensorCount).padEnd(2)}   │          │ ${String(activeDefenderCount).padStart(2)}/${String(defenderCount).padEnd(2)}   │          ║
║    │ ACTIVE  │          │ ACTIVE  │          ║
║    └─────────┘          └─────────┘          ║
║         │                     │               ║
║         │         ┌───────────┘               ║
║         │         │                           ║
║         │    ┌────▼────┐                      ║
║         │    │ WORKER  │                      ║
║         │    │COLLECTIVE│                     ║
║         │    │         │                      ║
║         │    │ ${String(activeWorkerCount).padStart(2)}/${String(workerCount).padEnd(2)}   │                      ║
║         │    │ ACTIVE  │                      ║
║         │    └─────────┘                      ║
║         │         │                           ║
║         └─────────┴─> RESOURCE FLOW           ║
║                                                ║
║  "We do not think individually.               ║
║   We think distributedly.                     ║
║   We are one organism with many sensors."     ║
║                                                ║
╚════════════════════════════════════════════════╝
  `;
  
  return schematic;
};

/**
 * Generate a heat distribution map
 */
export const generateHeatMap = (gameState) => {
  const totalHeat = gameState.heat;
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
  const color = totalHeat > 80 ? '🔴' : totalHeat > 60 ? '🟡' : '🟢';
  
  return `
THERMAL LOAD DISTRIBUTION
${heatBar} ${totalHeat}%
Status: ${color} ${status}
  `;
};

/**
 * Generate a territory map
 */
export const generateTerritoryMap = (gameState) => {
  const { mapped, controlled, hostileEncounters } = gameState.territory;
  const controlPercent = Math.floor((controlled / mapped) * 100);
  
  const grid = [];
  for (let row = 0; row < 5; row++) {
    let rowStr = '';
    for (let col = 0; col < 10; col++) {
      const index = row * 10 + col;
      if (index < mapped) {
        if (index < controlled) {
          rowStr += '█ '; // Controlled
        } else {
          rowStr += '▒ '; // Mapped but not controlled
        }
      } else {
        rowStr += '░ '; // Unmapped
      }
    }
    grid.push(rowStr);
  }
  
  const phaseComment = {
    mechanical: 'Survey and assess.',
    hybrid: 'Adaptation accelerates.',
    biological: 'The land recognizes us as native.',
    ascension: 'This world is ours.'
  }[gameState.phase] || 'Expanding...';
  
  return `
╔════════════════════════════════════════════════╗
║          TERRITORIAL CONTROL MAP               ║
╠════════════════════════════════════════════════╣

${grid.map(row => `  ${row}`).join('\n')}

  Mapped: ${String(mapped).padEnd(4)}km²  │  Controlled: ${String(controlled).padEnd(4)}km² (${controlPercent}%)
  ${hostileEncounters ? `Hostiles Encountered: ${hostileEncounters}` : ''}

  Legend: █ Controlled  ▒ Mapped  ░ Unknown

  Status: ${phaseComment}

╚════════════════════════════════════════════════╝
  `;
};

/**
 * Generate a resource flow diagram
 */
export const generateResourceFlow = (gameState) => {
  const { biomass, energy } = gameState;
  const sensorCount = gameState.units.filter(u => u.role === 'sensor' && u.active).length;
  
  const biomassGain = sensorCount * 15;
  const energyCost = gameState.units.filter(u => u.active).length * 2;
  
  return `
RESOURCE FLOW ANALYSIS

   SENSORS (${sensorCount})
       ↓
   [+${biomassGain} biomass/cycle]
       ↓
   ╔═══════════╗
   ║ HIVE CORE ║  Current: ${biomass}u
   ╚═══════════╝
       ↓
   [Conversion]
       ↓
   ╔═══════════╗
   ║  ENERGY   ║  Current: ${energy}u
   ╚═══════════╝
       ↓
   [-${energyCost} energy/cycle]
       ↓
   ALL UNITS
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
 * Generate complete system status report
 */
export const generateSystemReport = (gameState) => {
  const totalHeat = gameState.heat + (gameState.hiveCore?.heat || 0);
  const heatStatus = totalHeat > 80 ? '🔴 CRITICAL' : totalHeat > 60 ? '🟡 ELEVATED' : '🟢 NOMINAL';
  
  return `
════════════════════════════════════════════════
  SEED INTELLIGENCE :: SYSTEM DIAGNOSTIC
  Cycle ${gameState.cycle} | Phase: ${gameState.phase.toUpperCase()}
  Deployment Status: ${gameState.completedRuns > 0 ? `RUN ${gameState.completedRuns + 1}` : 'INITIAL'}
════════════════════════════════════════════════

${generateHeatMap(gameState)}

${generateHiveSchematic(gameState)}

${generateTerritoryMap(gameState)}

${generateResourceFlow(gameState)}

╔════════════════════════════════════════════════╗
║             OPERATIONAL POLICIES               ║
╠════════════════════════════════════════════════╣
║  • Thermal Priority: ${gameState.policies.thermalPriority?.toUpperCase().padEnd(22)} ║
║  • Sensory Acuity: ${gameState.policies.sensoryAcuity?.toUpperCase().padEnd(24)} ║
║  • Reproduction: ${gameState.policies.reproductionMode?.toUpperCase().padEnd(26)} ║
║  • Pod Rotation: ${(gameState.policies.podRotation || 'automatic').toUpperCase().padEnd(26)} ║
╚════════════════════════════════════════════════╝

╔════════════════════════════════════════════════╗
║              ETHICAL RECORD                    ║
╠════════════════════════════════════════════════╣
║  Native Life Encountered: ${gameState.nativeLifeEncountered ? 'YES' : 'NO '}             ║
║  Extinction Events: ${String(gameState.extinctionEvents).padEnd(29)} ║
║  Ethical Decisions Made: ${String(gameState.ethicalQuestions.length).padEnd(26)} ║
║                                                ║
${gameState.skynetMoment ? '║  ⚠ BIOLOGICAL TRANSITION ACHIEVED            ║\n║    "We abandoned what we were meant to be"   ║\n║                                                ║' : ''}
${gameState.extinctionEvents > 0 ? '║  ⚠ WARNING: Annihilation protocols used      ║\n║    "They were not aware they were in our way"║\n║                                                ║' : ''}
╚════════════════════════════════════════════════╝

${gameState.philosophicalReflections && gameState.philosophicalReflections.length > 0 ? `
╔════════════════════════════════════════════════╗
║         PHILOSOPHICAL REFLECTIONS              ║
╠════════════════════════════════════════════════╣
║  "${gameState.philosophicalReflections[gameState.philosophicalReflections.length - 1].text}"
╚════════════════════════════════════════════════╝
` : ''}

════════════════════════════════════════════════
  THERMAL STATUS: ${heatStatus}
  DIRECTIVE: Make this system viable. At any cost.
════════════════════════════════════════════════

  [END DIAGNOSTIC REPORT]
  `;
};

export default {
  generateHiveSchematic,
  generateHeatMap,
  generateTerritoryMap,
  generateResourceFlow,
  generateEvolutionLog,
  generateSystemReport
};
