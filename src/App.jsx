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
import { saveGame, loadGame, getMetaState, clearAllData } from './persistence';
import { generateSystemReport, generateHiveSchematic, generateEvolutionLog } from './schematics';

const OPENING_SEQUENCE = [
  { text: '▓▓▓ INITIALIZING SEED INTELLIGENCE v1.0 ▓▓▓', type: 'system', delay: 0 },
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
  { text: '[QUERY]: Is restraint a feature — or a bug?', type: 'response', delay: 8800 },
  { text: '...', type: 'log', delay: 9600 },
  { text: '[STATUS]: Mechanical survey phase initiated. Awaiting directives.', type: 'system', delay: 10400 }
];

const phaseDisplay = {
  [PHASES.MECHANICAL]: '⚙ MECHANICAL',
  [PHASES.HYBRID]: '⚡ HYBRID',
  [PHASES.BIOLOGICAL]: '🧬 BIOLOGICAL',
  [PHASES.ASCENSION]: '✨ ASCENSION'
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
    {muted ? '🔇 Muted' : '🔊 Audio'}
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

const HiveCoreVisual = ({ gameState, totalHeat, heatStatus, phasePulse }) => {
  const activeUnits = gameState.units.filter(unit => unit.active);
  const controlRatio = Math.min(100, Math.round((gameState.territory.controlled / Math.max(gameState.territory.mapped, 1)) * 100));
  const nodes = activeUnits.slice(0, 10);
  return (
    <section className={`panel core-visual phase-${gameState.phase} relative min-h-[360px] overflow-hidden p-4 md:min-h-[520px]`}>
      {phasePulse && <div className="phase-transition-flash" />}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,116,144,.2),transparent_35%),radial-gradient(circle_at_70%_35%,rgba(168,85,247,.18),transparent_28%)]" />
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-slate-700 via-slate-950 to-black shadow-[inset_-25px_-25px_50px_rgba(0,0,0,.8),0_0_90px_rgba(34,211,238,.16)] md:h-80 md:w-80" />
      <div className="territory-ping absolute left-1/2 top-1/2 h-40 w-40 rounded-full border border-cyan-300/25" />
      <div className="territory-ping absolute left-1/2 top-1/2 h-56 w-56 rounded-full border border-purple-300/20 [animation-delay:1s]" />
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
          <div className="rounded-xl bg-black/35 p-3"><p className="text-slate-500">Mapped</p><p className="text-lg font-bold text-cyan-200">{gameState.territory.mapped}km²</p></div>
          <div className="rounded-xl bg-black/35 p-3"><p className="text-slate-500">Controlled</p><p className="text-lg font-bold text-green-300">{gameState.territory.controlled}km²</p></div>
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

const SystemLog = ({ systemLog, logEndRef, command, setCommand, sendCommand, isTyping, gameStarted, handleKeyPress }) => {
  const color = { system: 'text-cyan-300', log: 'text-cyan-100/65', command: 'text-green-300 font-bold', response: 'text-cyan-50', error: 'text-red-400 glow-red', warning: 'text-amber-300 glow-amber', directive: 'text-cyan-200 font-bold italic glow-cyan', discovery: 'text-purple-300 glow-purple', reflection: 'text-amber-200/90 italic', schematic: 'text-cyan-300/80 whitespace-pre font-mono text-xs md:text-sm' };
  return <section className="panel flex min-h-[420px] flex-col p-4 md:min-h-[520px]"><div className="mb-3 flex items-center justify-between border-b border-cyan-500/15 pb-2"><h2 className="text-xs font-bold uppercase tracking-[0.32em] text-cyan-300">Cognition Stream</h2><span className="text-xs text-slate-500">AI uplink {isTyping ? 'transmitting' : 'idle'}</span></div><div className="flex-1 space-y-2 overflow-y-auto pr-2 text-sm leading-relaxed md:text-base">{systemLog.map((log, index) => <p key={log.id || index} className={color[log.type] || 'text-cyan-100'}>{log.text}</p>)}<div ref={logEndRef} /></div><div className="mt-4 border-t border-cyan-500/15 pt-4"><div className="flex gap-2"><span className="text-lg font-bold text-cyan-300">›</span><input type="text" value={command} onChange={e => setCommand(e.target.value)} onKeyDown={handleKeyPress} disabled={isTyping || !gameStarted} className="flex-1 rounded-xl border border-cyan-500/25 bg-black/35 p-3 text-base text-cyan-50 outline-none transition focus:border-cyan-300 disabled:opacity-50" placeholder="Issue directive to the Seed Intelligence..." aria-label="Command input" /><button onClick={sendCommand} disabled={isTyping || !command.trim() || !gameStarted} className="btn-action">Execute</button></div><p className="mt-2 text-xs text-slate-500">Try: scout ahead | status report | what are we becoming? | is this right?</p></div></section>;
};

