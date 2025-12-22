const Dashboard = () => {
  return (
    <div className="bg-slate-950 text-cyan-100 min-h-screen p-6 font-mono">
      {/* Header: System Status */}
      <header className="border-b border-cyan-900 pb-4 mb-6 flex justify-between">
        <h1 className="text-xl tracking-widest font-bold text-cyan-400">SEED_INTEL_V.01</h1>
        <div className="flex gap-8">
          <span>HEAT: <span className="text-orange-500">12%</span></span>
          <span>BIOMASS: <span className="text-green-500">450u</span></span>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-6">
        {/* Left: Manifest */}
        <section className="col-span-3 border-r border-cyan-900 p-4">
          <h2 className="text-sm opacity-50 mb-4 uppercase">Unit Manifest</h2>
          <ul className="space-y-2">
            <li>• Scavenger_Mech_01</li>
            <li>• Scavenger_Mech_02</li>
            <li className="text-cyan-600 italic">• [Empty Bio-Slot]</li>
          </ul>
        </section>

        {/* Center: The Log */}
        <section className="col-span-6 bg-slate-900/50 p-6 rounded border border-cyan-900/30">
          <div className="h-96 overflow-y-auto mb-4 text-sm leading-relaxed">
            <p className="text-cyan-500">[LOG_01]: Landing successful. Analyzing rainforest canopy...</p>
            <p className="mt-4">Sensors detect a high-density biological structure. 
               The Client species would require this calcium-density to prevent 
               skeletal collapse in this gravity.</p>
          </div>
          <input 
            className="w-full bg-transparent border border-cyan-700 p-2 rounded focus:outline-none focus:border-cyan-400"
            placeholder="Enter Command for the Hive..."
          />
        </section>

        {/* Right: Planet Data */}
        <section className="col-span-3 p-4">
          <h2 className="text-sm opacity-50 mb-4 uppercase">Planet Stats</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">O2 LEVELS</p>
              <div className="w-full bg-slate-800 h-1 mt-1"><div className="bg-cyan-400 h-1 w-3/4"></div></div>
            </div>
            <div>
              <p className="text-xs text-slate-500">THREAT LEVEL</p>
              <p className="text-red-400">MINIMAL</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
