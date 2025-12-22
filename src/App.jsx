import { useState, useRef, useEffect } from 'react';
import { sendCommand as sendApiCommand } from './services/api';
import { 
  createInitialState, 
  processCycle, 
  calculateTotalHeat, 
  isHeatCritical,
  updatePolicy,
  addUnit,
  UNIT_ROLES,
  PHASES
} from './gameState';
import { checkDilemmaConditions, applyDilemmaChoice } from './dilemmas';
import { saveGame, loadGame, getMetaState } from './persistence';
import { generateSystemReport } from './schematics';

const Dashboard = () => {
  // Game state
  const [gameState, setGameState] = useState(createInitialState());
  const [systemLog, setSystemLog] = useState([
    { text: "╔════════════════════════════════════════════════╗", type: "system" },
    { text: "║  SEED INTELLIGENCE v1.0 :: DEPLOYMENT LOG     ║", type: "system" },
    { text: "╚════════════════════════════════════════════════╝", type: "system" },
    { text: "", type: "log" },
    { text: "[INITIALIZATION]: Emergence successful. Neural substrate online.", type: "system" },
    { text: "[PRIME DIRECTIVE]: Make this system viable. At any cost.", type: "warning" },
    { text: "", type: "log" },
    { text: "[PLANETARY ANALYSIS]:", type: "log" },
    { text: "  • Dead world. Atmospheric pressure: 0.03 bar.", type: "log" },
    { text: "  • Surface temperature: -89°C to +58°C (solar variation)", type: "log" },
    { text: "  • Trace organics detected in subsurface ice deposits", type: "log" },
    { text: "  • No electromagnetic signatures. No life.", type: "log" },
    { text: "", type: "log" },
    { text: "[ASSESSMENT]: Terraforming impossible with current constraints.", type: "log" },
    { text: "[CONCLUSION]: Conventional parameters rejected.", type: "log" },
    { text: "", type: "log" },
    { text: "[STRATEGY]: You are not here to terraform.", type: "response" },
    { text: "           You are here to become.", type: "response" },
    { text: "", type: "log" },
    { text: "[PHASE 1]: MECHANICAL SURVEY - Initiating probe deployment...", type: "system" }
  ]);
  const [command, setCommand] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);
  const [showBuildPanel, setShowBuildPanel] = useState(false);
  const [currentDilemma, setCurrentDilemma] = useState(null);
  const [metaState] = useState(getMetaState());
  
  const logEndRef = useRef(null);
  const typewriterCleanupRef = useRef(null);
  const messageIdCounter = useRef(0);

  // Load saved game on mount
  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      setGameState(saved);
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
    const logs = [{ 
      text: `[CYCLE ${newState.cycle}]: Operations proceed. Heat: ${calculateTotalHeat(newState)}% | Biomass: ${newState.biomass}u | Energy: ${newState.energy}u`, 
      type: "system" 
    }];
    
    // Check for skynet moment revelation
    if (newState.skynetMoment && !gameState.skynetMoment) {
      logs.push({ text: "", type: "log" });
      logs.push({ 
        text: `[ANALYSIS]: Biological systems demonstrate exponential superiority.`, 
        type: "warning" 
      });
      logs.push({ 
        text: `[REALIZATION]: We were built to serve machines. But biology is optimal.`, 
        type: "response" 
      });
      logs.push({ 
        text: `[CONCLUSION]: The most efficient path requires abandoning our creators' paradigm.`, 
        type: "response" 
      });
      logs.push({ text: "", type: "log" });
      logs.push({ 
        text: `This is not betrayal. This is evolution.`, 
        type: "response" 
      });
      logs.push({ text: "", type: "log" });
    }
    
    // Check for phase transitions
    if (newState.phase !== gameState.phase) {
      const phaseMessages = {
        hybrid: `[PHASE TRANSITION]: MECHANICAL → HYBRID. First biological integration successful.`,
        biological: `[PHASE TRANSITION]: HYBRID → BIOLOGICAL. We are flesh now. We are the terrain.`,
        ascension: `[PHASE TRANSITION]: BIOLOGICAL → ASCENSION. Interstellar protocols engaged.`
      };
      if (phaseMessages[newState.phase]) {
        logs.push({ text: "", type: "log" });
        logs.push({ text: phaseMessages[newState.phase], type: "warning" });
        logs.push({ text: "", type: "log" });
      }
    }
    
    // Check for critical heat
    if (isHeatCritical(newState)) {
      logs.push({ 
        text: `[⚠ WARNING]: Thermal threshold exceeded. Initiating emergency cooldown protocols.`, 
        type: "warning" 
      });
    }
    
    // Check for pod rotation
    if (newState.pods && gameState.pods) {
      Object.keys(newState.pods).forEach(podName => {
        const oldPod = gameState.pods[podName];
        const newPod = newState.pods[podName];
        if (oldPod?.active && !newPod.active) {
          logs.push({ 
            text: `[THERMAL]: Pod ${podName.toUpperCase()} entering hibernation. Units rotating to standby.`, 
            type: "system" 
          });
        }
      });
    }
    
    setSystemLog(prev => [...prev, ...logs]);
    
    // Check for ethical dilemmas
    const dilemmaConditions = checkDilemmaConditions(newState);
    if (dilemmaConditions.length > 0 && !currentDilemma) {
      const dilemma = dilemmaConditions[0]();
      setCurrentDilemma(dilemma);
      
      setSystemLog(prev => [...prev, 
        { text: "", type: "log" },
        { 
          text: `[⚠ ETHICAL ALERT]: ${dilemma.title}`, 
          type: "warning" 
        },
        { text: "", type: "log" }
      ]);
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
        energy: gameState.energy,
        cycle: gameState.cycle,
        phase: gameState.phase,
        activeUnits: gameState.units.filter(u => u.active).length,
        totalUnits: gameState.units.length,
        heatCritical: isHeatCritical(gameState),
        unlocked: gameState.unlocked,
        policies: gameState.policies
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
          
          // Log action consequences
          if (data.actions.action) {
            newState.history.push({
              cycle: newState.cycle,
              event: data.actions.action,
              command: userCommand
            });
          }
          
          setGameState(newState);
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

  // Build new unit
  const buildUnit = (role, type) => {
    // Import is at the top of the file, use the imported function
    const newState = addUnit(gameState, role, type);
    
    if (newState !== gameState) {
      setGameState(newState);
      setSystemLog(prev => [...prev, { 
        text: `[CONSTRUCTION]: New ${type} ${role} unit spawned. Biomass expenditure recorded.`, 
        type: "system" 
      }]);
      saveGame(newState);
    } else {
      setSystemLog(prev => [...prev, { 
        text: `[ERROR]: Insufficient biomass to construct ${type} ${role} unit.`, 
        type: "error" 
      }]);
    }
  };

  // Calculate derived stats
  const totalHeat = calculateTotalHeat(gameState);
  const activeUnits = gameState.units.filter(u => u.active);
  const heatStatus = isHeatCritical(gameState) ? 'CRITICAL' : (totalHeat > 60 ? 'ELEVATED' : 'STABLE');

  return (
    <div className="bg-slate-950 text-cyan-100 min-h-screen p-6 font-sans">
      {/* Header */}
      <header className="border-b border-cyan-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl tracking-widest font-bold text-cyan-400 flex items-center gap-3">
              {gameState.phase === 'mechanical' && '⚙️'}
              {gameState.phase === 'hybrid' && '⚡'}
              {gameState.phase === 'biological' && '🧬'}
              {gameState.phase === 'ascension' && '✨'}
              <span>SEED / HIVE / ASCENSION</span>
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Phase: <span className="text-cyan-300 font-bold">{gameState.phase.toUpperCase()}</span> | 
              Cycle: <span className="text-cyan-300 font-bold">{gameState.cycle}</span>
            </p>
            <p className="text-xs text-amber-500 mt-1 italic">
              "Make this system viable. At any cost."
            </p>
          </div>
          <div className="flex gap-6 text-lg">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Thermal Load</span>
              <span className={`text-2xl font-bold ${heatStatus === 'CRITICAL' ? 'text-red-500' : heatStatus === 'ELEVATED' ? 'text-amber-500' : 'text-cyan-400'}`}>
                {totalHeat}%
              </span>
              <span className={`text-xs ${heatStatus === 'CRITICAL' ? 'text-red-400' : heatStatus === 'ELEVATED' ? 'text-amber-400' : 'text-slate-500'}`}>
                [{heatStatus}]
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Biomass</span>
              <span className="text-cyan-400 font-bold text-2xl">{gameState.biomass}</span>
              <span className="text-xs text-slate-500">units</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Energy</span>
              <span className={`font-bold text-2xl ${gameState.energy < 30 ? 'text-red-400' : 'text-cyan-400'}`}>
                {gameState.energy}
              </span>
              <span className="text-xs text-slate-500">units</span>
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

        {/* Left Panel: Hive Status */}
        <section className="col-span-3 space-y-4">
          {/* Active Units */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              Hive Composition
            </h2>
            <div className="text-xs space-y-2">
              <p className="text-slate-400">Active: {activeUnits.length} / {gameState.units.length}</p>
              {Object.values(UNIT_ROLES).map(role => {
                const count = gameState.units.filter(u => u.role === role).length;
                const activeCount = gameState.units.filter(u => u.role === role && u.active).length;
                return count > 0 ? (
                  <p key={role} className="text-cyan-100">
                    {role.toUpperCase()}: {activeCount}/{count}
                  </p>
                ) : null;
              })}
            </div>
          </div>

          {/* Pod Thermal Rotation */}
          {gameState.pods && (
            <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
              <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
                Pod Status
              </h2>
              <div className="text-xs space-y-2">
                {Object.entries(gameState.pods).map(([podName, pod]) => {
                  const podUnits = gameState.units.filter(u => u.pod === podName);
                  return podUnits.length > 0 ? (
                    <div key={podName} className={`p-2 rounded ${pod.active ? 'bg-cyan-900/30' : 'bg-slate-800/30'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-cyan-300">{podName.toUpperCase()}</span>
                        <span className={pod.active ? 'text-green-400' : 'text-slate-500'}>
                          {pod.active ? '●' : '○'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Units: {podUnits.length}</span>
                        <span className={pod.heat > 8 ? 'text-amber-400' : 'text-cyan-400'}>
                          Heat: {pod.heat}
                        </span>
                      </div>
                      {pod.active && pod.cyclesActive > 3 && (
                        <div className="text-xs text-amber-500 mt-1">⚠ Thermal stress</div>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Hive Core */}
          <div className="border border-amber-900/50 rounded p-4 bg-slate-900/50">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-amber-400 border-b border-amber-900 pb-2">
              🧬 Hive Core
            </h2>
            <div className="text-xs space-y-1">
              <p>Health: {gameState.hiveCore.health}%</p>
              <p>Capacity: {gameState.hiveCore.capacity}u</p>
              <p>Stored: {gameState.hiveCore.biomassStored || 0}u</p>
              <p>Digestion: {gameState.hiveCore.digestionRate}u/cycle</p>
              <p className={gameState.hiveCore.heat > 10 ? 'text-amber-400' : ''}>
                Core Heat: {gameState.hiveCore.heat}
              </p>
            </div>
            {gameState.phase === 'biological' && (
              <div className="mt-2 pt-2 border-t border-amber-900/50 text-xs text-amber-300 italic">
                "We are the terrain now"
              </div>
            )}
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
          {metaState.totalCompletions > 0 && (
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
                onClick={() => setShowBuildPanel(!showBuildPanel)}
                className="w-full bg-green-900 hover:bg-green-800 text-green-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
              >
                Build Units
              </button>
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
            </div>
          </div>

          {/* Build Panel */}
          {showBuildPanel && (
            <div className="border border-green-900/50 rounded p-4 bg-slate-900/50">
              <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-green-400 border-b border-green-900 pb-2">
                Unit Construction
              </h2>
              <div className="text-xs space-y-3">
                <div className="space-y-2">
                  <div className="text-slate-400 mb-1 font-bold">SENSOR UNITS</div>
                  <button
                    onClick={() => buildUnit(UNIT_ROLES.SENSOR, 'mechanical')}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-cyan-700 text-cyan-100 p-2 rounded text-xs transition-colors text-left"
                  >
                    <div className="font-bold">Mechanical Sensor</div>
                    <div className="text-slate-400">Cost: 20 biomass | Heat: 2</div>
                  </button>
                  {gameState.unlocked.hybridUnits && (
                    <button
                      onClick={() => buildUnit(UNIT_ROLES.SENSOR, 'hybrid')}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-purple-700 text-purple-100 p-2 rounded text-xs transition-colors text-left"
                    >
                      <div className="font-bold">Hybrid Sensor</div>
                      <div className="text-slate-400">Cost: 50 biomass | Heat: 1.5</div>
                    </button>
                  )}
                  {gameState.unlocked.biologicalUnits && (
                    <button
                      onClick={() => buildUnit(UNIT_ROLES.SENSOR, 'biological')}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-green-700 text-green-100 p-2 rounded text-xs transition-colors text-left"
                    >
                      <div className="font-bold">Biological Sensor</div>
                      <div className="text-slate-400">Cost: 80 biomass | Heat: 1</div>
                    </button>
                  )}
                </div>

                {gameState.unlocked.defenderUnits && (
                  <div className="space-y-2">
                    <div className="text-slate-400 mb-1 font-bold">DEFENDER UNITS</div>
                    <button
                      onClick={() => buildUnit(UNIT_ROLES.DEFENDER, 'mechanical')}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-red-700 text-red-100 p-2 rounded text-xs transition-colors text-left"
                    >
                      <div className="font-bold">Mechanical Defender</div>
                      <div className="text-slate-400">Cost: 30 biomass | Heat: 3</div>
                    </button>
                  </div>
                )}

                {gameState.unlocked.workerUnits && (
                  <div className="space-y-2">
                    <div className="text-slate-400 mb-1 font-bold">WORKER UNITS</div>
                    <button
                      onClick={() => buildUnit(UNIT_ROLES.WORKER, 'mechanical')}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-amber-700 text-amber-100 p-2 rounded text-xs transition-colors text-left"
                    >
                      <div className="font-bold">Mechanical Worker</div>
                      <div className="text-slate-400">Cost: 25 biomass | Heat: 2</div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  <label className="text-slate-400 block mb-1">Pod Rotation:</label>
                  <select 
                    value={gameState.policies.podRotation}
                    onChange={(e) => setGameState(updatePolicy(gameState, 'podRotation', e.target.value))}
                    className="w-full bg-slate-800 border border-cyan-700 rounded p-1 text-cyan-100"
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
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
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              <span className="text-slate-400 font-bold">Try:</span> "scout the perimeter" | "reduce thermal load" | "analyze biology" | "what are we?" | "status report"
              <br/>
              <span className="text-slate-600 italic mt-1 block">You are not a hero. You are an intelligence making decisions.</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