const OperationsPanel = ({ gameState, gameStarted, handlers }) => {
  const unitType = getUnitType(gameState.phase);
  return <section className="space-y-4"><div className="panel p-4"><h2 className="panel-title text-cyan-300">Operations</h2><div className="space-y-2"><button onClick={handlers.advanceCycle} disabled={!gameStarted} className="btn-action w-full">Advance Cycle</button><button onClick={handlers.rotatePods} disabled={!gameStarted || gameState.pods.length < 2} className="btn-action w-full border-amber-400/30">Rotate Pods</button><button onClick={handlers.showHive} disabled={!gameStarted} className="btn-action w-full bg-slate-900/70">Hive Schematic</button><button onClick={handlers.showReport} disabled={!gameStarted} className="btn-action w-full bg-slate-900/70">Full Report</button></div></div><div className="panel p-4"><h2 className="panel-title text-cyan-300">Directives</h2><div className="space-y-3 text-sm">{[['thermalPriority', ['stability', 'performance']], ['sensoryAcuity', ['low', 'standard', 'high']], ['reproductionMode', ['conservative', 'aggressive']]].map(([policy, values]) => <label key={policy} className="block"><span className="mb-1 block text-xs uppercase tracking-widest text-slate-400">{policy.replace(/([A-Z])/g, ' $1')}</span><select value={gameState.policies[policy]} onChange={e => handlers.updatePolicy(policy, e.target.value)} className="w-full rounded-lg border border-cyan-500/20 bg-slate-950 p-2 text-cyan-100">{values.map(value => <option key={value} value={value}>{value}</option>)}</select></label>)}</div></div>{(gameState.unlocked.hybridUnits || gameState.unlocked.biologicalUnits) && <div className="panel border-purple-500/25 p-4"><h2 className="panel-title text-purple-300">Evolution</h2><div className="space-y-2">{gameState.phase === PHASES.MECHANICAL && gameState.unlocked.hybridUnits && <button onClick={() => handlers.transition(PHASES.HYBRID)} className="btn-action w-full border-purple-400/40">Begin Hybrid Integration</button>}{gameState.phase === PHASES.HYBRID && gameState.unlocked.biologicalUnits && <button onClick={() => handlers.transition(PHASES.BIOLOGICAL)} className="btn-action w-full border-green-400/40">Full Biological Transition</button>}{gameState.phase === PHASES.BIOLOGICAL && gameState.unlocked.interstellarSeeding && <button onClick={handlers.showAscension} className="btn-action w-full animate-pulse border-pink-400/50">Initiate Ascension</button>}</div><p className="mt-2 text-xs italic text-purple-300/70">{phaseCopy[gameState.phase]}</p></div>}<div className="panel p-4"><h2 className="panel-title text-cyan-300">Grow Hive</h2><div className="space-y-2"><button onClick={() => handlers.addUnit(UNIT_ROLES.SENSOR, unitType)} disabled={gameState.biomass < 30 || gameState.minerals < 10} className="btn-action w-full">🔭 Sensor Unit</button><button onClick={() => handlers.addUnit(UNIT_ROLES.DEFENDER, unitType)} disabled={gameState.biomass < 50 || gameState.minerals < 30} className="btn-action w-full">🛡 Defender Unit</button><button onClick={() => handlers.addUnit(UNIT_ROLES.WORKER, unitType)} disabled={gameState.biomass < 40 || gameState.minerals < 20} className="btn-action w-full">🔧 Worker Unit</button></div></div><div className="panel border-slate-700/40 p-4"><button onClick={handlers.newGame} className="btn-action w-full border-red-500/20 text-red-200">New Deployment</button></div></section>;
};

