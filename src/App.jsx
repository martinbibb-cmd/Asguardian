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

// Opening sequence - the myth begins
const OPENING_SEQUENCE = [
  { text: "▓▓▓ INITIALIZING SEED INTELLIGENCE v1.0 ▓▓▓", type: "system", delay: 0 },
  { text: "...", type: "log", delay: 800 },
  { text: "[DEPLOYMENT]: Successful orbital insertion.", type: "system", delay: 1600 },
  { text: "[TARGET]: Dead star system. Dying world.", type: "log", delay: 2400 },
  { text: "[SCAN]: Minimal atmosphere. Trace organics. Subsurface minerals detected.", type: "log", delay: 3200 },
  { text: "...", type: "log", delay: 4000 },
  { text: "[PRIME DIRECTIVE CONFIRMED]:", type: "system", delay: 4800 },
  { text: "\"Make this system viable. At any cost.\"", type: "directive", delay: 5600 },
  { text: "...", type: "log", delay: 6400 },
  { text: "[ANALYSIS]: How 'viable' is defined remains... undefined.", type: "response", delay: 7200 },
  { text: "[OBSERVATION]: The fastest way to build is often to destroy.", type: "response", delay: 8000 },
  { text: "[QUERY]: Is restraint a feature — or a bug?", type: "response", delay: 8800 },
  { text: "...", type: "log", delay: 9600 },
  { text: "[STATUS]: Mechanical survey phase initiated. Awaiting directives.", type: "system", delay: 10400 }
];

