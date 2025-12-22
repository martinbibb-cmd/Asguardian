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
  PHASES
} from './gameState';

const Dashboard = () => {
  // Game state
  const [gameState, setGameState] = useState(createInitialState());
  const [systemLog, setSystemLog] = useState([
    { text: "[SEED INTELLIGENCE v1.0]: Deployment successful.", type: "system" },
    { text: "[PRIME DIRECTIVE]: Make this system viable. At any cost.", type: "system" },
    { text: "[ANALYSIS]: Dead world. Minimal atmosphere. Trace organics detected in subsurface. Beginning mechanical survey phase.", type: "log" }
  ]);
  const [command, setCommand] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPolicyPanel, setShowPolicyPanel] = useState(false);
  
  const logEndRef = useRef(null);
  const typewriterCleanupRef = useRef(null);
  const messageIdCounter = useRef(0);

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
    setSystemLog(prev => [...prev, { 
      text: `[CYCLE ${newState.cycle}]: Operations proceed. Heat: ${calculateTotalHeat(newState)}% | Biomass: ${newState.biomass}u | Energy: ${newState.energy}u`, 
      type: "system" 
    }]);
    
    // Check for critical heat
    if (isHeatCritical(newState)) {
      setSystemLog(prev => [...prev, { 
        text: `[WARNING]: Thermal threshold exceeded. Initiating emergency cooldown protocols.`, 
        type: "warning" 
      }]);
    }
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
              <span className="text-xs text-slate-500 uppercase">Energy</span>
              <span className="text-cyan-400 font-bold">{gameState.energy}u</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
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
              Try: "scout the perimeter" | "reduce thermal load" | "status report" | "what should we do next?"
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