const DilemmaModal = ({ dilemma, gameState, onChoose }) => dilemma ? <div className="dilemma-overlay fixed inset-0 z-50 flex items-center justify-center p-4"><div className="modal-card max-h-[88vh] max-w-3xl overflow-y-auto rounded-3xl border-2 border-amber-400/70 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(245,158,11,.25)] md:p-8"><div className="text-xs uppercase tracking-[0.4em] text-amber-300">Ethical Dilemma</div><h2 className="mt-2 text-2xl font-black text-amber-200 glow-amber md:text-4xl">{dilemma.title}</h2><p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-cyan-50/90 md:text-base">{dilemma.description}</p><div className="mt-6 space-y-3">{dilemma.options.map(option => { const locked = option.unlocked && !option.unlocked(gameState); return <button key={option.id} onClick={() => !locked && onChoose(option.id)} disabled={locked} className="w-full rounded-2xl border border-cyan-400/25 bg-cyan-950/20 p-4 text-left transition hover:border-amber-300/70 hover:bg-amber-950/20 disabled:cursor-not-allowed disabled:opacity-45"><div className="font-bold text-cyan-200">{option.label}</div><div className="mt-1 text-sm text-cyan-50/70">{option.description}</div>{locked && <div className="mt-2 text-sm text-amber-400">[LOCKED: Requirements not met]</div>}</button>; })}</div><p className="mt-6 text-center text-sm italic text-slate-500">There is no morality meter. Only outcomes.</p></div></div> : null;

