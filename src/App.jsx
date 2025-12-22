import { useState, useRef, useEffect } from 'react';

const API_ENDPOINT = 'https://ai-agent.martinbibb.workers.dev';

const Dashboard = () => {
  const [heat, setHeat] = useState(12);
  const [biomass, setBiomass] = useState(450);
  const [systemLog, setSystemLog] = useState([
    { text: "[SYSTEM INIT]: ASGARDIAN SEED INTELLIGENCE v1.0 Online", type: "system" },
    { text: "[LOG_01]: Landing successful. Analyzing rainforest canopy...", type: "log" },
    { text: "Sensors detect a high-density biological structure. The Client species would require this calcium-density to prevent skeletal collapse in this gravity.", type: "log" }
  ]);
  const [activeUnits, setActiveUnits] = useState([
    "Scavenger_Mech_01",
    "Scavenger_Mech_02",
    "Scavenger_Mech_03"
  ]);
  const [command, setCommand] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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
    
    // Add empty message first
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
    }, 30); // 30ms per character for smooth typewriter effect

    // Return cleanup function
    return () => clearInterval(interval);
  };

  // Send command to Cloudflare Worker
  const sendCommand = async () => {
    if (!command.trim() || isTyping) return;

    const userCommand = command.trim();
    setCommand("");
    
    // Add user command to log
    setSystemLog(prev => [...prev, { text: `> ${userCommand}`, type: "command" }]);
    setIsTyping(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userCommand,
          context: {
            heat,
            biomass,
            units: activeUnits
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store cleanup function and use typewriter effect for the response
      typewriterCleanupRef.current = typewriterEffect(data.response || data.message || "No response received.", () => {
        // Update game state if provided
        if (data.heat !== undefined) setHeat(data.heat);
        if (data.biomass !== undefined) setBiomass(data.biomass);
        if (data.units) setActiveUnits(data.units);
        typewriterCleanupRef.current = null;
      });

    } catch (error) {
      setIsTyping(false);
      setSystemLog(prev => [...prev, { 
        text: `[ERROR]: Connection failed - ${error.message}. The hive is operating in isolation mode.`, 
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

  return (
    <div className="bg-slate-950 text-cyan-100 min-h-screen p-6 font-sans">
      {/* Header: System Status */}
      <header className="border-b border-cyan-900 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl tracking-widest font-bold text-cyan-400">
            ASGARDIAN: SEED INTELLIGENCE
          </h1>
          <div className="flex gap-8 text-lg">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Heat Level</span>
              <span className="text-amber-500 font-bold">{heat}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-500 uppercase">Biomass</span>
              <span className="text-cyan-400 font-bold">{biomass}u</span>
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* Left: Active Units */}
        <section className="col-span-3 border border-cyan-900/30 rounded p-4 bg-slate-900/30">
          <h2 className="text-base font-bold opacity-70 mb-4 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
            Active Units
          </h2>
          <ul className="space-y-3 text-base">
            {activeUnits.map((unit, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-cyan-400">•</span>
                <span className="text-cyan-100">{unit}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Center: System Log */}
        <section className="col-span-9 bg-slate-900/50 p-6 rounded border border-cyan-900/30 flex flex-col">
          <h2 className="text-base font-bold opacity-70 mb-4 uppercase text-cyan-400 border-b border-cyan-900 pb-2">
            System Log
          </h2>
          
          {/* Scrolling log area */}
          <div className="flex-1 overflow-y-auto mb-4 text-base leading-relaxed space-y-3 min-h-[400px] max-h-[500px]">
            {systemLog.map((log, index) => (
              <p 
                key={index} 
                className={`
                  ${log.type === "system" ? "text-cyan-400 font-bold" : ""}
                  ${log.type === "log" ? "text-cyan-100" : ""}
                  ${log.type === "command" ? "text-green-400 font-bold" : ""}
                  ${log.type === "response" ? "text-cyan-100" : ""}
                  ${log.type === "error" ? "text-amber-500" : ""}
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
                placeholder="Enter command for the Hive..."
                aria-label="Command input"
              />
              <button
                onClick={sendCommand}
                disabled={isTyping || !command.trim()}
                className="bg-cyan-900 hover:bg-cyan-800 disabled:bg-slate-800 disabled:text-slate-600 text-cyan-100 px-6 py-3 rounded font-bold uppercase text-sm transition-colors"
                aria-label="Send command"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