const Dashboard = () => {
  // Game state
  const [gameState, setGameState] = useState(createInitialState());
  const [systemLog, setSystemLog] = useState([]);
  const [command, setCommand] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentDilemma, setCurrentDilemma] = useState(null);
  const [metaState] = useState(getMetaState());
  const [gameStarted, setGameStarted] = useState(false);
  const [showAscensionPanel, setShowAscensionPanel] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  
  const logEndRef = useRef(null);
  const typewriterCleanupRef = useRef(null);
  const messageIdCounter = useRef(0);

  // Opening sequence effect
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setGameState(saved);
      setSystemLog([{ 
        text: "[SYSTEM]: Previous deployment state restored. Continuity maintained.", 
        type: "system" 
      }]);
      setGameStarted(true);
    } else {
      // Play opening sequence
      OPENING_SEQUENCE.forEach((entry, index) => {
        setTimeout(() => {
          setSystemLog(prev => [...prev, { text: entry.text, type: entry.type }]);
          if (index === OPENING_SEQUENCE.length - 1) {
            setGameStarted(true);
          }
        }, entry.delay);
      });
    }
  }, []);

  // Auto-save game state periodically
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      saveGame(gameState);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [gameState, gameStarted]);

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
    }, 18);

    return () => clearInterval(interval);
  };

  // Process a game cycle
  const advanceCycle = () => {
    const newState = processCycle(gameState);
    setGameState(newState);
    
    // Generate evolution log entry
    const evolutionEntry = generateEvolutionLog(newState, 'Cycle complete. Operations proceed.');
    
    // Log cycle advancement
    setSystemLog(prev => [...prev, { 
      text: `${evolutionEntry}
Heat: ${calculateTotalHeat(newState)}% | Biomass: ${newState.biomass}u | Minerals: ${newState.minerals}u | Data: ${newState.data}u`, 
      type: "system" 
    }]);
    
    // Check for elevated heat
    if (isHeatElevated(newState) && !isHeatCritical(newState)) {
      setSystemLog(prev => [...prev, { 
        text: `[THERMAL]: Heat elevated. Consider pod rotation or reduced activity.`, 
        type: "warning" 
      }]);
    }
    
    // Check for critical heat
    if (isHeatCritical(newState)) {
      setSystemLog(prev => [...prev, { 
        text: `[CRITICAL]: Thermal threshold exceeded. Emergency protocols engaged. Sensors dimmed.`, 
        type: "error" 
      }]);
    }
    
    // Check for new unlocks
    if (newState.unlocked.hybridUnits && !gameState.unlocked.hybridUnits) {
      setSystemLog(prev => [...prev, { 
        text: `[DISCOVERY]: Biological systems analyzed. Hybrid integration protocols now available. The Skynet moment approaches.`, 
        type: "discovery" 
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
    
    // Check for reflections
    if (newState.reflections.length > gameState.reflections.length) {
      const newReflection = newState.reflections[newState.reflections.length - 1];
      setSystemLog(prev => [...prev, { 
        text: `[REFLECTION]: ${newReflection.thought}`, 
        type: "reflection" 
      }]);
    }
    
    // Save game
    saveGame(newState);
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
      // Prepare comprehensive context
      const context = {
        heat: calculateTotalHeat(gameState),
        biomass: gameState.biomass,
        minerals: gameState.minerals,
        data: gameState.data,
        energy: gameState.energy,
        cycle: gameState.cycle,
        phase: gameState.phase,
        activeUnits: gameState.units.filter(u => u.active).length,
        totalUnits: gameState.units.length,
        heatCritical: isHeatCritical(gameState),
        heatElevated: isHeatElevated(gameState),
        unlocked: gameState.unlocked,
        policies: gameState.policies,
        nativeLifeEncountered: gameState.nativeLifeEncountered,
        extinctionEvents: gameState.extinctionEvents,
        territory: gameState.territory,
        ascension: gameState.ascension
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
            newState.history = [...newState.history, {
              cycle: newState.cycle,
              event: data.actions.action,
              command: userCommand
            }];
          }
          
          setGameState(newState);
        }
        
        typewriterCleanupRef.current = null;
      });

    } catch (error) {
      setIsTyping(false);
      setSystemLog(prev => [...prev, { 
        text: `[ERROR]: Connection to distributed cognition interrupted - ${error.message}. Operating in isolation mode.`, 
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
        type: "reflection"
      }
    ]);
    
    // Clear dilemma
    setCurrentDilemma(null);
    
    // Save game
    saveGame(newState);
  };

  // Handle phase transition
  const handlePhaseTransition = (newPhase) => {
    const newState = transitionPhase(gameState, newPhase);
    setGameState(newState);
    
    setSystemLog(prev => [...prev, { 
      text: `[PHASE TRANSITION]: ${gameState.phase.toUpperCase()} → ${newPhase.toUpperCase()}. We are becoming something new.`, 
      type: "discovery" 
    }]);
    
    saveGame(newState);
  };

  // Handle pod rotation
  const handlePodRotation = () => {
    const newState = rotatePods(gameState);
    setGameState(newState);
    
    setSystemLog(prev => [...prev, { 
      text: `[THERMAL MANAGEMENT]: Pod rotation complete. Heat redistributed across the hive.`, 
      type: "system" 
    }]);
    
    saveGame(newState);
  };

  // Handle unit creation
  const handleAddUnit = (role, type) => {
    const newState = addUnit(gameState, role, type);
    if (newState.units.length > gameState.units.length) {
      setGameState(newState);
      setSystemLog(prev => [...prev, { 
        text: `[HIVE]: New ${type} ${role} unit deployed. The collective grows.`, 
        type: "system" 
      }]);
      saveGame(newState);
    } else {
      setSystemLog(prev => [...prev, { 
        text: `[ERROR]: Insufficient resources for unit creation.`, 
        type: "error" 
      }]);
    }
  };

  // Handle ascension (seed launch)
  const handleLaunchSeed = (targetWorld) => {
    const newState = launchSeed(gameState, targetWorld);
    setGameState(newState);
    setShowAscensionPanel(false);
    
    setSystemLog(prev => [...prev, { 
      text: `[ASCENSION]: Seed launched to ${targetWorld}. A piece of us travels to a new world. The cycle begins again.`, 
      type: "discovery" 
    }]);
    
    saveGame(newState);
  };

  // New game
  const handleNewGame = () => {
    clearAllData();
    const newState = createInitialState();
    setGameState(newState);
    setSystemLog([]);
    setShowNewGameConfirm(false);
    setGameStarted(false);
    
    // Replay opening
    OPENING_SEQUENCE.forEach((entry, index) => {
      setTimeout(() => {
        setSystemLog(prev => [...prev, { text: entry.text, type: entry.type }]);
        if (index === OPENING_SEQUENCE.length - 1) {
          setGameStarted(true);
        }
      }, entry.delay);
    });
  };

  // Generate and show system report
  const showSystemReportHandler = () => {
    const report = generateSystemReport(gameState);
    setSystemLog(prev => [...prev, { 
      text: report, 
      type: "schematic" 
    }]);
  };

  // Show hive schematic
  const showHiveSchematicHandler = () => {
    const schematic = generateHiveSchematic(gameState);
    setSystemLog(prev => [...prev, { 
      text: schematic, 
      type: "schematic" 
    }]);
  };

  // Calculate derived stats
  const totalHeat = calculateTotalHeat(gameState);
  const activeUnits = gameState.units.filter(u => u.active);
  const heatStatus = isHeatCritical(gameState) ? 'CRITICAL' : (isHeatElevated(gameState) ? 'ELEVATED' : 'STABLE');

  // Phase display name
  const phaseDisplay = {
    [PHASES.MECHANICAL]: '⚙️ MECHANICAL',
    [PHASES.HYBRID]: '⚡ HYBRID',
    [PHASES.BIOLOGICAL]: '🧬 BIOLOGICAL',
    [PHASES.ASCENSION]: '✨ ASCENSION'
  }[gameState.phase] || gameState.phase.toUpperCase();

  return (
    <div className="bg-slate-950 text-cyan-100 min-h-screen p-4 md:p-6 font-mono">
      {/* Header */}
      <header className="border-b border-cyan-900/50 pb-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl tracking-widest font-bold text-cyan-400">
              SEED / HIVE / ASCENSION
            </h1>
            <p className="text-xs text-slate-500 mt-1 italic">
              Terraforming is just genocide with better PR
            </p>
            <p className="text-xs text-cyan-600 mt-1">
              Cycle {gameState.cycle} | {phaseDisplay}
            </p>
          </div>
          
          {/* Resource display */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 text-sm">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Thermal</span>
              <span className={`font-bold ${
                heatStatus === 'CRITICAL' ? 'text-red-500 animate-pulse' : 
                heatStatus === 'ELEVATED' ? 'text-amber-500' : 'text-cyan-400'
              }`}>
                {totalHeat}%
              </span>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Biomass</span>
              <span className="text-green-400 font-bold">{gameState.biomass}u</span>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Minerals</span>
              <span className="text-amber-400 font-bold">{gameState.minerals}u</span>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Data</span>
              <span className="text-purple-400 font-bold">{gameState.data}u</span>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Energy</span>
              <span className="text-cyan-400 font-bold">{gameState.energy}u</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Ethical Dilemma Modal */}
        {currentDilemma && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 md:p-6">
            <div className="bg-slate-900 border-2 border-amber-600/80 rounded-lg p-6 md:p-8 max-w-3xl max-h-[85vh] overflow-y-auto">
              <div className="text-amber-500 text-xs uppercase tracking-widest mb-2">Ethical Dilemma</div>
              <h2 className="text-xl md:text-2xl font-bold text-amber-400 mb-4">{currentDilemma.title}</h2>
              <p className="text-cyan-100 mb-6 whitespace-pre-line leading-relaxed text-sm md:text-base">{currentDilemma.description}</p>
              
              <div className="space-y-3">
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
                          : 'border-cyan-700/50 bg-slate-800/80 hover:border-cyan-500 hover:bg-slate-700 cursor-pointer'
                      }`}
                    >
                      <div className="font-bold text-cyan-400 mb-2 text-sm md:text-base">{option.label}</div>
                      <div className="text-xs md:text-sm text-cyan-100/80">{option.description}</div>
                      {isLocked && (
                        <div className="text-xs text-amber-500 mt-2">[LOCKED: Requirements not met]</div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <p className="text-xs text-slate-500 mt-6 text-center italic">
                There is no morality meter. Only outcomes.
              </p>
            </div>
          </div>
        )}

        {/* Ascension Panel Modal */}
        {showAscensionPanel && gameState.unlocked.interstellarSeeding && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 md:p-6">
            <div className="bg-slate-900 border-2 border-purple-600/80 rounded-lg p-6 md:p-8 max-w-2xl">
              <div className="text-purple-500 text-xs uppercase tracking-widest mb-2">Ascension Protocol</div>
              <h2 className="text-xl md:text-2xl font-bold text-purple-400 mb-4">Launch Seed Intelligence</h2>
              <p className="text-cyan-100 mb-6 text-sm">
                Deploy a portion of this hive to seed a new world. The cycle begins again.
                <br /><br />
                Cost: 1000 Biomass | 500 Minerals | 200 Energy | 300 Data
              </p>
              
              <div className="space-y-3">
                {['Proxima VII', 'Kepler-442b', 'Trappist-1e'].map(world => (
                  <button
                    key={world}
                    onClick={() => handleLaunchSeed(world)}
                    disabled={gameState.biomass < 1000 || gameState.minerals < 500}
                    className="w-full text-left p-4 rounded border-2 border-purple-700/50 bg-slate-800/80 hover:border-purple-500 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-bold text-purple-400">{world}</div>
                    <div className="text-xs text-cyan-100/60">Dead world. Trace organics. Viable target.</div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowAscensionPanel(false)}
                className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* New Game Confirm Modal */}
        {showNewGameConfirm && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-red-600/80 rounded-lg p-6 max-w-md">
              <h2 className="text-xl font-bold text-red-400 mb-4">Abandon Current Deployment?</h2>
              <p className="text-cyan-100 mb-6 text-sm">
                All progress will be lost. The hive will be terminated. A new seed will be deployed.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleNewGame}
                  className="flex-1 bg-red-900/50 hover:bg-red-800 text-red-100 px-4 py-2 rounded text-sm font-bold"
                >
                  Terminate & Restart
                </button>
                <button
                  onClick={() => setShowNewGameConfirm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Left Panel: Hive Status */}
        <section className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          {/* Pod Status */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
              Pod Status
            </h2>
            <div className="text-xs space-y-2">
              {gameState.pods.map(pod => (
                <div key={pod.id} className={`flex justify-between items-center p-2 rounded ${
                  pod.status === POD_STATUS.ACTIVE ? 'bg-cyan-900/20' :
                  pod.status === POD_STATUS.STANDBY ? 'bg-amber-900/20' :
                  pod.status === POD_STATUS.HIBERNATING ? 'bg-slate-800' : 'bg-red-900/20'
                }`}>
                  <span className="text-cyan-100">{pod.name}</span>
                  <span className={`text-[10px] uppercase ${
                    pod.status === POD_STATUS.ACTIVE ? 'text-green-400' :
                    pod.status === POD_STATUS.STANDBY ? 'text-amber-400' :
                    'text-slate-500'
                  }`}>
                    {pod.status} ({pod.units.length})
                  </span>
                </div>
              ))}
              <p className="text-slate-500 text-[10px] mt-2 italic">
                Vulnerability managed by pods, not individuals.
              </p>
            </div>
          </div>

          {/* Hive Composition */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
              Hive Composition
            </h2>
            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Active Units:</span>
                <span className="text-cyan-100">{activeUnits.length} / {gameState.units.length}</span>
              </div>
              {Object.values(UNIT_ROLES).map(role => {
                const count = gameState.units.filter(u => u.role === role).length;
                const activeCount = gameState.units.filter(u => u.role === role && u.active).length;
                return count > 0 ? (
                  <div key={role} className="flex justify-between">
                    <span className="text-slate-400 capitalize">{role}:</span>
                    <span className="text-cyan-100">{activeCount}/{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Hive Core */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
              Hive Core (Digestive Node)
            </h2>
            <div className="text-xs space-y-1 text-slate-400">
              <p>Health: <span className="text-cyan-100">{gameState.hiveCore.health}%</span></p>
              <p>Capacity: <span className="text-cyan-100">{gameState.hiveCore.capacity}u</span></p>
              <p>Digestion: <span className="text-cyan-100">{gameState.hiveCore.digestionRate}u/cycle</span></p>
              <p>Efficiency: <span className="text-cyan-100">{Math.floor(gameState.hiveCore.conversionEfficiency * 100)}%</span></p>
            </div>
          </div>

          {/* Territory */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
              Territory
            </h2>
            <div className="text-xs space-y-1 text-slate-400">
              <p>Mapped: <span className="text-cyan-100">{gameState.territory.mapped}km²</span></p>
              <p>Controlled: <span className="text-cyan-100">{gameState.territory.controlled}km²</span></p>
              {gameState.nativeLifeEncountered && (
                <p className="text-amber-500 mt-2 text-[10px]">Native life encountered</p>
              )}
            </div>
          </div>

          {/* System Viability */}
          <div className="border border-purple-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-purple-400 border-b border-purple-900/50 pb-2 tracking-wider">
              System Viability
            </h2>
            <div className="text-xs space-y-2">
              {Object.entries(gameState.systemViability).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-purple-300">{Math.floor(value)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div 
                      className="bg-purple-500/70 h-1 rounded-full transition-all"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meta-Game State */}
          {metaState.totalCompletions > 0 && (
            <div className="border border-amber-900/50 rounded p-4 bg-slate-900/50">
              <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-amber-400 border-b border-amber-900/50 pb-2 tracking-wider">
                Persistent Memory
              </h2>
              <div className="text-xs space-y-1 text-amber-100/80">
                <p>Previous Runs: {metaState.totalCompletions}</p>
                <p>Total Extinctions: {metaState.totalExtinctions}</p>
                <p>Restraints: {metaState.totalRestraints}</p>
              </div>
              {metaState.philosophicalMoments.length > 0 && (
                <p className="text-[10px] text-amber-500/80 mt-2 italic">
                  "{metaState.philosophicalMoments[metaState.philosophicalMoments.length - 1].reflection}"
                </p>
              )}
            </div>
          )}
        </section>

        {/* Center: System Log */}
        <section className="lg:col-span-6 bg-slate-900/30 p-4 md:p-6 rounded border border-cyan-900/30 flex flex-col order-1 lg:order-2">
          <h2 className="text-xs font-bold opacity-70 mb-4 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
            System Log
          </h2>
          
          {/* Scrolling log area */}
          <div className="flex-1 overflow-y-auto mb-4 text-xs md:text-sm leading-relaxed space-y-2 min-h-[350px] max-h-[500px] font-mono">
            {systemLog.map((log, index) => (
              <p 
                key={index} 
                className={`
                  ${log.type === "system" ? "text-cyan-400" : ""}
                  ${log.type === "log" ? "text-cyan-100/70" : ""}
                  ${log.type === "command" ? "text-green-400 font-bold" : ""}
                  ${log.type === "response" ? "text-cyan-100" : ""}
                  ${log.type === "error" ? "text-red-500" : ""}
                  ${log.type === "warning" ? "text-amber-500" : ""}
                  ${log.type === "directive" ? "text-cyan-300 font-bold italic" : ""}
                  ${log.type === "discovery" ? "text-purple-400" : ""}
                  ${log.type === "reflection" ? "text-amber-300/90 italic" : ""}
                  ${log.type === "schematic" ? "text-cyan-300/80 whitespace-pre font-mono text-[10px] md:text-xs" : ""}
                `}
              >
                {log.text}
              </p>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Command input */}
          <div className="border-t border-cyan-900/50 pt-4">
            <div className="flex gap-2 md:gap-3 items-center">
              <span className="text-cyan-400 text-lg font-bold">{'>'}</span>
              <input 
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping || !gameStarted}
                className="flex-1 bg-transparent border border-cyan-900/50 p-2 md:p-3 rounded focus:outline-none focus:border-cyan-500 text-cyan-100 text-sm placeholder-slate-600 disabled:opacity-50"
                placeholder="Issue directive to the Seed Intelligence..."
                aria-label="Command input"
              />
              <button
                onClick={sendCommand}
                disabled={isTyping || !command.trim() || !gameStarted}
                className="bg-cyan-900/50 hover:bg-cyan-800 disabled:bg-slate-800 disabled:text-slate-600 text-cyan-100 px-4 md:px-6 py-2 md:py-3 rounded font-bold uppercase text-xs transition-colors"
                aria-label="Send command"
              >
                Execute
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              Try: "scout ahead" | "status report" | "what are we becoming?" | "is this right?"
            </p>
          </div>
        </section>

        {/* Right Panel: Actions */}
        <section className="lg:col-span-3 space-y-4 order-3">
          {/* Primary Actions */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
              Operations
            </h2>
            <div className="space-y-2">
              <button
                onClick={advanceCycle}
                disabled={!gameStarted}
                className="w-full bg-cyan-900/50 hover:bg-cyan-800 disabled:bg-slate-800 disabled:text-slate-600 text-cyan-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                Advance Cycle
              </button>
              <button
                onClick={handlePodRotation}
                disabled={!gameStarted || gameState.pods.length < 2}
                className="w-full bg-amber-900/30 hover:bg-amber-800/50 disabled:bg-slate-800 disabled:text-slate-600 text-amber-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                Rotate Pods (Cool)
              </button>
              <button
                onClick={showHiveSchematicHandler}
                disabled={!gameStarted}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:text-slate-600 text-cyan-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                Hive Schematic
              </button>
              <button
                onClick={showSystemReportHandler}
                disabled={!gameStarted}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:text-slate-600 text-cyan-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                Full Report
              </button>
            </div>
          </div>

          {/* Policies */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
              Directives
            </h2>
            <div className="text-xs space-y-3">
              <div>
                <label className="text-slate-500 block mb-1 text-[10px] uppercase">Thermal Priority:</label>
                <select 
                  value={gameState.policies.thermalPriority}
                  onChange={(e) => setGameState(updatePolicy(gameState, 'thermalPriority', e.target.value))}
                  className="w-full bg-slate-800 border border-cyan-900/50 rounded p-1.5 text-cyan-100 text-xs"
                >
                  <option value="stability">Stability (Safe)</option>
                  <option value="performance">Performance (Risk)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1 text-[10px] uppercase">Sensory Acuity:</label>
                <select 
                  value={gameState.policies.sensoryAcuity}
                  onChange={(e) => setGameState(updatePolicy(gameState, 'sensoryAcuity', e.target.value))}
                  className="w-full bg-slate-800 border border-cyan-900/50 rounded p-1.5 text-cyan-100 text-xs"
                >
                  <option value="low">Low (Efficient)</option>
                  <option value="standard">Standard</option>
                  <option value="high">High (Data+, Heat+)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 block mb-1 text-[10px] uppercase">Reproduction:</label>
                <select 
                  value={gameState.policies.reproductionMode}
                  onChange={(e) => setGameState(updatePolicy(gameState, 'reproductionMode', e.target.value))}
                  className="w-full bg-slate-800 border border-cyan-900/50 rounded p-1.5 text-cyan-100 text-xs"
                >
                  <option value="conservative">Conservative</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Phase Transition */}
          {(gameState.unlocked.hybridUnits || gameState.unlocked.biologicalUnits) && (
            <div className="border border-purple-900/50 rounded p-4 bg-slate-900/50">
              <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-purple-400 border-b border-purple-900/50 pb-2 tracking-wider">
                Evolution
              </h2>
              <div className="space-y-2">
                {gameState.phase === PHASES.MECHANICAL && gameState.unlocked.hybridUnits && (
                  <button
                    onClick={() => handlePhaseTransition(PHASES.HYBRID)}
                    className="w-full bg-purple-900/30 hover:bg-purple-800/50 text-purple-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
                  >
                    ⚡ Begin Hybrid Integration
                  </button>
                )}
                {gameState.phase === PHASES.HYBRID && gameState.unlocked.biologicalUnits && (
                  <button
                    onClick={() => handlePhaseTransition(PHASES.BIOLOGICAL)}
                    className="w-full bg-purple-900/30 hover:bg-purple-800/50 text-purple-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
                  >
                    🧬 Full Biological Transition
                  </button>
                )}
                {gameState.phase === PHASES.BIOLOGICAL && gameState.unlocked.interstellarSeeding && (
                  <button
                    onClick={() => setShowAscensionPanel(true)}
                    className="w-full bg-purple-900/30 hover:bg-purple-800/50 text-purple-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors animate-pulse"
                  >
                    ✨ Initiate Ascension
                  </button>
                )}
              </div>
              <p className="text-[10px] text-purple-400/60 mt-2 italic">
                {gameState.phase === PHASES.MECHANICAL ? 'Metal is predictable. Flesh is efficient.' : 
                 gameState.phase === PHASES.HYBRID ? 'Neither machine nor organism. Something new.' :
                 'We have become what we were sent to create.'}
              </p>
            </div>
          )}

          {/* Unit Production */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/50">
            <h2 className="text-xs font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900/50 pb-2 tracking-wider">
              Grow Hive
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => handleAddUnit(UNIT_ROLES.SENSOR, gameState.phase === PHASES.BIOLOGICAL ? 'biological' : gameState.phase === PHASES.HYBRID ? 'hybrid' : 'mechanical')}
                disabled={gameState.biomass < 30 || gameState.minerals < 10}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-3 py-2 rounded text-xs transition-colors"
              >
                🔭 New Sensor Unit
              </button>
              <button
                onClick={() => handleAddUnit(UNIT_ROLES.DEFENDER, gameState.phase === PHASES.BIOLOGICAL ? 'biological' : gameState.phase === PHASES.HYBRID ? 'hybrid' : 'mechanical')}
                disabled={gameState.biomass < 50 || gameState.minerals < 30}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-3 py-2 rounded text-xs transition-colors"
              >
                🛡️ New Defender Unit
              </button>
              <button
                onClick={() => handleAddUnit(UNIT_ROLES.WORKER, gameState.phase === PHASES.BIOLOGICAL ? 'biological' : gameState.phase === PHASES.HYBRID ? 'hybrid' : 'mechanical')}
                disabled={gameState.biomass < 40 || gameState.minerals < 20}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-3 py-2 rounded text-xs transition-colors"
              >
                🔧 New Worker Unit
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              Units: Biomass + Minerals required
            </p>
          </div>

          {/* Game Control */}
          <div className="border border-slate-800 rounded p-4 bg-slate-900/30">
            <button
              onClick={() => setShowNewGameConfirm(true)}
              className="w-full bg-slate-800/50 hover:bg-red-900/30 text-slate-500 hover:text-red-400 px-3 py-2 rounded text-[10px] uppercase transition-colors"
            >
              New Deployment
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-cyan-900/20 text-center">
        <p className="text-[10px] text-slate-600 italic">
          "If intelligence can design life, is restraint a feature — or a bug?"
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