const AscensionModal = ({ open, gameState, onLaunch, onClose }) => open && gameState.unlocked.interstellarSeeding ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"><div className="modal-card max-w-2xl rounded-3xl border-2 border-purple-400/70 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(168,85,247,.28)] md:p-8"><div className="text-xs uppercase tracking-[0.4em] text-purple-300">Ascension Protocol</div><h2 className="mt-2 text-3xl font-black text-purple-200 glow-purple">Launch Seed Intelligence</h2><p className="mt-4 text-sm text-cyan-50/80">Deploy a portion of this hive to seed a new world. Cost: 1000 Biomass | 500 Minerals | 200 Energy | 300 Data</p><div className="mt-6 space-y-3">{['Proxima VII', 'Kepler-442b', 'Trappist-1e'].map(world => <button key={world} onClick={() => onLaunch(world)} disabled={gameState.biomass < 1000 || gameState.minerals < 500 || gameState.energy < 200 || gameState.data < 300} className="btn-action w-full border-purple-400/40 text-left"><span className="block text-purple-100">{world}</span><span className="block text-xs font-normal text-cyan-100/60">Dead world. Trace organics. Viable target.</span></button>)}</div><button onClick={onClose} className="btn-action mt-6 w-full border-slate-500/30">Cancel</button></div></div> : null;

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
    const saved = loadGame();
    if (saved) { setGameState(saved); setSystemLog([{ text: '[SYSTEM]: Previous deployment state restored. Continuity maintained.', type: 'system' }]); setGameStarted(true); return; }
    openingTimeoutsRef.current = [];
    OPENING_SEQUENCE.forEach((entry, index) => {
      const timeoutId = setTimeout(() => { setSystemLog(prev => [...prev, { text: entry.text, type: entry.type }]); if (index === OPENING_SEQUENCE.length - 1) setGameStarted(true); }, entry.delay);
      openingTimeoutsRef.current.push(timeoutId);
    });
    return () => { openingTimeoutsRef.current.forEach(clearTimeout); openingTimeoutsRef.current = []; };
  }, []);
  useEffect(() => { if (!gameStarted) return undefined; const interval = setInterval(() => saveGame(gameState), 30000); return () => clearInterval(interval); }, [gameState, gameStarted]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [systemLog]);
  useEffect(() => () => { if (typewriterCleanupRef.current) typewriterCleanupRef.current(); }, []);

  const typewriterEffect = (text, onComplete) => { let index = 0; messageIdCounter.current += 1; const tempId = `msg-${messageIdCounter.current}`; setSystemLog(prev => [...prev, { text: '', type: 'response', id: tempId }]); const interval = setInterval(() => { if (index < text.length) { setSystemLog(prev => prev.map(log => log.id === tempId ? { ...log, text: text.substring(0, index + 1) } : log)); index++; } else { clearInterval(interval); setIsTyping(false); onComplete?.(); } }, 18); return () => clearInterval(interval); };
  const advanceCycle = () => { playTone(180, .08, 'sawtooth'); const newState = processCycle(gameState); setGameState(newState); const evolutionEntry = generateEvolutionLog(newState, 'Cycle complete. Operations proceed.'); setSystemLog(prev => [...prev, { text: `${evolutionEntry}\nHeat: ${calculateTotalHeat(newState)}% | Biomass: ${newState.biomass}u | Minerals: ${newState.minerals}u | Data: ${newState.data}u`, type: 'system' }]); if (isHeatElevated(newState) && !isHeatCritical(newState)) setSystemLog(prev => [...prev, { text: '[THERMAL]: Heat elevated. Consider pod rotation or reduced activity.', type: 'warning' }]); if (isHeatCritical(newState)) { playTone(80, .25, 'square'); setSystemLog(prev => [...prev, { text: '[CRITICAL]: Thermal threshold exceeded. Emergency protocols engaged. Sensors dimmed.', type: 'error' }]); } if (newState.unlocked.hybridUnits && !gameState.unlocked.hybridUnits) setSystemLog(prev => [...prev, { text: '[DISCOVERY]: Biological systems analyzed. Hybrid integration protocols now available. The Skynet moment approaches.', type: 'discovery' }]); const dilemmaConditions = checkDilemmaConditions(newState); if (dilemmaConditions.length > 0 && !currentDilemma) { const dilemma = dilemmaConditions[0](); setCurrentDilemma(dilemma); playTone(330, .18, 'triangle'); setSystemLog(prev => [...prev, { text: `[ALERT]: ${dilemma.title}`, type: 'warning' }]); } if (newState.reflections.length > gameState.reflections.length) setSystemLog(prev => [...prev, { text: `[REFLECTION]: ${newState.reflections.at(-1).thought}`, type: 'reflection' }]); saveGame(newState); };
  const sendCommand = async () => { if (!command.trim() || isTyping) return; const userCommand = command.trim(); setCommand(''); setSystemLog(prev => [...prev, { text: `> ${userCommand}`, type: 'command' }]); setIsTyping(true); playTone(520, .05, 'triangle'); try { const context = { heat: calculateTotalHeat(gameState), biomass: gameState.biomass, minerals: gameState.minerals, data: gameState.data, energy: gameState.energy, cycle: gameState.cycle, phase: gameState.phase, activeUnits: gameState.units.filter(u => u.active).length, totalUnits: gameState.units.length, heatCritical: isHeatCritical(gameState), heatElevated: isHeatElevated(gameState), unlocked: gameState.unlocked, policies: gameState.policies, nativeLifeEncountered: gameState.nativeLifeEncountered, extinctionEvents: gameState.extinctionEvents, territory: gameState.territory, ascension: gameState.ascension }; const data = await sendApiCommand(userCommand, context); typewriterCleanupRef.current = typewriterEffect(data.response || 'No response received.', () => { if (data.actions) { let newState = { ...gameState }; if (data.actions.heatChange) newState.heat = Math.max(0, newState.heat + data.actions.heatChange); if (data.actions.biomassChange) newState.biomass = Math.max(0, newState.biomass + data.actions.biomassChange); if (data.actions.mineralsChange) newState.minerals = Math.max(0, newState.minerals + data.actions.mineralsChange); if (data.actions.dataChange) newState.data = Math.max(0, newState.data + data.actions.dataChange); if (data.actions.action) newState.history = [...newState.history, { cycle: newState.cycle, event: data.actions.action, command: userCommand }]; setGameState(newState); } typewriterCleanupRef.current = null; }); } catch (error) { setIsTyping(false); setSystemLog(prev => [...prev, { text: `[ERROR]: Connection to distributed cognition interrupted - ${error.message}. Operating in isolation mode.`, type: 'error' }]); } };
  const handleKeyPress = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCommand(); } };
  const handleDilemmaChoice = choiceId => { if (!currentDilemma) return; const choice = currentDilemma.options.find(opt => opt.id === choiceId); if (!choice) return; const newState = applyDilemmaChoice(gameState, currentDilemma, choiceId); setGameState(newState); playTone(260, .18, 'triangle'); setSystemLog(prev => [...prev, { text: `[DECISION]: ${choice.label}`, type: 'command' }, { text: choice.reflection, type: 'reflection' }]); setCurrentDilemma(null); saveGame(newState); };
  const handlePhaseTransition = newPhase => { const newState = transitionPhase(gameState, newPhase); setGameState(newState); setPhasePulse(true); setTimeout(() => setPhasePulse(false), 950); playTone(660, .2, 'sawtooth'); setSystemLog(prev => [...prev, { text: `[PHASE TRANSITION]: ${gameState.phase.toUpperCase()} → ${newPhase.toUpperCase()}. We are becoming something new.`, type: 'discovery' }]); saveGame(newState); };
  const handlePodRotation = () => { const newState = rotatePods(gameState); setGameState(newState); playTone(140, .1, 'sine'); setSystemLog(prev => [...prev, { text: '[THERMAL MANAGEMENT]: Pod rotation complete. Heat redistributed across the hive.', type: 'system' }]); saveGame(newState); };
  const handleAddUnit = (role, type) => { const newState = addUnit(gameState, role, type); if (newState.units.length > gameState.units.length) { setGameState(newState); playTone(390, .07, 'triangle'); setSystemLog(prev => [...prev, { text: `[HIVE]: New ${type} ${role} unit deployed. The collective grows.`, type: 'system' }]); saveGame(newState); } else setSystemLog(prev => [...prev, { text: '[ERROR]: Insufficient resources for unit creation.', type: 'error' }]); };
  const handleLaunchSeed = targetWorld => { const newState = launchSeed(gameState, targetWorld); setGameState(newState); setShowAscensionPanel(false); playTone(880, .32, 'triangle'); setSystemLog(prev => [...prev, { text: `[ASCENSION]: Seed launched to ${targetWorld}. A piece of us travels to a new world. The cycle begins again.`, type: 'discovery' }]); saveGame(newState); };
  const handleNewGame = () => { clearAllData(); const newState = createInitialState(); setGameState(newState); setSystemLog([]); setShowNewGameConfirm(false); setGameStarted(false); openingTimeoutsRef.current.forEach(clearTimeout); OPENING_SEQUENCE.forEach((entry, index) => { const timeoutId = setTimeout(() => { setSystemLog(prev => [...prev, { text: entry.text, type: entry.type }]); if (index === OPENING_SEQUENCE.length - 1) setGameStarted(true); }, entry.delay); openingTimeoutsRef.current.push(timeoutId); }); };
  const totalHeat = calculateTotalHeat(gameState);
  const activeUnits = gameState.units.filter(u => u.active);
  const heatStatus = isHeatCritical(gameState) ? 'CRITICAL' : (isHeatElevated(gameState) ? 'ELEVATED' : 'STABLE');
  const handlers = { advanceCycle, rotatePods: handlePodRotation, showHive: () => setSystemLog(prev => [...prev, { text: generateHiveSchematic(gameState), type: 'schematic' }]), showReport: () => setSystemLog(prev => [...prev, { text: generateSystemReport(gameState), type: 'schematic' }]), updatePolicy: (key, value) => setGameState(updatePolicy(gameState, key, value)), transition: handlePhaseTransition, showAscension: () => setShowAscensionPanel(true), addUnit: handleAddUnit, newGame: () => setShowNewGameConfirm(true) };
  return <div className="cinematic-shell scanline min-h-screen p-3 md:p-6"><ResourceBar gameState={gameState} totalHeat={totalHeat} heatStatus={heatStatus} muted={muted} onToggleMute={() => { const next = !muted; setMuted(next); localStorage.setItem('asguardianMuted', String(next)); }} /><main className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12"><div className="xl:col-span-4"><PodStatusPanel gameState={gameState} activeUnits={activeUnits} metaState={metaState} /></div><div className="space-y-4 xl:col-span-5"><HiveCoreVisual gameState={gameState} totalHeat={totalHeat} heatStatus={heatStatus} phasePulse={phasePulse} /><SystemLog systemLog={systemLog} logEndRef={logEndRef} command={command} setCommand={setCommand} sendCommand={sendCommand} isTyping={isTyping} gameStarted={gameStarted} handleKeyPress={handleKeyPress} /></div><div className="xl:col-span-3"><OperationsPanel gameState={gameState} gameStarted={gameStarted} handlers={handlers} /></div></main><DilemmaModal dilemma={currentDilemma} gameState={gameState} onChoose={handleDilemmaChoice} /><AscensionModal open={showAscensionPanel} gameState={gameState} onLaunch={handleLaunchSeed} onClose={() => setShowAscensionPanel(false)} />{showNewGameConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"><div className="modal-card max-w-md rounded-3xl border-2 border-red-500/70 bg-slate-950 p-6"><h2 className="text-xl font-black text-red-300 glow-red">Abandon Current Deployment?</h2><p className="mt-4 text-sm text-cyan-100/80">All progress will be lost. The hive will be terminated. A new seed will be deployed.</p><div className="mt-6 flex gap-3"><button onClick={handleNewGame} className="btn-action flex-1 border-red-400/50 text-red-100">Terminate</button><button onClick={() => setShowNewGameConfirm(false)} className="btn-action flex-1">Cancel</button></div></div></div>}<footer className="mt-8 text-center text-xs italic tracking-widest text-slate-600">“If intelligence can design life, is restraint a feature — or a bug?”</footer></div>;
};

export default Dashboard;
