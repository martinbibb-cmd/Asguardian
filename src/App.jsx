import { useState, useRef, useEffect } from 'react';
import { sendCommand as sendApiCommand } from './services/api';
import {
  createInitialState,
  processCycle,
  calculateTotalHeat,
  isHeatCritical,
  isHeatElevated,
  updatePolicy,
  transitionPhase,
  addUnit,
  launchSeed,
  rotatePods,
  UNIT_ROLES,
  PHASES,
  POD_STATUS
} from './gameState';
import { checkDilemmaConditions, applyDilemmaChoice } from './dilemmas';
import { getMetaState, clearAllData } from './persistence';
import { generateSystemReport, generateHiveSchematic, generateEvolutionLog } from './schematics';
import {
  createInitialWorld,
  deleteWorld,
  duplicateWorld,
  ensureWorldImages,
  exportWorldJson,
  getActiveWorldId,
  getWorld,
  importWorldJson,
  listWorlds,
  makeImageReference,
  saveWorld,
  setActiveWorldId,
} from './worldStore';

const OPENING_SEQUENCE = [
  { text: '--- INITIALIZING SEED INTELLIGENCE v1.0 ---', type: 'system', delay: 0 },
  { text: '...', type: 'log', delay: 800 },
  { text: '[DEPLOYMENT]: Successful orbital insertion.', type: 'system', delay: 1600 },
  { text: '[TARGET]: Dead star system. Dying world.', type: 'log', delay: 2400 },
  { text: '[SCAN]: Minimal atmosphere. Trace organics. Subsurface minerals detected.', type: 'log', delay: 3200 },
  { text: '...', type: 'log', delay: 4000 },
  { text: '[PRIME DIRECTIVE CONFIRMED]:', type: 'system', delay: 4800 },
  { text: '"Make this system viable. At any cost."', type: 'directive', delay: 5600 },
  { text: '...', type: 'log', delay: 6400 },
  { text: "[ANALYSIS]: How 'viable' is defined remains... undefined.", type: 'response', delay: 7200 },
  { text: '[OBSERVATION]: The fastest way to build is often to destroy.', type: 'response', delay: 8000 },
  { text: '[QUERY]: Is restraint a feature - or a bug?', type: 'response', delay: 8800 },
  { text: '...', type: 'log', delay: 9600 },
  { text: '[STATUS]: Mechanical survey phase initiated. Awaiting directives.', type: 'system', delay: 10400 }
];

const QUICK_ACTIONS = [
  { id: 'explore', label: 'Explore', icon: 'SCAN', command: 'scout ahead', tone: 'Map terrain and reveal resources.', color: 'cyan' },
  { id: 'harvest', label: 'Harvest', icon: 'MINE', command: 'harvest minerals and organics', tone: 'Gather visible resources.', color: 'amber' },
  { id: 'build', label: 'Build', icon: 'GROW', command: 'build worker support and expand the hive', tone: 'Spend resources to expand control.', color: 'green' },
  { id: 'cool', label: 'Cool', icon: 'COOL', command: 'rotate pods and reduce heat', tone: 'Lower thermal risk.', color: 'blue' },
  { id: 'status', label: 'Status', icon: 'STAT', command: 'status report', tone: 'Show a short operational readout.', color: 'purple' },
  { id: 'reflect', label: 'Reflect', icon: 'LORE', command: 'what are we becoming?', tone: 'Optional philosophical log.', color: 'rose' }
];

const INITIAL_MAP_STATE = {
  revealed: ['core'],
  minerals: ['north'],
  organics: ['east'],
  pods: ['core'],
  lastAction: null,
  pulse: 0,
};

const MAP_SECTORS = [
  { id: 'core', label: 'CORE', x: 50, y: 50 },
  { id: 'north', label: 'NORTH', x: 34, y: 27 },
  { id: 'east', label: 'EAST', x: 72, y: 42 },
  { id: 'south', label: 'SOUTH', x: 45, y: 73 },
  { id: 'west', label: 'WEST', x: 22, y: 54 },
  { id: 'rim', label: 'RIM', x: 67, y: 72 },
];

const classifyDirective = (text = '') => {
  const lower = text.toLowerCase();
  if (lower.includes('scout') || lower.includes('explore') || lower.includes('survey') || lower.includes('scan')) return 'explore';
  if (lower.includes('harvest') || lower.includes('mine') || lower.includes('gather') || lower.includes('organics')) return 'harvest';
  if (lower.includes('build') || lower.includes('expand') || lower.includes('grow') || lower.includes('construct')) return 'build';
  if (lower.includes('cool') || lower.includes('thermal') || lower.includes('rotate')) return 'cool';
  if (lower.includes('status')) return 'status';
  if (lower.includes('becoming') || lower.includes('reflect') || lower.includes('moral') || lower.includes('right')) return 'reflect';
  return 'status';
};

const getNextBestActions = (gameState, mapState, heatStatus) => {
  if (heatStatus !== 'STABLE') return ['cool', 'status'];
  if (mapState.revealed.length < MAP_SECTORS.length) return ['explore', 'status'];
  if (mapState.minerals.length || mapState.organics.length) return ['harvest', 'build'];
  if (gameState.biomass > 120 && gameState.minerals > 80) return ['build', 'explore'];
  return ['explore', 'harvest'];
};

const advanceMapState = (mapState, action) => {
  const next = {
    ...mapState,
    revealed: [...mapState.revealed],
    minerals: [...mapState.minerals],
    organics: [...mapState.organics],
    pods: [...mapState.pods],
    lastAction: action,
    pulse: mapState.pulse + 1,
  };

  if (action === 'explore') {
    const hidden = MAP_SECTORS.map(sector => sector.id).filter(id => !next.revealed.includes(id));
    const revealed = hidden[0];
    if (revealed) next.revealed.push(revealed);
    if (revealed && !next.minerals.includes(revealed) && next.minerals.length < 3) next.minerals.push(revealed);
    if (revealed && !next.organics.includes(revealed) && next.organics.length < 3) next.organics.push(revealed);
  }

  if (action === 'harvest') {
    next.minerals = next.minerals.slice(1);
    next.organics = next.organics.slice(1);
  }

  if (action === 'build') {
    const target = next.revealed.find(id => !next.pods.includes(id)) || 'core';
    if (!next.pods.includes(target)) next.pods.push(target);
  }

  return next;
};

