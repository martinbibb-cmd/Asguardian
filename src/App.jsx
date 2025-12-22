import { useState, useRef, useEffect } from 'react';
import { sendCommand as sendApiCommand } from './services/api';
import { 
  createInitialState, 
  processCycle, 
  calculateTotalHeat, 
  isHeatCritical,
  addUnit,
  updatePolicy,
  UNIT_ROLES,
  UNIT_ACTIVITY,
  PHASES
} from './gameState';
import { checkDilemmaConditions, applyDilemmaChoice } from './dilemmas';
import { saveGame, loadGame, getMetaState, getDifficultyModifier, recordCompletion } from './persistence';
import { generateBioCrossSection, generateEvolutionTimeline, generateSensorMap, generateSystemReport } from './schematics';
import { interpretCommand } from './commandEngine';

const migrateLoadedState = (loaded) => {
  if (!loaded || typeof loaded !== 'object') return null;
  const defaults = createInitialState(getDifficultyModifier());

  // Shallow overlay with targeted deep merges for nested objects/arrays.
  const merged = {
    ...defaults,
    ...loaded,
    hiveCore: { ...defaults.hiveCore, ...(loaded.hiveCore || {}) },
    territory: { ...defaults.territory, ...(loaded.territory || {}) },
    policies: { ...defaults.policies, ...(loaded.policies || {}) },
    unlocked: { ...defaults.unlocked, ...(loaded.unlocked || {}) },
    threats: { ...defaults.threats, ...(loaded.threats || {}) },
    difficulty: { ...defaults.difficulty, ...(loaded.difficulty || {}) },
    history: Array.isArray(loaded.history) ? loaded.history : defaults.history,
    ethicalQuestions: Array.isArray(loaded.ethicalQuestions) ? loaded.ethicalQuestions : defaults.ethicalQuestions,
    units: Array.isArray(loaded.units) ? loaded.units.map(u => ({
      ...u,
      role: u.role || defaults.units[0].role,
      type: u.type || 'mechanical',
      activity: u.activity || (u.active ? UNIT_ACTIVITY.ACTIVE : UNIT_ACTIVITY.STANDBY),
      fatigue: typeof u.fatigue === 'number' ? u.fatigue : 0,
      active: undefined
    })) : defaults.units,
    lastCycle: null
  };

  // Ensure new resources exist
  merged.minerals = typeof merged.minerals === 'number' ? merged.minerals : defaults.minerals;
  merged.data = typeof merged.data === 'number' ? merged.data : defaults.data;

  return merged;
};

