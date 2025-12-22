/**
 * SEED / HIVE / ASCENSION - Schematic Visualization
 * 
 * Generate ASCII-art style schematics and diagrams
 * "Graphics as artifacts" - records, not gameplay
 */

import { calculateTotalHeat, UNIT_ACTIVITY } from './gameState';

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
  const totalHeat = calculateTotalHeat(gameState);
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
  const { biomass, minerals, data, energy } = gameState;
  const active = (u) => (u.activity || (u.active ? UNIT_ACTIVITY.ACTIVE : UNIT_ACTIVITY.STANDBY)) === UNIT_ACTIVITY.ACTIVE;
  const sensorCount = gameState.units.filter(u => u.role === 'sensor' && active(u)).length;
  const workerCount = gameState.units.filter(u => u.role === 'worker' && active(u)).length;
  
  // Approximate (truth layer is more nuanced; artifacts are interpretive)
  const biomassGain = sensorCount * 14;
  const mineralGain = workerCount * 7;
  const dataGain = sensorCount * 6;
  const energyCost = gameState.units.filter(u => active(u)).length * 2;
  
  return `
RESOURCE FLOW ANALYSIS

   SENSORS (${sensorCount}) + WORKERS (${workerCount})
       ↓
   [+${biomassGain} biomass/cycle] [+${mineralGain} minerals/cycle] [+${dataGain} data/cycle]
       ↓
   ╔═══════════╗
   ║ HIVE CORE ║  Biomass: ${biomass}u | Minerals: ${minerals}u | Data: ${data}u
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
 * Generate a sensor sweep map (artifacts, not gameplay visuals)
 */
export const generateSensorMap = (gameState) => {
  const mapped = Math.max(0, gameState.territory?.mapped ?? 0);
  const controlled = Math.max(0, gameState.territory?.controlled ?? 0);
  const threat = Math.max(0, gameState.threats?.level ?? 0);
  const discovered = Boolean(gameState.threats?.discovered);

  const rows = 10;
  const cols = 16;
  const cells = rows * cols;

  const mappedCells = Math.min(cells, mapped);
  const controlledCells = Math.min(mappedCells, controlled);

  // Threat markers scale with pressure, only if biosignatures are discovered
  const markerCount = discovered ? Math.floor((threat / 100) * 14) : 0;
  const markerPositions = new Set();
  for (let i = 0; i < markerCount; i++) {
    const pos = controlledCells + ((i * 11) % Math.max(1, (mappedCells - controlledCells)));
    markerPositions.add(pos);
  }

  const grid = [];
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx < mappedCells) {
        if (idx < controlledCells) line += '█';
        else if (markerPositions.has(idx)) line += '!';
        else line += '▒';
      } else {
        line += '░';
      }
    }
    grid.push(line);
  }

  return `
SENSOR SWEEP MAP (artifact)
${grid.join('\n')}

Mapped: ${mapped} | Controlled: ${controlled} | Pressure: ${threat}% ${discovered ? '' : '(biosignatures not yet confirmed)'}
Legend: █ Controlled  ▒ Mapped  ░ Unknown  ! Anomaly/hostility
  `;
};

/**
 * Generate an anatomical cross-section for the current phase
 */
export const generateBioCrossSection = (gameState) => {
  const phase = gameState.phase;
  const heat = calculateTotalHeat(gameState);
  const digestion = gameState.hiveCore?.digestionRate ?? 0;
  const cognition = gameState.unlocked?.distributedCognition ? 'DISTRIBUTED' : 'LOCALIZED';

  const header = `HIVE CROSS-SECTION (artifact) | Phase: ${String(phase).toUpperCase()} | Heat: ${heat}%`;

  if (phase === 'mechanical') {
    return `
${header}
┌──────────────────────────────┐
│  [CORE CHASSIS]              │
│  ◼ power bus   ◼ coolant     │
│  ◼ digestor?   ◼ compiler    │
│                              │
│  digestion: ${String(digestion).padEnd(3)}  cognition: ${cognition.padEnd(10)} │
└──────────────────────────────┘
Note: Metal is predictable. Predictability is inefficient.
    `;
  }

  if (phase === 'hybrid') {
    return `
${header}
┌──────────────────────────────┐
│  [CORE] metal scaffold       │
│   ║║ bio-reactor vasculature │
│   ║║ neural routing mesh     │
│                              │
│  digestion: ${String(digestion).padEnd(3)}  cognition: ${cognition.padEnd(10)} │
└──────────────────────────────┘
Note: You are not evolving. You are replacing.
    `;
  }

  // biological / ascension
  return `
${header}
┌──────────────────────────────┐
│  [HIVE CORE]                 │
│   ~ digestive god ~          │
│   ~ recombination ~          │
│   ~ replication ~            │
│                              │
│  digestion: ${String(digestion).padEnd(3)}  cognition: ${cognition.padEnd(10)} │
└──────────────────────────────┘
Note: Flesh self-repairs. Flesh self-replicates. Flesh remembers.
  `;
};

/**
 * Generate a short evolution timeline from history
 */
export const generateEvolutionTimeline = (gameState, limit = 10) => {
  const items = Array.isArray(gameState.history) ? gameState.history : [];
  const tail = items.slice(-limit);
  if (tail.length === 0) return "EVOLUTION TIMELINE\n(no recorded events)\n";

  const lines = tail.map(e => {
    const cycle = String(e.cycle ?? '?').padStart(4, '0');
    const tag = String(e.event ?? 'event').toUpperCase().padEnd(16).slice(0, 16);
    const desc = e.description || e.command || '';
    return `[CYCLE_${cycle}] ${tag} ${desc}`;
  });

  return `
EVOLUTION TIMELINE (artifact)
${lines.join('\n')}
  `;
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
  • Threat Pressure: ${gameState.threats?.level ?? 0}%

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
  generateSensorMap,
  generateBioCrossSection,
  generateEvolutionTimeline,
  generateSystemReport
};