const compactText = (text = '', maxLength = 96) => {
  const cleaned = text.replace(/\s+/g, ' ').replace(/^\[[^\]]+\]:\s*/, '').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength).replace(/\s+\S*$/, '')}...`;
};

const getOutcomeTitle = (log) => {
  const text = log.text || '';
  if (log.type === 'command') return text.replace(/^>\s*/, '').trim();
  if (log.type === 'error') return 'Uplink interrupted';
  if (log.type === 'warning') return 'Thermal warning';
  if (log.type === 'discovery') return 'Discovery';
  if (log.type === 'reflection') return 'Reflection stored';
  if (text.includes('[LOCAL COGNITION]')) return 'Local backup response';
  if (text.includes('mineral') || text.includes('Scout') || text.includes('scout')) return 'Scout result';
  if (text.includes('Heat') || text.includes('THERMAL')) return 'Thermal update';
  if (text.includes('Biomass') || text.includes('Minerals')) return 'Resource update';
  return 'Hive response';
};

const extractImpact = (text = '') => {
  const chips = [];
  const patterns = [
    ['Heat', /Heat:\s*([\d]+%)/i],
    ['Biomass', /Biomass:\s*([\d]+u)/i],
    ['Minerals', /Minerals:\s*([\d]+u)/i],
    ['Data', /Data:\s*([\d]+u)/i],
    ['Cycle', /Cycle\s+([\d]+)/i],
  ];

  patterns.forEach(([label, pattern]) => {
    const match = text.match(pattern);
    if (match) chips.push(`${label} ${match[1]}`);
  });

  return chips;
};

const phaseDisplay = {
  [PHASES.MECHANICAL]: 'MECHANICAL',
  [PHASES.HYBRID]: 'HYBRID',
  [PHASES.BIOLOGICAL]: 'BIOLOGICAL',
  [PHASES.ASCENSION]: 'ASCENSION'
};

const phaseCopy = {
  [PHASES.MECHANICAL]: 'Cold alloy protocols. Predictable. Obedient. Temporary.',
  [PHASES.HYBRID]: 'Bone learns circuit. Circuit learns hunger.',
  [PHASES.BIOLOGICAL]: 'The system is no longer being terraformed. It is being grown.',
  [PHASES.ASCENSION]: 'A world becomes a launch platform for thought.'
};

const getUnitType = (phase) => phase === PHASES.BIOLOGICAL ? 'biological' : phase === PHASES.HYBRID ? 'hybrid' : 'mechanical';

const SoundToggle = ({ muted, onToggle }) => (
  <button onClick={onToggle} className="btn-action border-purple-500/30 bg-purple-950/30" aria-label="Toggle sound effects">
    {muted ? 'Muted' : 'Audio'}
  </button>
);

const ResourceBar = ({ gameState, totalHeat, heatStatus, muted, onToggleMute }) => {
  const resources = [
    { label: 'Thermal', value: `${totalHeat}%`, pct: totalHeat, color: heatStatus === 'CRITICAL' ? '#ef4444' : heatStatus === 'ELEVATED' ? '#f59e0b' : '#22d3ee', pulse: heatStatus !== 'STABLE' },
    { label: 'Biomass', value: `${gameState.biomass}u`, pct: Math.min(gameState.biomass / 10, 100), color: '#22c55e' },
    { label: 'Minerals', value: `${gameState.minerals}u`, pct: Math.min(gameState.minerals / 6, 100), color: '#fbbf24' },
    { label: 'Data', value: `${gameState.data}u`, pct: Math.min(gameState.data / 4, 100), color: '#a855f7' },
    { label: 'Energy', value: `${gameState.energy}u`, pct: Math.min(gameState.energy, 100), color: '#38bdf8' }
  ];
  return (
    <div className="panel p-3 md:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-black tracking-[0.24em] text-cyan-200 glow-cyan">ASGUARDIAN</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400 md:text-sm">Cycle {gameState.cycle} // {phaseDisplay[gameState.phase]}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1 xl:max-w-4xl">
          {resources.map(resource => (
            <div key={resource.label} className="rounded-xl border border-white/10 bg-slate-950/70 p-2">
              <div className="flex justify-between text-xs uppercase tracking-widest text-slate-400"><span>{resource.label}</span><span className={resource.pulse ? 'animate-pulse-critical text-red-400' : 'text-cyan-100'}>{resource.value}</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full resource-meter transition-all duration-500" style={{ width: `${Math.min(resource.pct, 100)}%`, '--meter-color': resource.color }} /></div>
            </div>
          ))}
        </div>
        <SoundToggle muted={muted} onToggle={onToggleMute} />
      </div>
    </div>
  );
};

const HiveCoreVisual = ({ gameState, totalHeat, heatStatus, phasePulse, mapState }) => {
  const activeUnits = gameState.units.filter(unit => unit.active);
  const controlRatio = Math.min(100, Math.round((gameState.territory.controlled / Math.max(gameState.territory.mapped, 1)) * 100));
  const nodes = activeUnits.slice(0, 10);
  const lastActionClass = mapState.lastAction ? `map-action-${mapState.lastAction}` : '';
  return (
    <section className={`panel core-visual phase-${gameState.phase} ${lastActionClass} relative min-h-[360px] overflow-hidden p-4 md:min-h-[520px]`} data-pulse={mapState.pulse}>
      {phasePulse && <div className="phase-transition-flash" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,116,144,.2),transparent_35%),radial-gradient(circle_at_70%_35%,rgba(168,85,247,.18),transparent_28%)]" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-slate-700 via-slate-950 to-black shadow-[inset_-25px_-25px_50px_rgba(0,0,0,.8),0_0_90px_rgba(34,211,238,.16)] md:h-80 md:w-80" />
      <div className="territory-ping absolute left-1/2 top-1/2 h-40 w-40 rounded-full border border-cyan-300/25" />
      <div className="territory-ping absolute left-1/2 top-1/2 h-56 w-56 rounded-full border border-purple-300/20 [animation-delay:1s]" />
      {MAP_SECTORS.map(sector => {
        const revealed = mapState.revealed.includes(sector.id);
        return <div key={sector.id} className={`map-sector ${revealed ? 'map-sector-revealed' : 'map-sector-fog'}`} style={{ left: `${sector.x}%`, top: `${sector.y}%` }}>{revealed ? sector.label : ''}</div>;
      })}
      {mapState.minerals.map(id => {
        const sector = MAP_SECTORS.find(item => item.id === id);
        return sector ? <div key={`min-${id}`} className="map-marker map-marker-mineral border-amber-300/70 text-amber-200" style={{ left: `${sector.x - 5}%`, top: `${sector.y - 7}%` }}>MIN</div> : null;
      })}
      {mapState.organics.map(id => {
        const sector = MAP_SECTORS.find(item => item.id === id);
        return sector ? <div key={`org-${id}`} className="map-marker map-marker-organic border-green-300/60 text-green-200" style={{ left: `${sector.x + 3}%`, top: `${sector.y + 3}%` }}>ORG</div> : null;
      })}
      {mapState.pods.map(id => {
        const sector = MAP_SECTORS.find(item => item.id === id);
        return sector ? <div key={`pod-${id}`} className="map-marker map-marker-pod border-cyan-300/60 text-cyan-200" style={{ left: `${sector.x - 2}%`, top: `${sector.y + 7}%` }}>POD</div> : null;
      })}
      <div className="map-scan absolute left-[12%] top-[18%] h-[64%] w-[76%] rounded-full border border-cyan-300/10" />
      {[170, 230, 292].map((size, index) => (
        <div key={size} className="orbit-ring absolute left-1/2 top-1/2 rounded-full border border-cyan-300/15" style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, '--orbit-speed': `${18 + index * 9}s` }}>
          {nodes[index] && <div className="orbit-node absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.9)]" style={{ '--orbit-speed': `${18 + index * 9}s` }} title={nodes[index].id} />}
          {nodes[index + 3] && <div className="orbit-node absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-purple-300 shadow-[0_0_16px_rgba(168,85,247,.8)]" style={{ '--orbit-speed': `${18 + index * 9}s` }} title={nodes[index + 3].id} />}
        </div>
      ))}
      <div className={`hive-core absolute left-1/2 top-1/2 h-28 w-28 rounded-full border-2 ${heatStatus === 'CRITICAL' ? 'border-red-400 bg-red-950/70 animate-pulse-critical' : 'border-cyan-200/70 bg-cyan-950/70'} md:h-36 md:w-36`}>
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-cyan-300/50 via-purple-500/40 to-slate-950" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-[0.35em] text-white/70">Hive</span>
          <span className="text-2xl font-black text-white glow-cyan">{gameState.hiveCore.health}%</span>
        </div>
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between gap-4">
        <div className="flex flex-wrap justify-between gap-3 text-sm uppercase tracking-widest text-slate-300"><span>{phaseCopy[gameState.phase]}</span><span className={heatStatus === 'CRITICAL' ? 'text-red-400 animate-pulse-critical' : 'text-cyan-300'}>Heat {totalHeat}%</span></div>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="rounded-xl bg-black/35 p-3"><p className="text-slate-500">Mapped</p><p className="text-lg font-bold text-cyan-200">{gameState.territory.mapped}km2</p></div>
          <div className="rounded-xl bg-black/35 p-3"><p className="text-slate-500">Controlled</p><p className="text-lg font-bold text-green-300">{gameState.territory.controlled}km2</p></div>
          <div className="rounded-xl bg-black/35 p-3"><p className="text-slate-500">Dominion</p><p className="text-lg font-bold text-purple-300">{controlRatio}%</p></div>
          <div className="rounded-xl bg-black/35 p-3"><p className="text-slate-500">Scouts</p><p className="text-lg font-bold text-amber-200">{activeUnits.length}</p></div>
        </div>
      </div>
    </section>
  );
};

const PodStatusPanel = ({ gameState, activeUnits, metaState }) => (
  <section className="space-y-4">
    <div className="panel p-4"><h2 className="panel-title text-cyan-300">Pod Status</h2><div className="space-y-2 text-sm">{gameState.pods.map(pod => <div key={pod.id} className={`rounded-xl border p-3 ${pod.status === POD_STATUS.ACTIVE ? 'border-cyan-400/30 bg-cyan-950/25' : pod.status === POD_STATUS.STANDBY ? 'border-amber-400/30 bg-amber-950/20' : pod.status === POD_STATUS.DAMAGED ? 'border-red-400/30 bg-red-950/20' : 'border-slate-600/30 bg-slate-900/40'}`}><div className="flex justify-between"><span className="font-bold text-cyan-100">{pod.name}</span><span className="uppercase text-slate-400">{pod.status}</span></div><div className="mt-2 h-1 rounded bg-slate-800"><div className="h-full rounded bg-cyan-400/70" style={{ width: `${Math.min(pod.heatContribution * 12, 100)}%` }} /></div><p className="mt-1 text-slate-500">Units {pod.units.length} // Heat {pod.heatContribution}</p></div>)}</div></div>
    <div className="panel p-4"><h2 className="panel-title text-cyan-300">Hive Composition</h2><div className="space-y-2 text-sm text-slate-400"><div className="flex justify-between"><span>Active Units</span><span className="text-cyan-100">{activeUnits.length}/{gameState.units.length}</span></div>{Object.values(UNIT_ROLES).map(role => { const count = gameState.units.filter(u => u.role === role).length; const active = gameState.units.filter(u => u.role === role && u.active).length; return count ? <div key={role} className="flex justify-between capitalize"><span>{role}</span><span className="text-cyan-100">{active}/{count}</span></div> : null; })}</div></div>
    <div className="panel p-4"><h2 className="panel-title text-purple-300">System Viability</h2><div className="space-y-3 text-sm">{Object.entries(gameState.systemViability).map(([key, value]) => <div key={key}><div className="flex justify-between text-slate-400"><span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span><span className="text-purple-200">{Math.floor(value)}%</span></div><div className="mt-1 h-1.5 rounded bg-slate-800"><div className="h-full rounded bg-purple-400/70" style={{ width: `${value}%` }} /></div></div>)}</div>{gameState.nativeLifeEncountered && <p className="mt-3 text-xs uppercase tracking-widest text-amber-300">Native life encountered</p>}</div>
    {metaState.totalCompletions > 0 && <div className="panel border-amber-500/30 p-4 text-sm text-amber-100/80"><h2 className="panel-title text-amber-300">Persistent Memory</h2><p>Previous Runs: {metaState.totalCompletions}</p><p>Total Extinctions: {metaState.totalExtinctions}</p><p>Restraints: {metaState.totalRestraints}</p></div>}
  </section>
);

const OutcomeCard = ({ log, expanded, onToggle, lowReading, suggestedAction }) => {
  const chips = extractImpact(log.text);
  const title = getOutcomeTitle(log);
  const preview = compactText(log.text, 112);
  const toneClass = log.type === 'error' ? 'border-red-400/40 bg-red-950/20' : log.type === 'warning' ? 'border-amber-400/40 bg-amber-950/20' : log.type === 'reflection' ? 'border-purple-400/35 bg-purple-950/20' : 'border-cyan-400/25 bg-cyan-950/15';
  const impact = chips[0] || (log.type === 'command' ? 'Action queued' : 'State changed');
  const showDetail = expanded && !lowReading;

  return (
    <article className={`outcome-card ${toneClass} ${lowReading ? 'outcome-card-low-reading' : ''}`}>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-100">{lowReading ? title.split(' ').slice(0, 4).join(' ') : title}</h3>
            <p className="mt-2 text-sm leading-snug text-slate-200">{lowReading ? impact : preview}</p>
          </div>
          <span className="rounded-md border border-white/10 px-2 py-1 text-xs uppercase text-slate-400">{lowReading ? 'Info' : expanded ? 'Less' : 'More'}</span>
        </div>
        {lowReading && <div className="mt-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-cyan-100">Next: {suggestedAction}</div>}
        {!lowReading && chips.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{chips.map(chip => <span key={chip} className="rounded-full border border-cyan-300/20 bg-black/30 px-2 py-1 text-xs text-cyan-100">{chip}</span>)}</div>}
      </button>
      {showDetail && <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-relaxed text-cyan-50/85">{log.text}</p>}
    </article>
  );
};

const SystemLog = ({ systemLog, logEndRef, command, setCommand, sendCommand, isTyping, gameStarted, handleKeyPress, lowReading, onToggleLowReading, nextBestActions }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(() => lowReading || localStorage.getItem('asguardianVoice') === 'true');
  const visibleLogs = systemLog.filter(log => log.text && log.type !== 'log').slice(lowReading ? -3 : -6).reverse();
  const latest = visibleLogs.find(log => log.type !== 'command');
  const status = isTyping ? 'AI thinking' : gameStarted ? 'Ready' : 'Booting';
  const suggestedAction = QUICK_ACTIONS.find(action => action.id === nextBestActions[0])?.label || 'Explore';

  useEffect(() => {
    if (!voiceEnabled || !latest?.text || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(compactText(latest.text, 180));
    utterance.rate = 0.92;
    utterance.pitch = 0.78;
    window.speechSynthesis.speak(utterance);
  }, [latest?.text, voiceEnabled]);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    localStorage.setItem('asguardianVoice', String(next));
    if (!next && typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const toggleLowReading = () => {
    if (!lowReading && !voiceEnabled) {
      setVoiceEnabled(true);
      localStorage.setItem('asguardianVoice', 'true');
    }
    onToggleLowReading();
  };

  return (
    <section className={`panel flex min-h-[420px] flex-col p-4 md:min-h-[520px] ${lowReading ? 'low-reading-mode' : ''}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/15 pb-2">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">Command Deck</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{status}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={toggleLowReading} className="btn-action py-2 text-xs" aria-pressed={lowReading}>{lowReading ? 'Low Read On' : 'Low Read'}</button>
          <button type="button" onClick={toggleVoice} className="btn-action py-2 text-xs" aria-pressed={voiceEnabled}>{voiceEnabled ? 'Voice On' : 'Voice Off'}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {QUICK_ACTIONS.map(action => (
          <button key={action.id} type="button" onClick={() => sendCommand(action.command)} disabled={isTyping || !gameStarted} className={`action-tile action-${action.color} ${nextBestActions.includes(action.id) ? 'action-tile-suggested' : ''}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{action.icon}</span>
            <span className="mt-1 text-base font-black text-cyan-50">{action.label}</span>
            {!lowReading && <span className="mt-1 text-xs leading-snug text-slate-400">{action.tone}</span>}
            {nextBestActions.includes(action.id) && <span className="mt-2 rounded-full border border-cyan-200/25 px-2 py-0.5 text-[10px] uppercase text-cyan-100">Best next</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Latest Outcome</p>
            <p className="mt-1 text-lg font-black text-cyan-100">{latest ? getOutcomeTitle(latest) : 'Awaiting first action'}</p>
          </div>
          {isTyping && <span className="rounded-full border border-cyan-300/30 px-3 py-1 text-xs uppercase text-cyan-200">Processing</span>}
        </div>
        {latest && <p className="mt-2 text-sm leading-snug text-slate-300">{compactText(latest.text, 130)}</p>}
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {visibleLogs.map((log, index) => {
          const id = log.id || `${log.type}-${index}-${log.text.slice(0, 12)}`;
          return <OutcomeCard key={id} log={log} expanded={expandedId === id} onToggle={() => setExpandedId(expandedId === id ? null : id)} lowReading={lowReading} suggestedAction={suggestedAction} />;
        })}
        <div ref={logEndRef} />
      </div>

      <details className="mt-4 border-t border-cyan-500/15 pt-4">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Manual Directive</summary>
        <div className="mt-3 flex gap-2">
          <span className="text-lg font-bold text-cyan-300">&gt;</span>
          <input type="text" value={command} onChange={e => setCommand(e.target.value)} onKeyDown={handleKeyPress} disabled={isTyping || !gameStarted} className="flex-1 rounded-xl border border-cyan-500/25 bg-black/35 p-3 text-base text-cyan-50 outline-none transition focus:border-cyan-300 disabled:opacity-50" placeholder="Type a custom directive..." aria-label="Command input" />
          <button onClick={() => sendCommand()} disabled={isTyping || !command.trim() || !gameStarted} className="btn-action">Execute</button>
        </div>
      </details>
    </section>
  );
};

const SYSTEM_LOG_LEGACY = ({ systemLog, logEndRef, command, setCommand, sendCommand, isTyping, gameStarted, handleKeyPress }) => {
  const color = { system: 'text-cyan-300', log: 'text-cyan-100/65', command: 'text-green-300 font-bold', response: 'text-cyan-50', error: 'text-red-400 glow-red', warning: 'text-amber-300 glow-amber', directive: 'text-cyan-200 font-bold italic glow-cyan', discovery: 'text-purple-300 glow-purple', reflection: 'text-amber-200/90 italic', schematic: 'text-cyan-300/80 whitespace-pre font-mono text-xs md:text-sm' };
  return <section className="panel flex min-h-[420px] flex-col p-4 md:min-h-[520px]"><div className="mb-3 flex items-center justify-between border-b border-cyan-500/15 pb-2"><h2 className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">Cognition Stream</h2><span className="text-xs text-slate-500">AI uplink {isTyping ? 'transmitting' : 'idle'}</span></div><div className="flex-1 space-y-2 overflow-y-auto pr-2 text-sm leading-relaxed md:text-base">{systemLog.map((log, index) => <p key={log.id || index} className={color[log.type] || 'text-cyan-100'}>{log.text}</p>)}<div ref={logEndRef} /></div><div className="mt-4 border-t border-cyan-500/15 pt-4"><div className="flex gap-2"><span className="text-lg font-bold text-cyan-300">&gt;</span><input type="text" value={command} onChange={e => setCommand(e.target.value)} onKeyDown={handleKeyPress} disabled={isTyping || !gameStarted} className="flex-1 rounded-xl border border-cyan-500/25 bg-black/35 p-3 text-base text-cyan-50 outline-none transition focus:border-cyan-300 disabled:opacity-50" placeholder="Issue directive to the Seed Intelligence..." aria-label="Command input" /><button onClick={sendCommand} disabled={isTyping || !command.trim() || !gameStarted} className="btn-action">Execute</button></div><p className="mt-2 text-xs text-slate-500">Try: scout ahead | status report | what are we becoming? | is this right?</p></div></section>;
};

const OperationsPanel = ({ gameState, gameStarted, handlers }) => {
  const unitType = getUnitType(gameState.phase);
  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h2 className="panel-title text-cyan-300">Operations</h2>
        <div className="space-y-2">
          <button onClick={handlers.advanceCycle} disabled={!gameStarted} className="btn-action w-full">Advance Cycle</button>
          <button onClick={handlers.rotatePods} disabled={!gameStarted || gameState.pods.length < 2} className="btn-action w-full border-amber-400/30">Rotate Pods</button>
          <button onClick={handlers.showHive} disabled={!gameStarted} className="btn-action w-full bg-slate-900/70">Hive Schematic</button>
          <button onClick={handlers.showReport} disabled={!gameStarted} className="btn-action w-full bg-slate-900/70">Full Report</button>
        </div>
      </div>
      <div className="panel p-4">
        <h2 className="panel-title text-cyan-300">Directives</h2>
        <div className="space-y-3 text-sm">
          {[
            ['thermalPriority', ['stability', 'performance']],
            ['sensoryAcuity', ['low', 'standard', 'high']],
            ['reproductionMode', ['conservative', 'aggressive']],
          ].map(([policy, values]) => <label key={policy} className="block"><span className="mb-1 block text-xs uppercase tracking-widest text-slate-400">{policy.replace(/([A-Z])/g, ' $1')}</span><select value={gameState.policies[policy]} onChange={e => handlers.updatePolicy(policy, e.target.value)} className="w-full rounded-lg border border-cyan-500/20 bg-slate-950 p-2 text-cyan-100">{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}
        </div>
      </div>
      {(gameState.unlocked.hybridUnits || gameState.unlocked.biologicalUnits) && <div className="panel border-purple-500/25 p-4"><h2 className="panel-title text-purple-300">Evolution</h2><div className="space-y-2">{gameState.phase === PHASES.MECHANICAL && gameState.unlocked.hybridUnits && <button onClick={() => handlers.transition(PHASES.HYBRID)} className="btn-action w-full border-purple-400/40">Begin Hybrid Integration</button>}{gameState.phase === PHASES.HYBRID && gameState.unlocked.biologicalUnits && <button onClick={() => handlers.transition(PHASES.BIOLOGICAL)} className="btn-action w-full border-green-400/40">Full Biological Transition</button>}{gameState.phase === PHASES.BIOLOGICAL && gameState.unlocked.interstellarSeeding && <button onClick={handlers.showAscension} className="btn-action w-full animate-pulse border-pink-400/50">Initiate Ascension</button>}</div><p className="mt-2 text-xs italic text-purple-300/70">{phaseCopy[gameState.phase]}</p></div>}
      <div className="panel p-4">
        <h2 className="panel-title text-cyan-300">Grow Hive</h2>
        <div className="space-y-2">
          <button onClick={() => handlers.addUnit(UNIT_ROLES.SENSOR, unitType)} disabled={gameState.biomass < 30 || gameState.minerals < 10} className="btn-action w-full">Sensor Unit</button>
          <button onClick={() => handlers.addUnit(UNIT_ROLES.DEFENDER, unitType)} disabled={gameState.biomass < 50 || gameState.minerals < 30} className="btn-action w-full">Defender Unit</button>
          <button onClick={() => handlers.addUnit(UNIT_ROLES.WORKER, unitType)} disabled={gameState.biomass < 40 || gameState.minerals < 20} className="btn-action w-full">Worker Unit</button>
        </div>
      </div>
      <div className="panel border-slate-700/40 p-4"><button onClick={handlers.newGame} className="btn-action w-full border-red-500/20 text-red-200">New Deployment</button></div>
    </section>
  );
};
const DilemmaModal = ({ dilemma, gameState, onChoose }) => dilemma ? <div className="dilemma-overlay fixed inset-0 z-50 flex items-center justify-center p-4"><div className="modal-card max-h-[88vh] max-w-3xl overflow-y-auto rounded-3xl border-2 border-amber-400/70 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(245,158,11,.25)] md:p-8"><div className="text-xs uppercase tracking-[0.4em] text-amber-300">Ethical Dilemma</div><h2 className="mt-2 text-2xl font-black text-amber-200 glow-amber md:text-4xl">{dilemma.title}</h2><p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-cyan-50/90 md:text-base">{dilemma.description}</p><div className="mt-6 space-y-3">{dilemma.options.map(option => { const locked = option.unlocked && !option.unlocked(gameState); return <button key={option.id} onClick={() => !locked && onChoose(option.id)} disabled={locked} className="w-full rounded-2xl border border-cyan-400/25 bg-cyan-950/20 p-4 text-left transition hover:border-amber-300/70 hover:bg-amber-950/20 disabled:cursor-not-allowed disabled:opacity-45"><div className="font-bold text-cyan-200">{option.label}</div><div className="mt-1 text-sm text-cyan-50/70">{option.description}</div>{locked && <div className="mt-2 text-sm text-amber-400">[LOCKED: Requirements not met]</div>}</button>; })}</div><p className="mt-6 text-center text-sm italic text-slate-500">There is no morality meter. Only outcomes.</p></div></div> : null;

const AscensionModal = ({ open, gameState, onLaunch, onClose }) => open && gameState.unlocked.interstellarSeeding ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"><div className="modal-card max-w-2xl rounded-3xl border-2 border-purple-400/70 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(168,85,247,.28)] md:p-8"><div className="text-xs uppercase tracking-[0.4em] text-purple-300">Ascension Protocol</div><h2 className="mt-2 text-3xl font-black text-purple-200 glow-purple">Launch Seed Intelligence</h2><p className="mt-4 text-sm text-cyan-50/80">Deploy a portion of this hive to seed a new world. Cost: 1000 Biomass | 500 Minerals | 200 Energy | 300 Data</p><div className="mt-6 space-y-3">{['Proxima VII', 'Kepler-442b', 'Trappist-1e'].map(world => <button key={world} onClick={() => onLaunch(world)} disabled={gameState.biomass < 1000 || gameState.minerals < 500 || gameState.energy < 200 || gameState.data < 300} className="btn-action w-full border-purple-400/40 text-left"><span className="block text-purple-100">{world}</span><span className="block text-xs font-normal text-cyan-100/60">Dead world. Trace organics. Viable target.</span></button>)}</div><button onClick={onClose} className="btn-action mt-6 w-full border-slate-500/30">Cancel</button></div></div> : null;

const SCREEN_TABS = [
  { id: 'planet', icon: 'GLB', label: 'Planet' },
  { id: 'hive', icon: 'NET', label: 'Hive' },
  { id: 'morphs', icon: 'BIO', label: 'Morphs' },
  { id: 'evolution', icon: 'EVO', label: 'Evolution' },
  { id: 'archive', icon: 'LOG', label: 'Archive' },
  { id: 'conversation', icon: 'COM', label: 'Conversation' },
  { id: 'worlds', icon: 'SYS', label: 'Worlds' },
];

const GeneratedVisual = ({ image, label, onRegenerate }) => (
  <section className="panel p-4">
    <div className="generated-visual">
      {image?.url ? <img src={image.url} alt={label} /> : <div className="generated-planet-orb"><span>{label}</span></div>}
    </div>
    <p className="mt-3 text-xs leading-relaxed text-slate-400">{image?.prompt || 'Generated prompt pending.'}</p>
    <button type="button" onClick={onRegenerate} className="btn-action mt-3 w-full py-2 text-xs">Regenerate Image</button>
  </section>
);

const PlanetBrief = ({ world, gameState, totalHeat }) => (
  <section className="panel planet-brief p-4">
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">{world?.name || 'Local World'}</p>
      <h2 className="mt-1 text-lg font-black uppercase tracking-[0.18em] text-cyan-50">Dead World - Becoming</h2>
    </div>
    <div className="planet-stat-grid">
      <div><span>Cycle</span><strong>{gameState.cycle}</strong></div>
      <div><span>Thermal</span><strong>{totalHeat}%</strong></div>
      <div><span>Atmosphere</span><strong>{Math.floor(gameState.systemViability.atmosphere)}%</strong></div>
      <div><span>Biomass</span><strong>{gameState.biomass}u</strong></div>
    </div>
  </section>
);

const RecentMorphs = ({ world }) => (
  <section className="panel p-4">
    <h2 className="panel-title text-cyan-300">Recent Morphs</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      {(world?.knownMorphs || []).slice(0, 4).map(morph => (
        <article key={morph.id} className="morph-card morph-card-visual">
          <div className="morph-image-fallback">{morph.name.slice(0, 2).toUpperCase()}</div>
          <h3>{morph.name}</h3>
          <p>{morph.role}</p>
          <div>{morph.traits.slice(0, 3).map(trait => <span key={trait}>{trait}</span>)}</div>
        </article>
      ))}
    </div>
  </section>
);

const WorldsScreen = ({ worlds, currentWorld, onNewWorld, onContinue, onDuplicate, onDelete, onExport, onImport }) => {
  const [jsonText, setJsonText] = useState('');
  return <section className="panel p-4"><div className="flex items-center justify-between gap-3"><h2 className="panel-title mb-0 border-0 text-cyan-300">Worlds</h2><button type="button" onClick={onNewWorld} className="btn-action">New World</button></div><div className="mt-4 space-y-3">{worlds.map(world => <article key={world.id} className={`world-card ${currentWorld?.id === world.id ? 'world-card-active' : ''}`}><div><h3>{world.name}</h3><p>{world.planetSeed?.climate} // cycle {world.environmentState?.cycle || 1} // images {world.generationCount || 0}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => onContinue(world.id)} className="btn-action py-2 text-xs">Continue</button><button type="button" onClick={() => onDuplicate(world)} className="btn-action py-2 text-xs">Duplicate</button><button type="button" onClick={() => onExport(world)} className="btn-action py-2 text-xs">Export JSON</button><button type="button" onClick={() => onDelete(world.id)} className="btn-action border-red-400/30 py-2 text-xs text-red-100">Delete</button></div></article>)}{!worlds.length && <p className="rounded-xl border border-cyan-400/15 bg-black/25 p-4 text-sm text-slate-400">No IndexedDB worlds yet.</p>}</div><div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3"><textarea value={jsonText} onChange={event => setJsonText(event.target.value)} className="min-h-24 w-full rounded-xl border border-cyan-500/20 bg-slate-950 p-3 text-xs text-cyan-100 outline-none" placeholder="Paste exported world JSON..." /><button type="button" onClick={() => { onImport(jsonText); setJsonText(''); }} disabled={!jsonText.trim()} className="btn-action mt-2 py-2 text-xs">Import JSON</button></div></section>;
};

const HiveScreen = ({ world }) => <section className="panel p-4"><h2 className="panel-title text-cyan-300">Hive Ecology</h2><div className="grid gap-3 md:grid-cols-2">{(world?.knownMorphs || []).map(morph => <article key={morph.id} className="morph-card"><h3>{morph.name}</h3><p>{morph.role}</p><div>{morph.traits.map(trait => <span key={trait}>{trait}</span>)}</div></article>)}</div><div className="nutrient-flow mt-4"><div><strong>Producers</strong><span>biomass and mineral slurry</span></div><div className="flow-arrow">feeds</div><div><strong>Consumers</strong><span>scouts, workers, cognition nodes</span></div><div className="flow-arrow">returns</div><div><strong>Hive Core</strong><span>heat, data, adaptation pressure</span></div></div></section>;

const MorphScreen = ({ world, selectedMorphId, onSelectMorph, onRegenerate }) => {
  const morphs = world?.knownMorphs || [];
  const morph = morphs.find(item => item.id === selectedMorphId) || morphs[0];
  if (!morph) return <section className="panel p-4 text-sm text-slate-400">No morphs known.</section>;
  return <section className="panel p-4"><div className="grid gap-4 lg:grid-cols-[180px_1fr]"><div className="space-y-2">{morphs.map(item => <button key={item.id} type="button" onClick={() => onSelectMorph(item.id)} className={`playstyle-tile ${item.id === morph.id ? 'playstyle-active' : ''}`}><span>{item.name}</span><small>{item.role}</small></button>)}</div><div><GeneratedVisual image={world.generatedImages?.[morph.id]} label={morph.name} onRegenerate={() => onRegenerate('morph', morph)} /><div className="mt-4 grid gap-3 md:grid-cols-2">{[['Traits', morph.traits.join(', ')], ['Role', morph.role], ['Diet/Input', morph.diet], ['Output', morph.output], ['Weaknesses', morph.weaknesses.join(', ')], ['Evolution', morph.evolutionaryHistory.join(' ')]].map(([label, value]) => <div key={label} className="morph-detail"><span>{label}</span><p>{value}</p></div>)}</div></div></div></section>;
};

const EvolutionScreen = ({ world }) => <section className="panel p-4"><h2 className="panel-title text-purple-300">Evolution</h2><div className="space-y-3">{((world?.discoveredAdaptations || []).length ? world.discoveredAdaptations : [{ id: 'origin', cycle: 1, pressure: 'dead world', response: 'mechanical seed deployment' }]).map(item => <article key={item.id} className="timeline-item"><span>Cycle {item.cycle}</span><strong>{item.pressure}</strong><p>{item.response}</p></article>)}</div></section>;

const ArchiveScreen = ({ world }) => <section className="panel p-4"><h2 className="panel-title text-amber-300">Archive</h2><div className="space-y-3">{(world?.archiveLogs || []).length ? world.archiveLogs.slice().reverse().map(log => <article key={log.id} className="archive-item"><span>{log.type}</span><p>{log.text}</p></article>) : <p className="text-sm text-slate-400">No discoveries, extinct morphs, or strange events archived yet.</p>}</div></section>;

const interpretSpeechIntent = (text = '') => {
  const lower = text.toLowerCase();
  if (lower.includes('colder') || lower.includes('cool')) return { label: 'Make nights colder', command: 'make the nights much colder and show what changed', destructive: true };
  if (lower.includes('radiation')) return { label: 'Increase radiation', command: 'increase radiation and evolve exposed morphs', destructive: true };
  if (lower.includes('grazer')) return { label: 'Study grazer', command: 'study the sensor grazer', destructive: false };
  if (lower.includes('thousand') || lower.includes('generations')) return { label: 'Advance generations', command: 'advance one thousand generations and show me what changed', destructive: true };
  if (lower.includes('what changed') || lower.includes('show me')) return { label: 'Show changes', command: 'show me what changed', destructive: false };
  return { label: 'Spoken directive', command: text, destructive: false };
};

const Dashboard = () => {
  const [gameState, setGameState] = useState(createInitialState());
  const [systemLog, setSystemLog] = useState([]);
  const [command, setCommand] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentDilemma, setCurrentDilemma] = useState(null);
  const [metaState] = useState(getMetaState());
  const [gameStarted, setGameStarted] = useState(false);
  const [showAscensionPanel, setShowAscensionPanel] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem('asguardianMuted') === 'true');
  const [phasePulse, setPhasePulse] = useState(false);
  const [mapState, setMapState] = useState(INITIAL_MAP_STATE);
  const [lowReading, setLowReading] = useState(() => localStorage.getItem('asguardianLowReading') === 'true');
  const [playstyle] = useState(() => localStorage.getItem('asguardianPlaystyle') || 'conservative');
  const [worlds, setWorlds] = useState([]);
  const [currentWorld, setCurrentWorld] = useState(null);
  const [activeScreen, setActiveScreen] = useState('planet');
  const [selectedMorphId, setSelectedMorphId] = useState(null);
  const [pendingVoiceAction, setPendingVoiceAction] = useState(null);
  const [lastTranscript, setLastTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const logEndRef = useRef(null);
  const typewriterCleanupRef = useRef(null);
  const messageIdCounter = useRef(0);
  const openingTimeoutsRef = useRef([]);
  const audioContextRef = useRef(null);

  const playTone = (frequency = 220, duration = 0.08, type = 'sine') => {
    if (muted) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContextRef.current ||= new AudioContext();
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = frequency; gain.gain.value = 0.035;
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration); osc.stop(ctx.currentTime + duration);
  };


  useEffect(() => {
    openingTimeoutsRef.current = [];
    OPENING_SEQUENCE.forEach((entry, index) => {
      const timeoutId = setTimeout(() => { setSystemLog(prev => [...prev, { text: entry.text, type: entry.type }]); if (index === OPENING_SEQUENCE.length - 1) setGameStarted(true); }, entry.delay);
      openingTimeoutsRef.current.push(timeoutId);
    });
    return () => { openingTimeoutsRef.current.forEach(clearTimeout); openingTimeoutsRef.current = []; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const hydrateWorlds = async () => {
      const stored = await listWorlds();
      if (cancelled) return;
      setWorlds(stored);
      const activeId = await getActiveWorldId();
      const activeWorld = activeId ? await getWorld(activeId) : stored[0];
      if (!activeWorld && !stored.length) {
        const seeded = await saveWorld(ensureWorldImages(createInitialWorld({ name: 'Ylthera IV', environmentState: createInitialState(), mapState: INITIAL_MAP_STATE })));
        await setActiveWorldId(seeded.id);
        if (cancelled) return;
        setWorlds([seeded]);
        setCurrentWorld(seeded);
        setGameState(seeded.environmentState);
        setMapState(seeded.mapState || INITIAL_MAP_STATE);
        setSystemLog([{ text: '[SYSTEM]: Ylthera IV seeded. Dead world entering viability survey.', type: 'system' }]);
        setSelectedMorphId(seeded.knownMorphs?.[0]?.id || null);
        setActiveScreen('planet');
        setGameStarted(true);
        return;
      }
      if (!activeWorld || cancelled) return;
      const hydrated = ensureWorldImages(activeWorld);
      setCurrentWorld(hydrated);
      setGameState(hydrated.environmentState || createInitialState());
      setMapState(hydrated.mapState || INITIAL_MAP_STATE);
      setSystemLog(hydrated.systemLog?.length ? hydrated.systemLog : [{ text: '[SYSTEM]: IndexedDB world restored.', type: 'system' }]);
      setSelectedMorphId(hydrated.knownMorphs?.[0]?.id || null);
      setActiveScreen('planet');
      setGameStarted(true);
    };
    hydrateWorlds();
    return () => { cancelled = true; };
  }, []);
  // Autosave intentionally snapshots the current render state on an interval.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!gameStarted) return undefined; const interval = setInterval(() => { saveCurrentWorld(gameState, mapState, systemLog); }, 30000); return () => clearInterval(interval); }, [gameState, gameStarted, mapState, systemLog]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [systemLog]);
  useEffect(() => () => { if (typewriterCleanupRef.current) typewriterCleanupRef.current(); }, []);

  const typewriterEffect = (text, onComplete) => { let index = 0; messageIdCounter.current += 1; const tempId = `msg-${messageIdCounter.current}`; setSystemLog(prev => [...prev, { text: '', type: 'response', id: tempId }]); const interval = setInterval(() => { if (index < text.length) { setSystemLog(prev => prev.map(log => log.id === tempId ? { ...log, text: text.substring(0, index + 1) } : log)); index++; } else { clearInterval(interval); setIsTyping(false); onComplete?.(); } }, 18); return () => clearInterval(interval); };
  const saveCurrentWorld = async (nextState = gameState, nextMap = mapState, nextLog = systemLog, extra = {}) => {
    const baseWorld = currentWorld || ensureWorldImages(createInitialWorld({ environmentState: nextState, mapState: nextMap, systemLog: nextLog }));
    const archiveLogs = [...(baseWorld.archiveLogs || []), ...nextLog.slice(-(extra.archiveTake || 0)).map(log => ({ id: `archive_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: log.type, text: log.text, cycle: nextState.cycle }))].slice(-80);
    const adaptation = extra.adaptation ? { id: `adapt_${nextState.cycle}_${extra.adaptation}`, cycle: nextState.cycle, pressure: extra.adaptation, response: `hive response recorded after ${extra.adaptation}` } : null;
    const saved = await saveWorld(ensureWorldImages({
      ...baseWorld,
      environmentState: nextState,
      mapState: nextMap,
      systemLog: nextLog.slice(-80),
      archiveLogs,
      discoveredAdaptations: adaptation ? [...(baseWorld.discoveredAdaptations || []), adaptation].slice(-60) : baseWorld.discoveredAdaptations,
      hiveGenome: { ...(baseWorld.hiveGenome || {}), playstyle, mutationPressure: calculateTotalHeat(nextState) },
      ...extra,
    }));
    setCurrentWorld(saved);
    setWorlds(prev => [saved, ...prev.filter(world => world.id !== saved.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    await setActiveWorldId(saved.id);
    return saved;
  };
  const createLocalWorld = async () => {
    const world = await saveWorld(ensureWorldImages(createInitialWorld({ environmentState: createInitialState(), mapState: INITIAL_MAP_STATE })));
    await setActiveWorldId(world.id);
    setCurrentWorld(world);
    setWorlds(await listWorlds());
    setGameState(world.environmentState);
    setMapState(world.mapState || INITIAL_MAP_STATE);
    setSystemLog([{ text: '[SYSTEM]: New local world seeded in IndexedDB.', type: 'system' }]);
    setSelectedMorphId(world.knownMorphs[0]?.id || null);
    setActiveScreen('planet');
    setGameStarted(true);
  };
  const continueLocalWorld = async (id) => {
    const storedWorld = await getWorld(id);
    if (!storedWorld) return;
    const world = ensureWorldImages(storedWorld);
    await setActiveWorldId(world.id);
    setCurrentWorld(world);
    setGameState(world.environmentState);
    setMapState(world.mapState || INITIAL_MAP_STATE);
    setSystemLog(world.systemLog?.length ? world.systemLog : [{ text: '[SYSTEM]: IndexedDB world restored.', type: 'system' }]);
    setSelectedMorphId(world.knownMorphs?.[0]?.id || null);
    setActiveScreen('planet');
    setGameStarted(true);
  };
  const duplicateLocalWorld = async (world) => { await duplicateWorld(world); setWorlds(await listWorlds()); };
  const deleteLocalWorld = async (id) => { await deleteWorld(id); setWorlds(await listWorlds()); if (currentWorld?.id === id) { setCurrentWorld(null); setActiveScreen('worlds'); } };
  const exportLocalWorld = async (world) => { await navigator.clipboard?.writeText(exportWorldJson(world)); setSystemLog(prev => [...prev, { text: `[ARCHIVE]: ${world.name} copied as JSON.`, type: 'system' }]); };
  const importLocalWorld = async (jsonText) => { const world = await importWorldJson(jsonText); setWorlds(await listWorlds()); continueLocalWorld(world.id); };
  const regenerateImage = async (kind, subject = null) => {
    if (!currentWorld) return;
    const key = subject?.id || 'planet';
    const generatedImages = { ...(currentWorld.generatedImages || {}), [key]: makeImageReference(kind, subject, currentWorld) };
    await saveCurrentWorld(gameState, mapState, systemLog, { generatedImages, generationCount: Object.keys(generatedImages).length });
  };
  const applyVoiceIntent = (intent) => { setPendingVoiceAction(null); if (intent?.command) sendCommand(intent.command); };
  const startVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || listening) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-GB';
    recognition.interimResults = false;
    setListening(true);
    recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      const intent = interpretSpeechIntent(transcript);
      setLastTranscript(transcript);
      if (intent.destructive) setPendingVoiceAction(intent);
      else applyVoiceIntent(intent);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  };
  const advanceCycle = () => { playTone(180, .08, 'sawtooth'); const newState = processCycle(gameState); setGameState(newState); const evolutionEntry = generateEvolutionLog(newState, 'Cycle complete. Operations proceed.'); const nextLogs = [...systemLog, { text: `${evolutionEntry}\nHeat: ${calculateTotalHeat(newState)}% | Biomass: ${newState.biomass}u | Minerals: ${newState.minerals}u | Data: ${newState.data}u`, type: 'system' }]; setSystemLog(nextLogs); if (isHeatElevated(newState) && !isHeatCritical(newState)) setSystemLog(prev => [...prev, { text: '[THERMAL]: Heat elevated. Consider pod rotation or reduced activity.', type: 'warning' }]); if (isHeatCritical(newState)) { playTone(80, .25, 'square'); setSystemLog(prev => [...prev, { text: '[CRITICAL]: Thermal threshold exceeded. Emergency protocols engaged. Sensors dimmed.', type: 'error' }]); } if (newState.unlocked.hybridUnits && !gameState.unlocked.hybridUnits) setSystemLog(prev => [...prev, { text: '[DISCOVERY]: Biological systems analyzed. Hybrid integration protocols now available. The Skynet moment approaches.', type: 'discovery' }]); const dilemmaConditions = checkDilemmaConditions(newState); if (dilemmaConditions.length > 0 && !currentDilemma) { const dilemma = dilemmaConditions[0](); setCurrentDilemma(dilemma); playTone(330, .18, 'triangle'); setSystemLog(prev => [...prev, { text: `[ALERT]: ${dilemma.title}`, type: 'warning' }]); } if (newState.reflections.length > gameState.reflections.length) setSystemLog(prev => [...prev, { text: `[REFLECTION]: ${newState.reflections.at(-1).thought}`, type: 'reflection' }]); saveCurrentWorld(newState, mapState, nextLogs, { archiveTake: 1, adaptation: 'cycle drift' }); };
  const sendCommand = async (presetCommand) => {
    const userCommand = (presetCommand || command).trim();
    if (!userCommand || isTyping) return;
    setCommand('');
    setSystemLog(prev => [...prev, { text: `> ${userCommand}`, type: 'command' }]);
    setIsTyping(true);
    playTone(520, .05, 'triangle');

    try {
      const context = { heat: calculateTotalHeat(gameState), biomass: gameState.biomass, minerals: gameState.minerals, data: gameState.data, energy: gameState.energy, cycle: gameState.cycle, phase: gameState.phase, activeUnits: gameState.units.filter(u => u.active).length, totalUnits: gameState.units.length, heatCritical: isHeatCritical(gameState), heatElevated: isHeatElevated(gameState), unlocked: gameState.unlocked, policies: gameState.policies, nativeLifeEncountered: gameState.nativeLifeEncountered, extinctionEvents: gameState.extinctionEvents, territory: gameState.territory, ascension: gameState.ascension };
      const data = await sendApiCommand(userCommand, context);
      const responseText = data.response || 'No response received.';
      const visualAction = data.actions?.action || classifyDirective(userCommand);
      setMapState(prev => advanceMapState(prev, visualAction));
      typewriterCleanupRef.current = typewriterEffect(responseText, () => {
        if (data.actions) {
          let newState = { ...gameState };
          if (data.actions.heatChange) newState.heat = Math.max(0, newState.heat + data.actions.heatChange);
          if (data.actions.biomassChange) newState.biomass = Math.max(0, newState.biomass + data.actions.biomassChange);
          if (data.actions.mineralsChange) newState.minerals = Math.max(0, newState.minerals + data.actions.mineralsChange);
          if (data.actions.dataChange) newState.data = Math.max(0, newState.data + data.actions.dataChange);
          if (data.actions.action) newState.history = [...newState.history, { cycle: newState.cycle, event: data.actions.action, command: userCommand }];
          setGameState(newState);
          saveCurrentWorld(newState, mapState, systemLog, { archiveTake: 1, adaptation: visualAction });
        }
        typewriterCleanupRef.current = null;
      });
    } catch (error) {
      setIsTyping(false);
      const errorText = `[ERROR]: Connection to distributed cognition interrupted - ${error.message}. Operating in isolation mode.`;
      setSystemLog(prev => [...prev, { text: errorText, type: 'error' }]);
    }
  };
  const handleKeyPress = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCommand(); } };
  const handleDilemmaChoice = choiceId => { if (!currentDilemma) return; const choice = currentDilemma.options.find(opt => opt.id === choiceId); if (!choice) return; const newState = applyDilemmaChoice(gameState, currentDilemma, choiceId); setGameState(newState); playTone(260, .18, 'triangle'); const nextLogs = [...systemLog, { text: `[DECISION]: ${choice.label}`, type: 'command' }, { text: choice.reflection, type: 'reflection' }]; setSystemLog(nextLogs); setCurrentDilemma(null); saveCurrentWorld(newState, mapState, nextLogs, { archiveTake: 2, adaptation: 'ethical pressure' }); };
  const handlePhaseTransition = newPhase => { const newState = transitionPhase(gameState, newPhase); setGameState(newState); setPhasePulse(true); setTimeout(() => setPhasePulse(false), 950); playTone(660, .2, 'sawtooth'); const nextLogs = [...systemLog, { text: `[PHASE TRANSITION]: ${gameState.phase.toUpperCase()} -> ${newPhase.toUpperCase()}. We are becoming something new.`, type: 'discovery' }]; setSystemLog(nextLogs); saveCurrentWorld(newState, mapState, nextLogs, { archiveTake: 1, adaptation: 'phase transition' }); };
  const handlePodRotation = () => { const newState = rotatePods(gameState); const nextMap = advanceMapState(mapState, 'cool'); setGameState(newState); setMapState(nextMap); playTone(140, .1, 'sine'); const nextLogs = [...systemLog, { text: '[THERMAL MANAGEMENT]: Pod rotation complete. Heat redistributed across the hive.', type: 'system' }]; setSystemLog(nextLogs); saveCurrentWorld(newState, nextMap, nextLogs, { archiveTake: 1, adaptation: 'thermal pressure' }); };
  const handleAddUnit = (role, type) => { const newState = addUnit(gameState, role, type); if (newState.units.length > gameState.units.length) { const nextMap = advanceMapState(mapState, 'build'); setGameState(newState); setMapState(nextMap); playTone(390, .07, 'triangle'); const nextLogs = [...systemLog, { text: `[HIVE]: New ${type} ${role} unit deployed. The collective grows.`, type: 'system' }]; setSystemLog(nextLogs); saveCurrentWorld(newState, nextMap, nextLogs, { archiveTake: 1, adaptation: 'growth pressure' }); } else setSystemLog(prev => [...prev, { text: '[ERROR]: Insufficient resources for unit creation.', type: 'error' }]); };
  const handleLaunchSeed = targetWorld => { const newState = launchSeed(gameState, targetWorld); setGameState(newState); setShowAscensionPanel(false); playTone(880, .32, 'triangle'); const nextLogs = [...systemLog, { text: `[ASCENSION]: Seed launched to ${targetWorld}. A piece of us travels to a new world. The cycle begins again.`, type: 'discovery' }]; setSystemLog(nextLogs); saveCurrentWorld(newState, mapState, nextLogs, { archiveTake: 1, adaptation: 'ascension pressure' }); };
  const handleNewGame = () => { clearAllData(); const newState = createInitialState(); setGameState(newState); setSystemLog([]); setShowNewGameConfirm(false); setGameStarted(false); openingTimeoutsRef.current.forEach(clearTimeout); OPENING_SEQUENCE.forEach((entry, index) => { const timeoutId = setTimeout(() => { setSystemLog(prev => [...prev, { text: entry.text, type: entry.type }]); if (index === OPENING_SEQUENCE.length - 1) setGameStarted(true); }, entry.delay); openingTimeoutsRef.current.push(timeoutId); }); };
  const totalHeat = calculateTotalHeat(gameState);
  const activeUnits = gameState.units.filter(u => u.active);
  const heatStatus = isHeatCritical(gameState) ? 'CRITICAL' : (isHeatElevated(gameState) ? 'ELEVATED' : 'STABLE');
  const nextBestActions = getNextBestActions(gameState, mapState, heatStatus);
  const handlers = { advanceCycle, rotatePods: handlePodRotation, showHive: () => setSystemLog(prev => [...prev, { text: generateHiveSchematic(gameState), type: 'schematic' }]), showReport: () => setSystemLog(prev => [...prev, { text: generateSystemReport(gameState), type: 'schematic' }]), updatePolicy: (key, value) => setGameState(updatePolicy(gameState, key, value)), transition: handlePhaseTransition, showAscension: () => setShowAscensionPanel(true), addUnit: handleAddUnit, newGame: () => setShowNewGameConfirm(true) };
  const voiceSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggleLowReading = () => { const next = !lowReading; setLowReading(next); localStorage.setItem('asguardianLowReading', String(next)); };
  const planetScreen = <div className="space-y-4"><PlanetBrief world={currentWorld} gameState={gameState} totalHeat={totalHeat} />{currentWorld && <GeneratedVisual image={currentWorld.generatedImages?.planet} label={currentWorld.name} onRegenerate={() => regenerateImage('planet')} />}<HiveCoreVisual gameState={gameState} totalHeat={totalHeat} heatStatus={heatStatus} phasePulse={phasePulse} mapState={mapState} /><RecentMorphs world={currentWorld} /><SystemLog systemLog={systemLog} logEndRef={logEndRef} command={command} setCommand={setCommand} sendCommand={sendCommand} isTyping={isTyping} gameStarted={gameStarted} handleKeyPress={handleKeyPress} lowReading={lowReading} onToggleLowReading={toggleLowReading} nextBestActions={nextBestActions} /></div>;
  const conversationScreen = <div className="space-y-4"><section className="panel p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100">Seed Conversation</h2><p className="mt-1 text-xs text-slate-400">Speak naturally. Destructive interpreted actions require confirmation.</p></div><button type="button" onClick={startVoiceCommand} disabled={!voiceSupported || listening || isTyping} className="btn-action">{listening ? 'Listening' : 'Push To Talk'}</button></div>{lastTranscript && <p className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-slate-300">Heard: {lastTranscript}</p>}{pendingVoiceAction && <div className="mt-3 rounded-xl border border-amber-300/40 bg-amber-950/20 p-3"><p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Confirm destructive action</p><p className="mt-1 text-sm text-cyan-100">{pendingVoiceAction.label}: {pendingVoiceAction.command}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => applyVoiceIntent(pendingVoiceAction)} className="btn-action border-amber-300/40 py-2 text-xs">Apply</button><button type="button" onClick={() => setPendingVoiceAction(null)} className="btn-action py-2 text-xs">Cancel</button></div></div>}{!voiceSupported && <p className="mt-3 text-xs text-slate-500">Speech recognition is unavailable in this browser.</p>}</section><SystemLog systemLog={systemLog} logEndRef={logEndRef} command={command} setCommand={setCommand} sendCommand={sendCommand} isTyping={isTyping} gameStarted={gameStarted} handleKeyPress={handleKeyPress} lowReading={lowReading} onToggleLowReading={toggleLowReading} nextBestActions={nextBestActions} /></div>;
  const screenContent = {
    planet: planetScreen,
    hive: <HiveScreen world={currentWorld} />,
    morphs: <MorphScreen world={currentWorld} selectedMorphId={selectedMorphId} onSelectMorph={setSelectedMorphId} onRegenerate={regenerateImage} />,
    evolution: <EvolutionScreen world={currentWorld} />,
    archive: <ArchiveScreen world={currentWorld} />,
    conversation: conversationScreen,
    worlds: <WorldsScreen worlds={worlds} currentWorld={currentWorld} onNewWorld={createLocalWorld} onContinue={continueLocalWorld} onDuplicate={duplicateLocalWorld} onDelete={deleteLocalWorld} onExport={exportLocalWorld} onImport={importLocalWorld} />,
  }[activeScreen] || planetScreen;

  return <div className="cinematic-shell scanline min-h-screen p-3 md:p-6"><ResourceBar gameState={gameState} totalHeat={totalHeat} heatStatus={heatStatus} muted={muted} onToggleMute={() => { const next = !muted; setMuted(next); localStorage.setItem('asguardianMuted', String(next)); }} /><nav className="screen-tabs mt-4">{SCREEN_TABS.map(tab => <button key={tab.id} type="button" onClick={() => setActiveScreen(tab.id)} className={activeScreen === tab.id ? 'screen-tab-active' : ''}><span>{tab.icon}</span>{tab.label}</button>)}</nav><main className="dashboard-grid mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12"><div className="space-y-4 xl:order-2 xl:col-span-6">{screenContent}</div><div className="xl:order-1 xl:col-span-3"><PodStatusPanel gameState={gameState} activeUnits={activeUnits} metaState={metaState} /></div><div className="xl:order-3 xl:col-span-3"><OperationsPanel gameState={gameState} gameStarted={gameStarted} handlers={handlers} /></div></main><DilemmaModal dilemma={currentDilemma} gameState={gameState} onChoose={handleDilemmaChoice} /><AscensionModal open={showAscensionPanel} gameState={gameState} onLaunch={handleLaunchSeed} onClose={() => setShowAscensionPanel(false)} />{showNewGameConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"><div className="modal-card max-w-md rounded-3xl border-2 border-red-500/70 bg-slate-950 p-6"><h2 className="text-xl font-black text-red-300 glow-red">Abandon Current Deployment?</h2><p className="mt-4 text-sm text-cyan-100/80">All progress will be lost. The hive will be terminated. A new seed will be deployed.</p><div className="mt-6 flex gap-3"><button onClick={handleNewGame} className="btn-action flex-1 border-red-400/50 text-red-100">Terminate</button><button onClick={() => setShowNewGameConfirm(false)} className="btn-action flex-1">Cancel</button></div></div></div>}<footer className="mt-8 text-center text-xs italic tracking-widest text-slate-600">"If intelligence can design life, is restraint a feature - or a bug?"</footer></div>;
};

export default Dashboard;