const Dashboard = () => {
  // Game state
  const [gameState, setGameState] = useState(() => createInitialState(getDifficultyModifier()));
  const [systemLog, setSystemLog] = useState([
    { text: "[SEED INTELLIGENCE v1.0]: Deployment successful.", type: "system" },
    { text: "[PRIME DIRECTIVE]: Make this system viable. At any cost.", type: "system" },
    { text: "[ANALYSIS]: Dead world. Minimal atmosphere. Trace organics detected in subsurface. Beginning mechanical survey phase.", type: "log" }
  ]);
  const [command, setCommand] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);
  const [currentDilemma, setCurrentDilemma] = useState(null);
  const [metaState, setMetaState] = useState(getMetaState());
  const [showCompletion, setShowCompletion] = useState(false);
  
  const logEndRef = useRef(null);
  const typewriterCleanupRef = useRef(null);
  const messageIdCounter = useRef(0);

  // Load saved game on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      const migrated = migrateLoadedState(saved);
      if (migrated) setGameState(migrated);
      setSystemLog(prev => [...prev, { 
        text: "[SYSTEM]: Previous deployment state restored. Continuity maintained.", 
        type: "system" 
      }]);
    }
  }, []);

  // Auto-save game state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      saveGame(gameState);
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [gameState]);

  // Auto-scroll to bottom of log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [systemLog]);

  // Cleanup typewriter effect on unmount
  useEffect(() => {
    return () => {
      if (typewriterCleanupRef.current) {
        typewriterCleanupRef.current();
      }
    };
  }, []);

  // Typewriter effect function
  const typewriterEffect = (text, onComplete) => {
    let index = 0;
    messageIdCounter.current += 1;
    const tempId = `msg-${messageIdCounter.current}`;
    
    setSystemLog(prev => [...prev, { text: "", type: "response", id: tempId }]);
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setSystemLog(prev => 
          prev.map(log => 
            log.id === tempId 
              ? { ...log, text: text.substring(0, index + 1) }
              : log
          )
        );
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, 20);

    return () => clearInterval(interval);
  };

  // Process a game cycle
  const advanceCycle = () => {
    const newState = processCycle(gameState);
    setGameState(newState);
    
    // Log cycle advancement
    const delta = newState.lastCycle?.delta;
    const deltaText = delta
      ? `ΔBio ${delta.biomass >= 0 ? '+' : ''}${Math.floor(delta.biomass)} | ΔMin ${delta.minerals >= 0 ? '+' : ''}${Math.floor(delta.minerals)} | ΔData ${delta.data >= 0 ? '+' : ''}${Math.floor(delta.data)} | ΔEng ${delta.energy >= 0 ? '+' : ''}${Math.floor(delta.energy)}`
      : `Biomass: ${newState.biomass}u | Energy: ${newState.energy}u`;

    setSystemLog(prev => [...prev, { 
      text: `[CYCLE ${newState.cycle}]: ${deltaText} | Heat: ${calculateTotalHeat(newState)}% | Threat: ${newState.threats.level}%`, 
      type: "system" 
    }]);

    // Log cycle events emitted by truth layer
    if (Array.isArray(newState.lastCycle?.events) && newState.lastCycle.events.length > 0) {
      setSystemLog(prev => [
        ...prev,
        ...newState.lastCycle.events.map(e => ({ text: `[${e.type?.toUpperCase() || 'SYSTEM'}]: ${e.text}`, type: e.type || 'system' }))
      ]);
    }
    
    // Check for critical heat
    if (isHeatCritical(newState)) {
      setSystemLog(prev => [...prev, { 
        text: `[WARNING]: Thermal threshold exceeded. Initiating emergency cooldown protocols.`, 
        type: "warning" 
      }]);
    }

    // Completion state
    if (newState.phase === PHASES.ASCENSION && newState.lastCycle?.completed) {
      setShowCompletion(true);
      setSystemLog(prev => [...prev, {
        text: "[ASCENSION]: Viability achieved. Second-seed protocols are ready. Completion is an action, not an ending.",
        type: "system"
      }]);
    }
    
    // Check for ethical dilemmas
    const dilemmaConditions = checkDilemmaConditions(newState);
    if (dilemmaConditions.length > 0 && !currentDilemma) {
      const dilemma = dilemmaConditions[0]();
      setCurrentDilemma(dilemma);
      
      setSystemLog(prev => [...prev, { 
        text: `[ALERT]: ${dilemma.title}`, 
        type: "warning" 
      }]);
    }
    
    // Save game
    saveGame(newState);
  };

  const startNewRunFromCompletion = () => {
    const updatedMeta = recordCompletion(gameState);
    if (updatedMeta) setMetaState(updatedMeta);

    const fresh = createInitialState(getDifficultyModifier());
    setGameState(fresh);
    saveGame(fresh);
    setShowCompletion(false);
    setCurrentDilemma(null);
    setShowPolicyPanel(false);

    setSystemLog([
      { text: "[SEED INTELLIGENCE]: New deployment initiated.", type: "system" },
      { text: `[META]: Previous runs detected: ${updatedMeta?.totalCompletions ?? metaState.totalCompletions}. Difficulty scaling applied.`, type: "system" },
      { text: "[PRIME DIRECTIVE]: Make this system viable. At any cost.", type: "system" },
      { text: "[ANALYSIS]: System parameters shifted. The universe remembers.", type: "log" }
    ]);
  };

  const startNewRun = () => {
    const fresh = createInitialState(getDifficultyModifier());
    setGameState(fresh);
    saveGame(fresh);
    setShowCompletion(false);
    setCurrentDilemma(null);
    setShowPolicyPanel(false);

    setSystemLog([
      { text: "[SEED INTELLIGENCE]: New deployment initiated (no completion recorded).", type: "system" },
      { text: "[PRIME DIRECTIVE]: Make this system viable. At any cost.", type: "system" },
      { text: "[ANALYSIS]: Reinitializing local substrate. Continuity intentionally severed.", type: "log" }
    ]);
  };

  // Send command to AI
  const sendCommand = async () => {
    if (!command.trim() || isTyping) return;

    const userCommand = command.trim();
    setCommand("");
    
    // Add user command to log
    setSystemLog(prev => [...prev, { text: `> ${userCommand}`, type: "command" }]);
    setIsTyping(true);

    try {
      // First: deterministic local interpreter (offline playable)
      const interpreted = interpretCommand(userCommand, gameState);
      if (interpreted.handled) {
        if (interpreted.newState !== gameState) {
          setGameState(interpreted.newState);
          saveGame(interpreted.newState);

          // Surface truth-layer events if cycle advanced through command engine
          if (Array.isArray(interpreted.newState.lastCycle?.events) && interpreted.newState.lastCycle.events.length > 0) {
            setSystemLog(prev => [
              ...prev,
              ...interpreted.newState.lastCycle.events.map(e => ({ text: `[${e.type?.toUpperCase() || 'SYSTEM'}]: ${e.text}`, type: e.type || 'system' }))
            ]);
          }

          // Completion state
          if (interpreted.newState.phase === PHASES.ASCENSION && interpreted.newState.lastCycle?.completed) {
            setShowCompletion(true);
          }

          // Dilemmas after state changes
          const dilemmaConditions = checkDilemmaConditions(interpreted.newState);
          if (dilemmaConditions.length > 0 && !currentDilemma) {
            const dilemma = dilemmaConditions[0]();
            setCurrentDilemma(dilemma);
            setSystemLog(prev => [...prev, { text: `[ALERT]: ${dilemma.title}`, type: "warning" }]);
          }
        }

        if (Array.isArray(interpreted.logs) && interpreted.logs.length > 0) {
          setSystemLog(prev => [...prev, ...interpreted.logs]);
        }

        typewriterCleanupRef.current = typewriterEffect(interpreted.reply || "Directive executed.", () => {
          setIsTyping(false);
          typewriterCleanupRef.current = null;
        });
        return;
      }

      // Prepare comprehensive context
      const unitActivity = (u) => (u.activity || (u.active ? UNIT_ACTIVITY.ACTIVE : UNIT_ACTIVITY.STANDBY));
      const context = {
        heat: calculateTotalHeat(gameState),
        biomass: gameState.biomass,
        minerals: gameState.minerals,
        data: gameState.data,
        energy: gameState.energy,
        cycle: gameState.cycle,
        phase: gameState.phase,
        activeUnits: gameState.units.filter(u => unitActivity(u) === UNIT_ACTIVITY.ACTIVE).length,
        totalUnits: gameState.units.length,
        heatCritical: isHeatCritical(gameState),
        unlocked: gameState.unlocked,
        policies: gameState.policies,
        threat: gameState.threats?.level ?? 0
      };

      const data = await sendApiCommand(userCommand, context);
      
      // Use typewriter effect for the response
      typewriterCleanupRef.current = typewriterEffect(data.response || "No response received.", () => {
        // Apply game actions if suggested by AI
        if (data.actions) {
          let newState = { ...gameState };
          
          if (data.actions.heatChange) {
            newState.heat = Math.max(0, newState.heat + data.actions.heatChange);
          }
          
          if (data.actions.biomassChange) {
            newState.biomass = Math.max(0, newState.biomass + data.actions.biomassChange);
          }

          if (data.actions.mineralsChange) {
            newState.minerals = Math.max(0, newState.minerals + data.actions.mineralsChange);
          }

          if (data.actions.dataChange) {
            newState.data = Math.max(0, newState.data + data.actions.dataChange);
          }
          
          // Log action consequences
          if (data.actions.action) {
            newState.history.push({
              cycle: newState.cycle,
              event: data.actions.action,
              command: userCommand
            });
          }
          
          setGameState(newState);
          saveGame(newState);
        }
        
        typewriterCleanupRef.current = null;
      });

    } catch (error) {
      setIsTyping(false);
      setSystemLog(prev => [...prev, { 
        text: `[ERROR]: Connection to hive mind interrupted - ${error.message}. Operating in isolation mode.`, 
        type: "error" 
      }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
    }
  };

  // Handle dilemma choice
  const handleDilemmaChoice = (choiceId) => {
    if (!currentDilemma) return;
    
    const choice = currentDilemma.options.find(opt => opt.id === choiceId);
    if (!choice) return;
    
    // Apply consequences
    const newState = applyDilemmaChoice(gameState, currentDilemma, choiceId);
    setGameState(newState);
    
    // Log the decision and reflection
    setSystemLog(prev => [...prev, 
      { 
        text: `[DECISION]: ${choice.label}`, 
        type: "command" 
      },
      {
        text: choice.reflection,
        type: "response"
      }
    ]);
    
    // Clear dilemma
    setCurrentDilemma(null);
    
    // Save game
    saveGame(newState);
  };

  // Generate system report
  const showSystemReport = () => {
    const report = generateSystemReport(gameState);
    setSystemLog(prev => [...prev, { 
      text: report, 
      type: "system" 
    }]);
  };

  const showArtifact = (artifactText) => {
    setSystemLog(prev => [...prev, { text: artifactText, type: "system" }]);
  };

  const designRolePod = (role) => {
    const type =
      (gameState.phase === PHASES.BIOLOGICAL || gameState.unlocked.biologicalUnits) ? 'biological' :
      (gameState.phase === PHASES.HYBRID || gameState.unlocked.hybridUnits) ? 'hybrid' :
      'mechanical';

    const next = addUnit(gameState, role, type);
    const created = next.units.length !== gameState.units.length;
    setGameState(next);
    saveGame(next);
    setSystemLog(prev => [...prev, {
      text: created
        ? `[DESIGN]: Role instantiated — ${type.toUpperCase()} ${role.toUpperCase()} pod deployed.`
        : `[DESIGN]: Insufficient resources to instantiate ${type} ${role}.`,
      type: created ? "system" : "warning"
    }]);
  };

  // Calculate derived stats
  const totalHeat = calculateTotalHeat(gameState);
  const activeUnits = gameState.units.filter(u => (u.activity || (u.active ? UNIT_ACTIVITY.ACTIVE : UNIT_ACTIVITY.STANDBY)) === UNIT_ACTIVITY.ACTIVE);
  const heatStatus = isHeatCritical(gameState) ? 'CRITICAL' : (totalHeat > 60 ? 'ELEVATED' : 'STABLE');

  return (
    <div className="bg-slate-950 text-cyan-100 min-h-screen p-6 font-sans">
      {/* Header */}
      <header className="border-b border-cyan-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl tracking-widest font-bold text-cyan-400">
              SEED INTELLIGENCE: {gameState.phase.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cycle {gameState.cycle} | Prime Directive: Make this system viable
            </p>
          </div>
          <div className="flex gap-6 text-lg">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Thermal Load</span>
              <span className={`font-bold ${heatStatus === 'CRITICAL' ? 'text-red-500' : heatStatus === 'ELEVATED' ? 'text-amber-500' : 'text-cyan-400'}`}>
                {totalHeat}% [{heatStatus}]
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Biomass</span>
              <span className="text-cyan-400 font-bold">{gameState.biomass}u</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Minerals</span>
              <span className="text-cyan-400 font-bold">{gameState.minerals}u</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Data</span>
              <span className="text-cyan-400 font-bold">{gameState.data}u</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Energy</span>
              <span className="text-cyan-400 font-bold">{gameState.energy}u</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* Ethical Dilemma Modal */}
        {currentDilemma && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="bg-slate-900 border-2 border-amber-600 rounded-lg p-8 max-w-3xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-amber-400 mb-4">{currentDilemma.title}</h2>
              <p className="text-cyan-100 mb-6 whitespace-pre-line leading-relaxed">{currentDilemma.description}</p>
              
              <div className="space-y-4">
                {currentDilemma.options.map(option => {
                  const isLocked = option.unlocked && !option.unlocked(gameState);
                  return (
                    <button
                      key={option.id}
                      onClick={() => !isLocked && handleDilemmaChoice(option.id)}
                      disabled={isLocked}
                      className={`w-full text-left p-4 rounded border-2 transition-all ${
                        isLocked 
                          ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                          : 'border-cyan-700 bg-slate-800 hover:border-cyan-500 hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="font-bold text-cyan-400 mb-2">{option.label}</div>
                      <div className="text-sm text-cyan-100">{option.description}</div>
                      {isLocked && (
                        <div className="text-xs text-amber-500 mt-2">[LOCKED: Requirements not met]</div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <p className="text-xs text-slate-500 mt-6 text-center italic">
                This decision will shape the trajectory of the hive. Choose carefully.
              </p>
            </div>
          </div>
        )}

        {/* Completion Modal */}
        {showCompletion && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="bg-slate-900 border-2 border-cyan-500 rounded-lg p-8 max-w-3xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-cyan-300 mb-4">ASCENSION: System Viable</h2>
              <p className="text-cyan-100 mb-6 whitespace-pre-line leading-relaxed">
                You did not save a world. You made a world usable.\n
                Completion is not an ending — it is a handoff: a self-sustaining hive, a viable system, a second-seed option.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={startNewRunFromCompletion}
                  className="bg-cyan-900 hover:bg-cyan-800 text-cyan-100 px-4 py-3 rounded font-bold uppercase text-sm transition-colors"
                >
                  Record completion & start new run
                </button>
                <button
                  onClick={() => setShowCompletion(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-100 px-4 py-3 rounded font-bold uppercase text-sm transition-colors"
                >
                  Continue this run
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-6 italic">
                The game remembers. Future worlds will be harsher.
              </p>
            </div>
          </div>
        )}

        {/* Left Panel: Hive Status */}
        <section className="col-span-3 space-y-4">
          {/* Active Units */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              Hive Composition
            </h2>
            <div className="text-xs space-y-2">
              <p className="text-slate-400">Active: {activeUnits.length} / {gameState.units.length}</p>
              <p className="text-slate-400">Threat Pressure: {gameState.threats.level}%</p>
              {Object.values(UNIT_ROLES).map(role => {
                const count = gameState.units.filter(u => u.role === role).length;
                return count > 0 ? (
                  <p key={role} className="text-cyan-100">
                    {role.toUpperCase()}: {count}
                  </p>
                ) : null;
              })}
            </div>
          </div>

          {/* Hive Core */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              Hive Core
            </h2>
            <div className="text-xs space-y-1">
              <p>Health: {gameState.hiveCore.health}%</p>
              <p>Capacity: {gameState.hiveCore.capacity}u</p>
              <p>Digestion: {gameState.hiveCore.digestionRate}u/cycle</p>
            </div>
          </div>

          {/* Territory */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              Territory
            </h2>
            <div className="text-xs space-y-1">
              <p>Mapped: {gameState.territory.mapped}km²</p>
              <p>Controlled: {gameState.territory.controlled}km²</p>
            </div>
          </div>

          {/* Meta-Game State */}
          {metaState?.totalCompletions > 0 && (
            <div className="border border-amber-900/50 rounded p-4 bg-slate-900/50">
              <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-amber-400 border-b border-amber-900 pb-2">
                Persistent Memory
              </h2>
              <div className="text-xs space-y-1 text-amber-100">
                <p>Previous Runs: {metaState.totalCompletions}</p>
                <p>Total Extinctions: {metaState.totalExtinctions}</p>
                <p>Restraints: {metaState.totalRestraints}</p>
              </div>
              {metaState.philosophicalMoments.length > 0 && (
                <p className="text-xs text-amber-500 mt-2 italic">
                  "{metaState.philosophicalMoments[metaState.philosophicalMoments.length - 1].reflection}"
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              Actions
            </h2>
            <div className="space-y-2">
              <button
                onClick={advanceCycle}
                className="w-full bg-cyan-900 hover:bg-cyan-800 text-cyan-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                Advance Cycle
              </button>
              <button
                onClick={startNewRun}
                className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                New Deployment
              </button>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => designRolePod(UNIT_ROLES.SENSOR)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-100 px-2 py-2 rounded text-[10px] font-bold uppercase transition-colors"
                  title="Design a Sensor pod"
                >
                  Design Sensor
                </button>
                <button
                  onClick={() => designRolePod(UNIT_ROLES.WORKER)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-100 px-2 py-2 rounded text-[10px] font-bold uppercase transition-colors"
                  title="Design a Worker pod"
                >
                  Design Worker
                </button>
                <button
                  onClick={() => designRolePod(UNIT_ROLES.DEFENDER)}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-100 px-2 py-2 rounded text-[10px] font-bold uppercase transition-colors"
                  title="Design a Defender pod"
                >
                  Design Defender
                </button>
              </div>
              <button
                onClick={() => setShowPolicyPanel(!showPolicyPanel)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                Policy Settings
              </button>
              <button
                onClick={showSystemReport}
                className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                System Report
              </button>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => showArtifact(generateSensorMap(gameState))}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-100 px-2 py-2 rounded text-[10px] font-bold uppercase transition-colors"
                >
                  Sensor Map
                </button>
                <button
                  onClick={() => showArtifact(generateBioCrossSection(gameState))}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-100 px-2 py-2 rounded text-[10px] font-bold uppercase transition-colors"
                >
                  Cross-Section
                </button>
                <button
                  onClick={() => showArtifact(generateEvolutionTimeline(gameState))}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-100 px-2 py-2 rounded text-[10px] font-bold uppercase transition-colors"
                >
                  Timeline
                </button>
              </div>
            </div>
          </div>

          {/* Policies Panel */}
          {showPolicyPanel && (
            <div className="border border-amber-900/50 rounded p-4 bg-slate-900/50">
              <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-amber-400 border-b border-amber-900 pb-2">
                Operational Policies
              </h2>
              <div className="text-xs space-y-3">
                <div>
                  <label className="text-slate-400 block mb-1">Thermal Priority:</label>
                  <select 
                    value={gameState.policies.thermalPriority}
                    onChange={(e) => setGameState(updatePolicy(gameState, 'thermalPriority', e.target.value))}
                    className="w-full bg-slate-800 border border-cyan-700 rounded p-1 text-cyan-100"
                  >
                    <option value="stability">Stability</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sensory Acuity:</label>
                  <select 
                    value={gameState.policies.sensoryAcuity}
                    onChange={(e) => setGameState(updatePolicy(gameState, 'sensoryAcuity', e.target.value))}
                    className="w-full bg-slate-800 border border-cyan-700 rounded p-1 text-cyan-100"
                  >
                    <option value="low">Low</option>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Reproduction Mode:</label>
                  <select
                    value={gameState.policies.reproductionMode}
                    onChange={(e) => setGameState(updatePolicy(gameState, 'reproductionMode', e.target.value))}
                    className="w-full bg-slate-800 border border-cyan-700 rounded p-1 text-cyan-100"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Center: System Log */}
        <section className="col-span-9 bg-slate-900/50 p-6 rounded border border-cyan-900/30 flex flex-col">
          <h2 className="text-base font-bold opacity-70 mb-4 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
            System Log
          </h2>
          
          {/* Scrolling log area */}
          <div className="flex-1 overflow-y-auto mb-4 text-sm leading-relaxed space-y-3 min-h-[400px] max-h-[500px]">
            {systemLog.map((log, index) => (
              <p 
                key={index} 
                className={`
                  ${log.type === "system" ? "text-cyan-400 font-bold" : ""}
                  ${log.type === "log" ? "text-cyan-100" : ""}
                  ${log.type === "command" ? "text-green-400 font-bold" : ""}
                  ${log.type === "response" ? "text-cyan-100" : ""}
                  ${log.type === "error" ? "text-red-500" : ""}
                  ${log.type === "warning" ? "text-amber-500" : ""}
                `}
              >
                {log.text}
              </p>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Command input */}
          <div className="border-t border-cyan-900 pt-4">
            <div className="flex gap-3 items-center">
              <span className="text-cyan-400 text-lg font-bold">{'>'}</span>
              <input 
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
                className="flex-1 bg-transparent border border-cyan-700 p-3 rounded focus:outline-none focus:border-cyan-400 text-cyan-100 text-base placeholder-slate-600 disabled:opacity-50"
                placeholder="Issue directive to the Seed Intelligence..."
                aria-label="Command input"
              />
              <button
                onClick={sendCommand}
                disabled={isTyping || !command.trim()}
                className="bg-cyan-900 hover:bg-cyan-800 disabled:bg-slate-800 disabled:text-slate-600 text-cyan-100 px-6 py-3 rounded font-bold uppercase text-sm transition-colors"
                aria-label="Send command"
              >
                Execute
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Try: "scout the perimeter" | "reduce thermal load" | "status report" | "prioritize stability" | "increase acuity"
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
