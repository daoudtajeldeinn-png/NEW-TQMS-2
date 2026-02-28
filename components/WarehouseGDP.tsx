
import React from 'react';

export const WarehouseGDP: React.FC = () => {
  const zones = [
    { name: 'Cold Room A', temp: '4.2°C', hum: '45%', status: 'Optimal', type: 'Refrigerated (2-8°C)' },
    { name: 'Ambient Store 1', temp: '21.5°C', hum: '52%', status: 'Optimal', type: 'Controlled Ambient (<25°C)' },
    { name: 'Quarantine Area', temp: '22.0°C', hum: '50%', status: 'Optimal', type: 'Secured Enclosure' },
    { name: 'Loading Bay 1', temp: '19.8°C', hum: '55%', status: 'Alert', type: 'External Dock' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">GDP Environment Monitor</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[8px] mt-1">Real-time GXP Storage Surveillance</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">🌡️ Temperature Map</button>
           <button className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-200 animate-pulse">🚨 Alert Center</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {zones.map((zone, i) => (
          <div key={i} className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-3 h-3 rounded-full ${zone.status === 'Optimal' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-ping'}`}></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{zone.status}</span>
            </div>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter mb-2">{zone.name}</h4>
            <p className="text-[9px] font-bold text-blue-600 uppercase mb-6">{zone.type}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Temperature</p>
                <p className="text-xl font-black text-slate-900">{zone.temp}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Humidity</p>
                <p className="text-xl font-black text-slate-900">{zone.hum}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-8">Facility Sanitation & Pest Control</h3>
          <div className="space-y-6">
            {[
              { task: 'Rodent Station Check', date: '2025-02-10', by: 'TechPest UK', result: 'No Activity' },
              { task: 'Zone A Sanitation', date: '2025-02-12', by: 'Internal Facilities', result: 'Complete' },
              { task: 'Floor Seal Inspection', date: '2025-01-15', by: 'Maintenance', result: 'Optimal' },
            ].map((log, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-sm font-black uppercase">{log.task}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{log.date} | {log.by}</p>
                </div>
                <span className="text-[9px] font-black bg-green-500/20 text-green-400 px-3 py-1 rounded-full uppercase">{log.result}</span>
              </div>
            ))}
          </div>
          <div className="absolute right-0 bottom-0 text-9xl font-black text-white/5 pointer-events-none select-none -mr-12 -mb-12">🧹</div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Calibration & Mapping Schedule</h3>
          <div className="space-y-6">
             <div className="p-6 bg-blue-50 rounded-[30px] border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl">🌡️</div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Annual Temp Mapping</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">36 Sensors Validated</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Status</p>
                  <p className="text-xs font-black uppercase">Complete</p>
                </div>
             </div>
             <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl">📏</div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Cold Room Redundancy Test</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Quarterly Challenge</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Due</p>
                  <p className="text-xs font-black uppercase">Mar 2025</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
