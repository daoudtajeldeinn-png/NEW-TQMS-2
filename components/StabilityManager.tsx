
import React, { useState, useEffect } from 'react';
import { StabilityStudy, User, Status } from '../types';

const INITIAL_STABILITY: StabilityStudy[] = [
  { 
    id: '1', 
    product: 'Metronidazole Tablets 400mg', 
    batchNumber: 'BN-2025-001', 
    condition: '30°C/75% RH (Zone IVb)', 
    startDate: '2025-01-15', 
    nextTimePoint: '2025-04-15 (3M)', 
    status: 'Ongoing', 
    protocolId: 'P-MET-001', 
    intervals: ['Initial', '3M', '6M', '9M', '12M', '18M', '24M'] 
  },
  { 
    id: '2', 
    product: 'Aspirin Capsules 100mg', 
    batchNumber: 'ASP-24-99', 
    condition: '25°C/60% RH (Zone II)', 
    startDate: '2024-10-10', 
    nextTimePoint: '2025-01-10 (3M)', 
    status: 'Ongoing', 
    protocolId: 'P-ASP-099', 
    intervals: ['Initial', '3M', '6M', '12M'] 
  },
];

interface StabilityManagerProps {
  user?: User | null;
}

export const StabilityManager: React.FC<StabilityManagerProps> = ({ user }) => {
  const [studies, setStudies] = useState<StabilityStudy[]>(() => {
    const saved = localStorage.getItem('pharma_stability_v1');
    return saved ? JSON.parse(saved) : INITIAL_STABILITY;
  });
  const [selectedStudy, setSelectedStudy] = useState<StabilityStudy | null>(studies[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [product, setProduct] = useState('');
  const [batch, setBatch] = useState('');
  const [condition, setCondition] = useState('30°C/75% RH');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    localStorage.setItem('pharma_stability_v1', JSON.stringify(studies));
  }, [studies]);

  const handleInitiate = () => {
    if (!product || !batch) return;
    const newStudy: StabilityStudy = {
      id: Date.now().toString(),
      product,
      batchNumber: batch,
      condition: `${condition} (Zone IVb)`,
      startDate,
      nextTimePoint: 'Pending Initial Analysis',
      status: 'Ongoing',
      protocolId: `P-${product.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-3)}`,
      intervals: ['Initial', '3M', '6M', '9M', '12M']
    };
    setStudies([newStudy, ...studies]);
    setSelectedStudy(newStudy);
    setIsModalOpen(false);
    setProduct('');
    setBatch('');
  };

  const handleUpdateStatus = (id: string, newStatus: StabilityStudy['status']) => {
    const updated = studies.map(s => s.id === id ? { ...s, status: newStatus } : s);
    setStudies(updated);
    if (selectedStudy?.id === id) {
      setSelectedStudy({ ...selectedStudy, status: newStatus });
    }
  };

  const handleDeleteStudy = (id: string) => {
    if (!window.confirm('Delete this stability study?')) return;
    const updated = studies.filter(s => s.id !== id);
    setStudies(updated);
    if (selectedStudy?.id === id) {
      setSelectedStudy(updated[0] || null);
    }
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Stability Monitoring</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[5px] mt-1">ICH Q1A(R2) & Q1E Compliance Program</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right border-r border-slate-200 pr-6">
            <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Environmental Status</p>
            <p className="text-xs text-green-600 font-black uppercase tracking-tighter flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Chambers Logged & Validated
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            Initiate New Study
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Study List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Active Protocols</h3>
          <div className="space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-2">
            {studies.map(study => (
              <button 
                key={study.id} 
                onClick={() => setSelectedStudy(study)}
                className={`w-full text-left p-6 rounded-3xl border-2 transition-all group relative overflow-hidden ${
                  selectedStudy?.id === study.id ? 'border-blue-600 bg-white shadow-xl' : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full ${selectedStudy?.id === study.id ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className={`font-black text-sm transition-colors ${selectedStudy?.id === study.id ? 'text-blue-600' : 'text-slate-800'}`}>{study.product}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Batch: {study.batchNumber} | ID: {study.protocolId}</p>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                    study.status === 'Ongoing' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>{study.status}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Next Analysis</span>
                  <span className="text-[10px] font-black text-blue-600">{study.nextTimePoint}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Study Details & Visualizer */}
        <div className="lg:col-span-2">
          {selectedStudy ? (
            <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden shadow-2xl animate-in fade-in duration-500">
               {/* Background Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                   <div>
                      <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[5px] mb-4">Study Visualizer</h3>
                      <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedStudy.product}</h2>
                      <p className="text-sm font-bold text-slate-400 mt-2">{selectedStudy.condition}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Initiation Date</p>
                      <p className="text-lg font-black text-slate-200">{selectedStudy.startDate}</p>
                   </div>
                </div>

                {/* Timeline Visualizer */}
                <div className="space-y-10 relative">
                  <div className="h-0.5 bg-white/10 absolute left-[22px] top-6 bottom-6 w-0.5"></div>
                  
                  {selectedStudy.intervals.map((label, i) => {
                    const isDone = i === 0; // "Initial" is usually done if it's ongoing
                    const isNext = i === 1; // Simplification for demo
                    
                    return (
                      <div key={label} className="flex items-center gap-8 relative z-10 group cursor-pointer">
                        <div className={`w-12 h-12 rounded-2xl border-4 flex items-center justify-center font-black text-xs transition-all duration-500 ${
                          isDone ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/30' :
                          isNext ? 'bg-blue-600 border-blue-400 animate-pulse shadow-lg shadow-blue-500/50' : 
                          'bg-slate-800 border-slate-700 opacity-50'
                        }`}>
                          {isDone ? '✓' : label === 'Initial' ? 'I' : i}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                             <div>
                                <p className={`text-sm font-black tracking-widest uppercase transition-colors ${isNext ? 'text-blue-400' : isDone ? 'text-green-400' : 'text-slate-500'}`}>{label}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                   {isDone ? 'ANALYSIS COMPLETE' : isNext ? 'SCHEDULED ANALYSIS' : 'WAITING INTERVAL'}
                                </p>
                             </div>
                             {isNext && (
                                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-blue-400 transition-colors">Record Results</button>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-16 grid grid-cols-2 gap-4">
                   <button className="py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Export ICH Q1E Trend Report</button>
                   <button className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 shadow-2xl shadow-blue-600/20 transition-all">Generate Statistical Rationale</button>
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin Controls</p>
                    <div className="flex gap-4">
                      {selectedStudy.status !== 'Completed' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedStudy.id, 'Completed')}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                        >
                          Approve & Close
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteStudy(selectedStudy.id)}
                        className="flex-1 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
                      >
                        Delete Study
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-20 text-center opacity-30">
               <span className="text-9xl mb-6">📉</span>
               <p className="text-xl font-black uppercase tracking-[10px]">Select Protocol</p>
               <p className="text-sm font-bold mt-4">Awaiting selection from Stability Master Register</p>
            </div>
          )}
        </div>
      </div>

      {/* Initiation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-10 space-y-8">
              <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Initiate Study</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[5px] mt-1">New Stability Protocol</p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Product Selection</label>
                    <input 
                      value={product} 
                      onChange={e => setProduct(e.target.value)} 
                      placeholder="e.g. Metronidazole"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-xs" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Batch Linking</label>
                    <input 
                      value={batch} 
                      onChange={e => setBatch(e.target.value)} 
                      placeholder="e.g. BN-2025-001"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-xs" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">ICH Condition</label>
                    <select 
                      value={condition} 
                      onChange={e => setCondition(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none appearance-none"
                    >
                      <option>30°C/75% RH (Zone IVb)</option>
                      <option>25°C/60% RH (Zone II)</option>
                      <option>40°C/75% RH (Accelerated)</option>
                      <option>5°C (Refrigerated)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Study Start Date</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none" 
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                <button 
                  onClick={handleInitiate} 
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Confirm Protocol
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
