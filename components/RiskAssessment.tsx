
import React, { useState, useEffect } from 'react';
import { analyzeRiskFMEA, getHazardScout } from '../geminiService';
import { RiskRegisterEntry, User } from '../types';

interface RiskAssessmentProps {
  user?: User | null;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ user }) => {
  const [processStep, setProcessStep] = useState('');
  const [hazard, setHazard] = useState('');
  const [loading, setLoading] = useState(false);
  const [scouting, setScouting] = useState(false);
  
  const [scores, setScores] = useState({ s: 5, o: 5, d: 5 });
  const [fmea, setFmea] = useState<any>(null);
  const [scoutedHazards, setScoutedHazards] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState<RiskRegisterEntry | null>(null);
  
  const [riskRegister, setRiskRegister] = useState<RiskRegisterEntry[]>(() => {
    const saved = localStorage.getItem('pharma_risk_register_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pharma_risk_register_v1', JSON.stringify(riskRegister));
  }, [riskRegister]);

  const handleHazardScout = async () => {
    if (!processStep) return;
    setScouting(true);
    try {
      const results = await getHazardScout(processStep);
      setScoutedHazards(results);
    } finally {
      setScouting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!processStep || !hazard) return;
    setLoading(true);
    try {
      const result = await analyzeRiskFMEA(processStep, hazard);
      setFmea(result);
      setScores({ s: result.severity, o: result.occurrence, d: result.detection });
    } catch (e) {
      alert("AI analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const commitToRegister = () => {
    if (!fmea || !processStep) return;
    const rpn = scores.s * scores.o * scores.d;
    const date = new Date().toISOString().split('T')[0];
    const residualRisk = getRiskClass(rpn).label as any;

    if (editingId) {
      setRiskRegister(prev => prev.map(entry => {
        if (entry.id === editingId) {
          const historyEntry = {
            date: entry.date,
            severity: entry.severity,
            occurrence: entry.occurrence,
            detection: entry.detection,
            rpn: entry.rpn,
            mitigation: entry.mitigation,
            residualRisk: entry.residualRisk
          };
          return {
            ...entry,
            severity: scores.s,
            occurrence: scores.o,
            detection: scores.d,
            rpn,
            mitigation: fmea.recommendedMitigation,
            residualRisk,
            date,
            history: [historyEntry, ...(entry.history || [])]
          };
        }
        return entry;
      }));
      setEditingId(null);
    } else {
      const newEntry: RiskRegisterEntry = {
        id: `RISK-${Date.now()}`,
        processStep,
        hazard,
        severity: scores.s,
        occurrence: scores.o,
        detection: scores.d,
        rpn,
        mitigation: fmea.recommendedMitigation,
        residualRisk,
        status: 'Pending',
        date
      };
      setRiskRegister([newEntry, ...riskRegister]);
    }

    setFmea(null);
    setProcessStep('');
    setHazard('');
    setScoutedHazards([]);
  };

  const handleReassess = (entry: RiskRegisterEntry) => {
    setProcessStep(entry.processStep);
    setHazard(entry.hazard);
    setScores({ s: entry.severity, o: entry.occurrence, d: entry.detection });
    setFmea({ 
      potentialEffect: 'Previous Assessment Data Loaded', 
      recommendedMitigation: entry.mitigation 
    });
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateStatus = (id: string, newStatus: RiskRegisterEntry['status']) => {
    setRiskRegister(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteRisk = (id: string) => {
    if (!window.confirm('Delete this risk entry?')) return;
    setRiskRegister(prev => prev.filter(r => r.id !== id));
  };

  const getRiskClass = (rpn: number) => {
    if (rpn > 125) return { label: 'Critical', color: 'bg-rose-600', text: 'text-rose-600' };
    if (rpn > 64) return { label: 'High', color: 'bg-orange-500', text: 'text-orange-500' };
    if (rpn > 27) return { label: 'Medium', color: 'bg-blue-500', text: 'text-blue-500' };
    return { label: 'Low', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // 5x5 Grid Heatmap Logic
  const getCellColor = (s: number, o: number) => {
    const score = s * o;
    if (score >= 20) return 'bg-rose-500';
    if (score >= 12) return 'bg-orange-400';
    if (score >= 6) return 'bg-blue-400';
    return 'bg-emerald-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* History Modal */}
      {viewingHistory && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Risk Assessment History</h3>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[8px] mt-1">{viewingHistory.processStep} • {viewingHistory.hazard}</p>
              </div>
              <button onClick={() => setViewingHistory(null)} className="text-2xl hover:text-blue-400 transition-colors">✕</button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Current Version */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Version (Active)</p>
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-[32px] grid grid-cols-4 gap-6 items-center">
                  <div className="col-span-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Date</p>
                    <p className="text-sm font-black text-slate-800">{viewingHistory.date}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">RPN</p>
                    <p className="text-xl font-black text-slate-900">{viewingHistory.rpn}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Mitigation</p>
                    <p className="text-xs font-medium text-slate-600 italic line-clamp-2">{viewingHistory.mitigation}</p>
                  </div>
                </div>
              </div>

              {/* Previous Versions */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous Assessments</p>
                <div className="space-y-4">
                  {viewingHistory.history?.map((h, idx) => (
                    <div key={idx} className="p-6 bg-white border border-slate-100 rounded-[32px] grid grid-cols-4 gap-6 items-center hover:border-slate-200 transition-all">
                      <div className="col-span-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Date</p>
                        <p className="text-sm font-black text-slate-600">{h.date}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">RPN</p>
                        <p className="text-lg font-black text-slate-500">{h.rpn}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Residual</p>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getRiskClass(h.rpn).color} text-white`}>
                          {h.residualRisk}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button 
                          onClick={() => {
                            const restored = {
                              ...viewingHistory,
                              severity: h.severity,
                              occurrence: h.occurrence,
                              detection: h.detection,
                              rpn: h.rpn,
                              mitigation: h.mitigation,
                              residualRisk: h.residualRisk,
                              date: h.date,
                              // Move current to history and remove this one from history
                              history: [
                                {
                                  date: viewingHistory.date,
                                  severity: viewingHistory.severity,
                                  occurrence: viewingHistory.occurrence,
                                  detection: viewingHistory.detection,
                                  rpn: viewingHistory.rpn,
                                  mitigation: viewingHistory.mitigation,
                                  residualRisk: viewingHistory.residualRisk
                                },
                                ...(viewingHistory.history?.filter((_, i) => i !== idx) || [])
                              ]
                            };
                            setRiskRegister(prev => prev.map(r => r.id === restored.id ? restored : r));
                            setViewingHistory(null);
                          }}
                          className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                        >
                          Revert to this
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!viewingHistory.history || viewingHistory.history.length === 0) && (
                    <div className="p-12 border-2 border-dashed border-slate-100 rounded-[32px] text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
                      No prior assessments found
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setViewingHistory(null)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Close History</button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ICH Q9 Quality Risk Management</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lifecycle Risk Register & Hazard Scouting</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Register Size</p>
            <p className="text-xs font-black text-blue-600">{riskRegister.length} Active Profiles</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input & Scout Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm font-black">1</div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Risk Scope</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Process Step</label>
                <div className="flex gap-2">
                  <input 
                    value={processStep}
                    onChange={e => setProcessStep(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="e.g. Filling Line A"
                  />
                  <button 
                    onClick={handleHazardScout}
                    disabled={scouting || !processStep}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-black disabled:opacity-50"
                  >
                    Scout
                  </button>
                </div>
              </div>

              {scoutedHazards.length > 0 && (
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 animate-in slide-in-from-top-2">
                  <p className="text-[9px] font-bold text-blue-600 uppercase mb-3">AI Scout Suggestions:</p>
                  <div className="space-y-2">
                    {scoutedHazards.map((h, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setHazard(h.hazard);
                          setFmea({ potentialEffect: h.potentialEffect, recommendedMitigation: h.suggestedMitigation });
                        }}
                        className="w-full text-left p-2 bg-white border border-blue-100 rounded text-[10px] font-bold text-slate-700 hover:bg-blue-100 transition-all"
                      >
                        ⚠ {h.hazard}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Hazard Description</label>
                <textarea 
                  value={hazard}
                  onChange={e => setHazard(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium h-24 outline-none"
                  placeholder="Describe the potential failure mode..."
                />
              </div>

              <button 
                onClick={handleAnalyze}
                disabled={loading || !hazard}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 shadow-sm"
              >
                {loading ? 'Analyzing...' : 'Run FMEA Analysis'}
              </button>
            </div>
          </div>

          {/* Visual Heatmap Overlay */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Heatmap (S x O)</h3>
             <div className="grid grid-cols-6 gap-1">
                <div className="col-span-1"></div>
                {[1,2,3,4,5].map(v => <div key={v} className="text-center text-[8px] font-bold text-slate-400">O:{v}</div>)}
                {[1,2,3,4,5].map(s => (
                  <React.Fragment key={s}>
                    <div className="text-[8px] font-bold text-slate-400 flex items-center justify-end pr-1">S:{s}</div>
                    {[1,2,3,4,5].map(o => {
                      const isActive = scores.s === s && scores.o === o;
                      return (
                        <div 
                          key={`${s}-${o}`} 
                          className={`aspect-square rounded-[2px] ${getCellColor(s,o)} opacity-40 transition-all ${isActive ? 'ring-4 ring-slate-900 opacity-100 scale-110' : ''}`}
                        ></div>
                      );
                    })}
                  </React.Fragment>
                ))}
             </div>
          </div>
        </div>

        {/* Results & Register Column */}
        <div className="lg:col-span-8 space-y-6">
          {fmea ? (
            <div className="bg-slate-900 text-white p-8 rounded-xl shadow-xl space-y-8 animate-in zoom-in-95">
               <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Assessment Outcome</h4>
                    <p className="text-lg font-bold">{processStep}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Risk Priority Number</p>
                    <p className="text-4xl font-black">{scores.s * scores.o * scores.d}</p>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-4">
                  {[
                    { l: 'Severity', v: scores.s, k: 's' },
                    { l: 'Occurrence', v: scores.o, k: 'o' },
                    { l: 'Detection', v: scores.d, k: 'd' },
                  ].map(sc => (
                    <div key={sc.l} className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <p className="text-[9px] text-slate-500 uppercase font-bold mb-2">{sc.l}</p>
                      <input 
                        type="number" min="1" max="10" 
                        value={sc.v} 
                        onChange={e => setScores({...scores, [sc.k]: parseInt(e.target.value)})}
                        className="bg-transparent text-2xl font-black text-center w-12 outline-none border-b border-white/20"
                      />
                    </div>
                  ))}
               </div>

               <div className="space-y-6">
                  <div className="p-5 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2">Effect Hypothesis</p>
                    <p className="text-sm font-medium text-slate-200">{fmea.potentialEffect}</p>
                  </div>
                  <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Mitigation Strategy</p>
                    <p className="text-sm font-bold text-white">{fmea.recommendedMitigation}</p>
                  </div>
               </div>

               <div className="flex justify-between items-center pt-4">
                  <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getRiskClass(scores.s * scores.o * scores.d).color}`}>
                    Residual: {getRiskClass(scores.s * scores.o * scores.d).label}
                  </div>
                  <button onClick={commitToRegister} className="px-8 py-2 bg-white text-slate-900 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg hover:bg-slate-100">
                    Commit to Register
                  </button>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
               <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Formal Risk Register</h3>
                  <button onClick={() => setRiskRegister([])} className="text-[8px] font-bold text-slate-400 uppercase hover:text-red-500">Clear Register</button>
               </div>
               <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      <tr className="border-b">
                        <th className="p-3">Step</th>
                        <th className="p-3">Hazard</th>
                        <th className="p-3">RPN</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {riskRegister.map(entry => (
                        <tr key={entry.id} className="text-xs hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-800">
                            {entry.processStep}
                            {entry.history && entry.history.length > 0 && (
                              <button 
                                onClick={() => setViewingHistory(entry)}
                                className="ml-2 text-[8px] bg-slate-100 text-slate-500 px-1 rounded hover:bg-slate-200"
                              >
                                v{entry.history.length + 1}
                              </button>
                            )}
                          </td>
                          <td className="p-3 text-slate-500 truncate max-w-[150px]">{entry.hazard}</td>
                          <td className="p-3 font-black text-slate-900">{entry.rpn}</td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getRiskClass(entry.rpn).color} text-white text-center`}>
                                {entry.residualRisk}
                              </span>
                              <span className={`text-[8px] font-bold uppercase text-center ${
                                entry.status === 'Approved' ? 'text-blue-600' : 
                                entry.status === 'Closed' ? 'text-slate-500' : 
                                'text-amber-600'
                              }`}>
                                {entry.status || 'Pending'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                             <div className="flex flex-col gap-1 items-end">
                               <div className="flex gap-1">
                                 <button onClick={() => handleReassess(entry)} className="text-[8px] font-bold text-indigo-600 uppercase hover:underline">Re-assess</button>
                                 {isAdmin && (
                                   <>
                                     {entry.status !== 'Approved' && (
                                       <button onClick={() => handleUpdateStatus(entry.id, 'Approved')} className="text-[8px] font-bold text-blue-600 uppercase hover:underline">Approve</button>
                                     )}
                                     {entry.status !== 'Closed' && (
                                       <button onClick={() => handleUpdateStatus(entry.id, 'Closed')} className="text-[8px] font-bold text-slate-500 uppercase hover:underline">Close</button>
                                     )}
                                     <button onClick={() => handleDeleteRisk(entry.id)} className="text-[8px] font-bold text-red-600 uppercase hover:underline">Delete</button>
                                   </>
                                 )}
                               </div>
                               {entry.rpn > 100 && (
                                 <button className="text-[8px] font-bold text-rose-600 uppercase hover:underline">Link CAPA</button>
                               )}
                             </div>
                          </td>
                        </tr>
                      ))}
                      {riskRegister.length === 0 && (
                        <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">No entries recorded</td></tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
