import { addUnit, processCycle, updatePolicy, UNIT_ROLES, UNIT_ACTIVITY, calculateTotalHeat } from './gameState';
import { generateBioCrossSection, generateEvolutionTimeline, generateSensorMap, generateSystemReport } from './schematics';

const normalize = (s) => (s || '').toLowerCase().trim();

const chooseUnitTypeForState = (state) => {
  if (state.phase === 'biological' || state.unlocked.biologicalUnits) return 'biological';
  if (state.phase === 'hybrid' || state.unlocked.hybridUnits) return 'hybrid';
  return 'mechanical';
};

const setAllUnitActivity = (state, activity) => ({
  ...state,
  units: state.units.map(u => u.role === UNIT_ROLES.DIGESTER ? u : ({ ...u, activity, active: undefined }))
});

/**
 * Interpret a directive into deterministic game actions.
 * Returns { handled, newState, reply, logs } where logs are additional log entries to append.
 */
export function interpretCommand(raw, gameState) {
  const text = normalize(raw);
  const logs = [];

  // help
  if (text === 'help' || text === '?' || text.includes('what can i do')) {
    return {
      handled: true,
      newState: gameState,
      reply:
        "Recognized directives:\n" +
        "- \"advance cycle\" / \"next cycle\" / \"wait\"\n" +
        "- \"status report\" / \"system report\"\n" +
        "- \"prioritize stability\" | \"prioritize performance\"\n" +
        "- \"sensory acuity low|standard|high\" | \"increase acuity\" | \"reduce acuity\"\n" +
        "- \"reproduction conservative|aggressive\"\n" +
        "- \"design sensor\" | \"design worker\" | \"design defender\"\n" +
        "- \"cooldown\" / \"hibernate\"",
      logs
    };
  }

  // system report
  if (text.includes('system report') || text === 'status report' || text === 'status') {
    logs.push({ type: 'system', text: generateSystemReport(gameState) });
    return {
      handled: true,
      newState: gameState,
      reply: "Report generated. Artifact appended to system log.",
      logs
    };
  }

  // artifacts
  if (text.includes('sensor map') || text.includes('map artifact') || text.includes('sweep map')) {
    logs.push({ type: 'system', text: generateSensorMap(gameState) });
    return { handled: true, newState: gameState, reply: "Sensor sweep map generated.", logs };
  }
  if (text.includes('cross section') || text.includes('cross-section') || text.includes('anatomy')) {
    logs.push({ type: 'system', text: generateBioCrossSection(gameState) });
    return { handled: true, newState: gameState, reply: "Cross-section artifact generated.", logs };
  }
  if (text.includes('timeline') || text.includes('evolution log') || text.includes('history')) {
    logs.push({ type: 'system', text: generateEvolutionTimeline(gameState) });
    return { handled: true, newState: gameState, reply: "Evolution timeline generated.", logs };
  }

  // cycle advancement (supports "advance 3 cycles")
  const cycleMatch = text.match(/(?:advance|next|wait)(?:\s+(\d+))?\s*(?:cycle|cycles)?/);
  if (cycleMatch) {
    const count = Math.max(1, Math.min(25, Number(cycleMatch[1] || 1)));
    let next = gameState;
    for (let i = 0; i < count; i++) next = processCycle(next);
    const heat = calculateTotalHeat(next);
    return {
      handled: true,
      newState: next,
      reply: `Cycle advanced x${count}. Thermal load now ${heat}%.`,
      logs
    };
  }

  // thermal priority
  if (text.includes('prioritize stability') || text.includes('thermal stability')) {
    const next = updatePolicy(gameState, 'thermalPriority', 'stability');
    return { handled: true, newState: next, reply: "Policy set: Thermal Priority = stability.", logs };
  }
  if (text.includes('prioritize performance') || text.includes('max performance') || text.includes('thermal performance')) {
    const next = updatePolicy(gameState, 'thermalPriority', 'performance');
    return { handled: true, newState: next, reply: "Policy set: Thermal Priority = performance.", logs };
  }

  // sensory acuity
  if (text.includes('sensory acuity')) {
    const mode =
      text.includes('high') ? 'high' :
      text.includes('low') ? 'low' :
      text.includes('standard') ? 'standard' :
      null;
    if (mode) {
      const next = updatePolicy(gameState, 'sensoryAcuity', mode);
      return { handled: true, newState: next, reply: `Policy set: Sensory Acuity = ${mode}.`, logs };
    }
  }
  if (text.includes('increase acuity') || text.includes('boost sensors')) {
    const next = updatePolicy(gameState, 'sensoryAcuity', 'high');
    return { handled: true, newState: next, reply: "Policy set: Sensory Acuity = high.", logs };
  }
  if (text.includes('reduce acuity') || text.includes('lower acuity')) {
    const next = updatePolicy(gameState, 'sensoryAcuity', 'low');
    return { handled: true, newState: next, reply: "Policy set: Sensory Acuity = low.", logs };
  }

  // reproduction mode
  if (text.includes('reproduction')) {
    const mode =
      text.includes('aggressive') ? 'aggressive' :
      text.includes('conservative') ? 'conservative' :
      null;
    if (mode) {
      const next = updatePolicy(gameState, 'reproductionMode', mode);
      return { handled: true, newState: next, reply: `Policy set: Reproduction Mode = ${mode}.`, logs };
    }
  }

  // design roles (you design roles, not individuals)
  const designRole =
    text.includes('design sensor') || text.includes('spawn sensor') || text.includes('build sensor') ? UNIT_ROLES.SENSOR :
    text.includes('design worker') || text.includes('spawn worker') || text.includes('build worker') ? UNIT_ROLES.WORKER :
    text.includes('design defender') || text.includes('spawn defender') || text.includes('build defender') ? UNIT_ROLES.DEFENDER :
    null;

  if (designRole) {
    const type = chooseUnitTypeForState(gameState);
    const next = addUnit(gameState, designRole, type);
    const changed = next.units.length !== gameState.units.length;
    return {
      handled: true,
      newState: next,
      reply: changed
        ? `Role instantiated: ${type.toUpperCase()} ${designRole.toUpperCase()} pod.`
        : `Insufficient resources to instantiate ${type} ${designRole}. (Need biomass + minerals.)`,
      logs
    };
  }

  // cooldown / hibernate
  if (text.includes('cooldown') || text.includes('hibernate') || text.includes('power down')) {
    const activity = text.includes('hibernate') ? UNIT_ACTIVITY.HIBERNATING : UNIT_ACTIVITY.STANDBY;
    let next = setAllUnitActivity(gameState, activity);
    // Quick thermal relief (base heat buffer only; total heat also drops via activity multipliers next cycle)
    next = { ...next, heat: Math.max(0, next.heat - (activity === UNIT_ACTIVITY.HIBERNATING ? 12 : 6)) };
    return {
      handled: true,
      newState: next,
      reply: activity === UNIT_ACTIVITY.HIBERNATING
        ? "Directive accepted: pods entering hibernation. Sensory continuity reduced."
        : "Directive accepted: pods entering standby. Thermal load will decline.",
      logs
    };
  }

  // unhandled -> let AI narrate / user freeform
  return { handled: false, newState: gameState, reply: "", logs };
}

