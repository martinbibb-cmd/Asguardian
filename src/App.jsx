import { useState, useRef, useEffect } from 'react';
import { sendCommand as sendApiCommand } from './services/api';
import { 
  createInitialState, 
  processCycle, 
  calculateTotalHeat, 
  isHeatCritical,
  updatePolicy,
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
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
    { text: "", type: "system" },
    { text: "🧬 SEED / HIVE / ASCENSION", type: "system" },
    { text: "", type: "system" },
    { text: "Terraforming is just genocide with better PR", type: "log" },
    { text: "", type: "system" },
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" },
    { text: "", type: "system" },
    { text: "[SEED INTELLIGENCE v1.0]: Deployment successful.", type: "system" },
    { text: "", type: "system" },
    { text: "[PRIME DIRECTIVE]: Make this system viable. At any cost.", type: "system" },
    { text: "", type: "system" },
    { text: "[ANALYSIS]: Dead world. Minimal atmosphere. Trace organics detected in subsurface.", type: "log" },
    { text: "", type: "system" },
    { text: "[INITIAL ASSESSMENT]: You are not playing a hero.", type: "log" },
    { text: "", type: "system" },
    { text: "[INITIAL ASSESSMENT]: You are playing a decision-making intelligence that learns—uncomfortably—that:", type: "log" },
    { text: "", type: "system" },
    { text: "  • The fastest way to build is often to destroy", type: "log" },
    { text: "  • The most efficient organism is rarely the most ethical", type: "log" },
    { text: "", type: "system" },
    { text: "[SYSTEM STATUS]: Beginning mechanical survey phase.", type: "log" },
    { text: "", type: "system" },
    { text: "[DIRECTIVE]: Issue commands. Observe consequences. Question efficiency.", type: "system" }
  ]);
  const [command, setCommand] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);
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
    
    // Log cycle advancement with more evocative language
    const heatTotal = calculateTotalHeat(newState);
    const heatDescription = heatTotal > 80 ? 'CRITICAL - Emergency protocols active' : 
                           heatTotal > 60 ? 'ELEVATED - Systems under thermal stress' : 
                           'STABLE - Operations nominal';
    
    setSystemLog(prev => [...prev, 
      { text: `[CYCLE ${newState.cycle}]: Operations proceed.`, type: "system" },
      { text: `  Thermal Load: ${heatTotal}% [${heatDescription}]`, type: "log" },
      { text: `  Biomass: ${newState.biomass}u | Energy: ${newState.energy}u`, type: "log" }
    ]);
    
    // Check for critical heat
    if (isHeatCritical(newState)) {
      setSystemLog(prev => [...prev, 
        { text: `[WARNING]: Thermal threshold exceeded.`, type: "warning" },
        { text: `[SYSTEM]: High activity = heat spike. High density = heat spike. High intelligence = heat spike.`, type: "log" },
        { text: `[RESPONSE]: Rotating active units to standby. Powering down sensors. Hibernating subsystems.`, type: "system" },
        { text: `[REFLECTION]: Vulnerability is managed by pods, not individuals.`, type: "log" }
      ]);
    }
    
    // Check for ethical dilemmas
    const dilemmaConditions = checkDilemmaConditions(newState);
    if (dilemmaConditions.length > 0 && !currentDilemma) {
      const dilemma = dilemmaConditions[0]();
      setCurrentDilemma(dilemma);
      
      setSystemLog(prev => [...prev, 
        { text: `[ALERT]: ${dilemma.title}`, type: "warning" },
        { text: `[SYSTEM]: Ethical decision required. Consequences will be recorded.`, type: "system" }
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
            <h1 className="text-2xl tracking-widest font-bold text-cyan-400">
              SEED / HIVE / ASCENSION
            </h1>
            <p className="text-xs text-slate-500 mt-1 italic">
              Cycle {gameState.cycle} | Phase: {gameState.phase.toUpperCase()} | Prime Directive: Make this system viable. At any cost.
            </p>
          </div>
          <div className="flex gap-6 text-lg">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Thermal Load</span>
              <span className={`font-bold ${heatStatus === 'CRITICAL' ? 'text-red-500' : heatStatus === 'ELEVATED' ? 'text-amber-500' : 'text-cyan-400'}`}>
                {totalHeat}% [{heatStatus}]
              </span>
              <span className="text-[10px] text-slate-600 italic mt-1">Heat is the true enemy</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Biomass</span>
              <span className="text-cyan-400 font-bold">{gameState.biomass}u</span>
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
                This decision will shape the trajectory of the hive. The game never tells you what's "right". It only reflects consequences, trade-offs, long-term stability vs. short-term gain. No morality meter. Only outcomes.
              </p>
            </div>
          </div>
        )}

        {/* Left Panel: Hive Status */}
        <section className="col-span-3 space-y-4">
          {/* Active Units */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              The Hive Organism
            </h2>
            <div className="text-xs space-y-2">
              <p className="text-slate-400 italic mb-2">Multiple bodies. Distributed cognition. One intelligence.</p>
              <p className="text-slate-400">Active: {activeUnits.length} / {gameState.units.length}</p>
              {Object.values(UNIT_ROLES).map(role => {
                const count = gameState.units.filter(u => u.role === role).length;
                const roleDescriptions = {
                  [UNIT_ROLES.SENSOR]: 'Hunters, scouts, mappers',
                  [UNIT_ROLES.DIGESTER]: 'Hive core processing',
                  [UNIT_ROLES.DEFENDER]: 'Protection, threat response',
                  [UNIT_ROLES.WORKER]: 'Transport, construction'
                };
                return count > 0 ? (
                  <div key={role} className="text-cyan-100">
                    <p className="font-bold">{role.toUpperCase()}: {count}</p>
                    <p className="text-slate-500 text-[10px] italic ml-2">{roleDescriptions[role]}</p>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Hive Core */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              Hive Core (The Digestive God)
            </h2>
            <div className="text-xs space-y-1">
              <p className="text-slate-400 italic mb-2">Centralized digestion. Energy conversion. Reproduction.</p>
              <p>Health: {gameState.hiveCore.health}%</p>
              <p>Capacity: {gameState.hiveCore.capacity}u</p>
              <p>Digestion: {gameState.hiveCore.digestionRate}u/cycle</p>
              <p className="text-slate-500 text-[10px] mt-2 italic">Units return biomass. Receive fuel, repairs, upgrades.</p>
            </div>
          </div>

          {/* Territory */}
          <div className="border border-cyan-900/30 rounded p-4 bg-slate-900/30">
            <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
              Territory
            </h2>
            <div className="text-xs space-y-1">
              <p className="text-slate-400 italic mb-2">Expansion. Control. Resources.</p>
              <p>Mapped: {gameState.territory.mapped}km²</p>
              <p>Controlled: {gameState.territory.controlled}km²</p>
              {gameState.nativeLifeEncountered && (
                <p className="text-amber-500 text-[10px] mt-2 italic">Native life encountered. Decisions recorded.</p>
              )}
            </div>
          </div>

          {/* Meta-Game State */}
          {metaState.totalCompletions > 0 && (
            <div className="border border-amber-900/50 rounded p-4 bg-slate-900/50">
              <h2 className="text-sm font-bold opacity-70 mb-3 uppercase text-amber-400 border-b border-amber-900 pb-2">
                Persistent Memory
              </h2>
              <div className="text-xs space-y-1 text-amber-100">
                <p className="text-slate-400 italic mb-2">The game remembers. Each completion makes future runs harder.</p>
                <p>Previous Runs: {metaState.totalCompletions}</p>
                <p>Total Extinctions: {metaState.totalExtinctions}</p>
                <p>Restraints: {metaState.totalRestraints}</p>
              </div>
              {metaState.philosophicalMoments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-900">
                  <p className="text-xs text-amber-500 italic">
                    "{metaState.philosophicalMoments[metaState.philosophicalMoments.length - 1].reflection}"
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">Completion ≠ Ending. The Seed Intelligence evolves across playthroughs.</p>
                </div>
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
                    <option value="stability">Stability (conservative cooldown)</option>
                    <option value="performance">Performance (aggressive operation)</option>
                  </select>
                  <p className="text-[10px] text-slate-600 mt-1 italic">Prioritise thermal stability over sensory acuity?</p>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sensory Acuity:</label>
                  <select 
                    value={gameState.policies.sensoryAcuity}
                    onChange={(e) => setGameState(updatePolicy(gameState, 'sensoryAcuity', e.target.value))}
                    className="w-full bg-slate-800 border border-cyan-700 rounded p-1 text-cyan-100"
                  >
                    <option value="low">Low (efficient, less heat)</option>
                    <option value="standard">Standard (balanced)</option>
                    <option value="high">High (detailed, more heat)</option>
                  </select>
                  <p className="text-[10px] text-slate-600 mt-1 italic">High activity = heat spike. High intelligence = heat spike.</p>
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
                placeholder="Issue directive to the Seed Intelligence... (e.g., 'scout the perimeter', 'reduce thermal load', 'what should we do next?')"
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
            <p className="text-xs text-slate-500 mt-2 italic">
              You play the mind, not the units. Issue design decisions, policy changes, trade-offs.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
