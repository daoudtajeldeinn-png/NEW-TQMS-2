
import React, { useState, useEffect } from 'react';
import { getOOSInvestigationPlan } from '../geminiService';
import { Status, User } from '../types';

interface OOSRecord {
  id: string;
  test: string;
  result: string;
  spec: string;
  status: Status;
  date: string;
  aiPlan?: any;
}

interface OOSManagementProps {
  user?: User | null;
}

export const OOSManagement: React.FC<OOSManagementProps> = ({ user }) => {
  const [test, setTest] = useState('Assay - Metronidazole');
  const [result, setResult] = useState('88.5%');
  const [spec, setSpec] = useState('99.0% - 101.0%');
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [oosRecords, setOosRecords] = useState<OOSRecord[]>(() => {
    const saved = localStorage.getItem('pharma_oos_records_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pharma_oos_records_v1', JSON.stringify(oosRecords));
  }, [oosRecords]);

  const startInvestigation = async () => {
    setLoading(true);
    try {
      const plan = await getOOSInvestigationPlan(test, result, spec);
      setAiPlan(plan);
    } catch (e) {
      console.error(e);
      alert("Analytical Database Timeout. Please verify instrument logs.");
    } finally {
      setLoading(false);
    }
  };

  const adoptPlanAndLog = () => {
    if (!aiPlan) return;
    const newRecord: OOSRecord = {
      id: `OOS-${Date.now()}`,
      test,
      result,
      spec,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      aiPlan
    };
    setOosRecords([newRecord, ...oosRecords]);
    setAiPlan(null);
  };

  const handleUpdateStatus = (id: string, newStatus: Status) => {
    setOosRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteOOS = (id: string) => {
    if (!window.confirm('Delete this OOS record?')) return;
    setOosRecords(prev => prev.filter(r => r.id !== id));
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header Banner - Updated to Attractive Pink Gradient */}
      <div className="bg-gradient-to-br from-pink-500 via-rose-600 to-fuchsia-700 text-white p-10 rounded-2xl shadow-xl flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter">OOS Investigation Hub</h2>
          <p className="text-[10px] text-pink-100 font-black tracking-[4px] mt-1 opacity-90 uppercase">FDA 21 CFR 211.192 Enforcement Logic</p>
        </div>
        <div className="text-9xl opacity-20 relative z-10 select-none pointer-events-none drop-shadow-lg">🧪</div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
        
        {/* System State Badge */}
        <div className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl border border-white/30 z-10 hidden md:block shadow-lg">
           <p className="text-[8px] font-black uppercase tracking-widest mb-1 text-pink-50">Analytical State</p>
           <p className="text-xs font-black tracking-tight">INVESTIGATION ACTIVE</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center text-xl font-black shadow-inner">!</div>
             <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Incident Intake</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Test Parameter</label>
              <input value={test} onChange={e => setTest(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-300 transition-all" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Failing Result</label>
              <input value={result} onChange={e => setResult(e.target.value)} className="w-full p-4 bg-pink-50 border border-pink-100 rounded-xl text-sm font-black text-pink-700 outline-none focus:ring-4 focus:ring-pink-200/20" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Specification</label>
              <input value={spec} onChange={e => setSpec(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-300" />
            </div>
            <button 
              onClick={startInvestigation}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg shadow-pink-200 active:scale-[0.98]"
            >
              {loading ? 'Consulting Rationale...' : '✨ Generate AI Investigation'}
            </button>
          </div>
        </div>

        {/* AI Results Section */}
        <div className="lg:col-span-2 h-full">
          {aiPlan ? (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-xl animate-in zoom-in-95 h-full flex flex-col">
              <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">Investigation Protocol</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">AI-Powered Compliance Rationale</p>
                </div>
                <span className="px-4 py-2 bg-pink-100 text-pink-700 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-pink-200">Phase I Scoped</span>
              </div>

              <div className="space-y-10 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-[3px] flex items-center gap-2">
                      <span className="w-2 h-2 bg-pink-600 rounded-full shadow-[0_0_8px_rgba(219,39,119,0.5)]"></span> Immediate Lab Actions
                    </h4>
                    <div className="space-y-3">
                      {aiPlan.immediateActions.map((item: string, i: number) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-700 flex gap-4 hover:border-pink-200 transition-colors cursor-default">
                          <span className="text-pink-400 font-black">0{i+1}</span> {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[3px] flex items-center gap-2">
                      <span className="w-2 h-2 bg-rose-600 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.5)]"></span> Analyst Checklist
                    </h4>
                    <div className="space-y-1">
                      {aiPlan.analystChecklist.map((item: string, i: number) => (
                        <label key={i} className="flex gap-3 items-center text-[11px] font-bold text-slate-600 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-200">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 blur-3xl transition-all group-hover:bg-pink-500/20"></div>
                  <h4 className="text-[9px] font-black text-pink-400 uppercase tracking-[5px] mb-3 relative z-10">Retest Strategy Rationale</h4>
                  <p className="text-xs font-medium text-slate-300 leading-relaxed italic border-l-2 border-pink-500 pl-4 relative z-10">"{aiPlan.retestStrategy}"</p>
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-4 pt-8 border-t border-slate-100">
                <button onClick={() => setAiPlan(null)} className="px-8 py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-xl transition-all">Dismiss</button>
                <button onClick={adoptPlanAndLog} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-95">Adopt Plan & Log</button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-20 text-center text-slate-300 transition-opacity">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center text-5xl mb-6 grayscale opacity-40">📊</div>
              <p className="font-bold uppercase tracking-[8px] text-sm text-slate-400">Analysis Pending</p>
              <p className="text-xs font-medium mt-4 max-w-xs text-slate-400">Execute the AI engine to generate an attractive, compliant investigation rationale for Phase I failures.</p>
            </div>
          )}
        </div>
      </div>
      {/* OOS Records Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">OOS Investigation Log</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{oosRecords.length} Records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Test</th>
                <th className="px-6 py-4">Result</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {oosRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{record.id.split('-')[1]}</td>
                  <td className="px-6 py-4 text-slate-500">{record.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{record.test}</td>
                  <td className="px-6 py-4 text-pink-600 font-bold">{record.result}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      record.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                      record.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                      <div className="flex gap-2 justify-end">
                        {record.status !== 'Approved' && (
                          <button onClick={() => handleUpdateStatus(record.id, 'Approved')} className="text-[9px] font-bold text-blue-600 uppercase hover:underline">Approve</button>
                        )}
                        {record.status !== 'Closed' && (
                          <button onClick={() => handleUpdateStatus(record.id, 'Closed')} className="text-[9px] font-bold text-slate-500 uppercase hover:underline">Close</button>
                        )}
                        <button onClick={() => handleDeleteOOS(record.id)} className="text-[9px] font-bold text-red-600 uppercase hover:underline">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {oosRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-300 font-bold uppercase tracking-[8px]">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
