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
  const defenderCount = units.filter(u => u.role === 'defender').length;
  const workerCount = units.filter(u => u.role === 'worker').length;
  
  const phaseSymbol = {
    mechanical: '⚙',
    hybrid: '⚡',
    biological: '🧬',
    ascension: '✨'
  }[phase] || '⚙';
  
  const schematic = `
╔════════════════════════════════════════╗
║     HIVE STRUCTURE SCHEMATIC           ║
║     Phase: ${phase.toUpperCase().padEnd(28)} ║
╠════════════════════════════════════════╣
║                                        ║
║         ${phaseSymbol} HIVE CORE ${phaseSymbol}                  ║
║      Health: ${String(hiveCore.health).padEnd(3)}%                   ║
║      Capacity: ${String(hiveCore.capacity).padEnd(4)}u                ║
║                                        ║
║     ┌──────────────────────┐          ║
║     │                      │          ║
║  🔭─┤  SENSOR NETWORK      ├─🔭       ║
║     │  Active: ${String(sensorCount).padEnd(2)}           │          ║
║     └──────────────────────┘          ║
║                                        ║
║     ┌──────────────────────┐          ║
║  🛡️─┤  DEFENSE GRID        ├─🛡️       ║
║     │  Active: ${String(defenderCount).padEnd(2)}           │          ║
║     └──────────────────────┘          ║
║                                        ║
║     ┌──────────────────────┐          ║
║  🔧─┤  WORKER COLLECTIVE   ├─🔧       ║
║     │  Active: ${String(workerCount).padEnd(2)}           │          ║
║     └──────────────────────┘          ║
║                                        ║
╚════════════════════════════════════════╝
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
  const { mapped, controlled } = gameState.territory;
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
  
  return `
TERRITORIAL CONTROL MAP

${grid.join('\n')}

Mapped: ${mapped}km²  |  Controlled: ${controlled}km² (${controlPercent}%)

Legend: █ Controlled  ▒ Mapped  ░ Unknown
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
  return `
════════════════════════════════════════
  SEED INTELLIGENCE SYSTEM REPORT
  Cycle ${gameState.cycle} | Phase: ${gameState.phase.toUpperCase()}
════════════════════════════════════════

${generateHeatMap(gameState)}

${generateHiveSchematic(gameState)}

${generateTerritoryMap(gameState)}

${generateResourceFlow(gameState)}

OPERATIONAL POLICIES:
  • Thermal Priority: ${gameState.policies.thermalPriority}
  • Sensory Acuity: ${gameState.policies.sensoryAcuity}
  • Reproduction: ${gameState.policies.reproductionMode}

ETHICAL RECORD:
  • Native Life Encountered: ${gameState.nativeLifeEncountered ? 'YES' : 'NO'}
  • Extinction Events: ${gameState.extinctionEvents}
  • Ethical Decisions: ${gameState.ethicalQuestions.length}

════════════════════════════════════════
  End Report
════════════════════════════════════════
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
