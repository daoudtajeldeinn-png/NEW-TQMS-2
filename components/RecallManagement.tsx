
import React, { useState, useEffect } from 'react';
import { User, Status } from '../types';

interface RecallRecord {
  id: string;
  ref: string;
  batch: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  status: Status;
  date: string;
  type: 'Mock' | 'Class I' | 'Class II' | 'Class III';
}

interface RecallManagementProps {
  user?: User | null;
}

const INITIAL_RECALLS: RecallRecord[] = [
  { id: '1', ref: 'HHE-25-001', batch: 'PARA-Batch-Z', risk: 'Low', status: 'Pending', date: '2025-01-30', type: 'Mock' },
  { id: '2', ref: 'HHE-24-912', batch: 'GLY-77-X', risk: 'Critical', status: 'Closed', date: '2024-12-15', type: 'Class I' },
];

export const RecallManagement: React.FC<RecallManagementProps> = ({ user }) => {
  const [recalls, setRecalls] = useState<RecallRecord[]>(() => {
    const saved = localStorage.getItem('pharma_recalls_v1');
    return saved ? JSON.parse(saved) : INITIAL_RECALLS;
  });

  useEffect(() => {
    localStorage.setItem('pharma_recalls_v1', JSON.stringify(recalls));
  }, [recalls]);

  const handleInitiate = (type: RecallRecord['type']) => {
    const newRecall: RecallRecord = {
      id: Date.now().toString(),
      ref: `HHE-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random()*900+100)}`,
      batch: 'TBD',
      risk: type === 'Class I' ? 'Critical' : 'Medium',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      type
    };
    setRecalls([newRecall, ...recalls]);
  };

  const handleUpdateStatus = (id: string, newStatus: Status) => {
    setRecalls(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteRecall = (id: string) => {
    if (!window.confirm('Delete this recall record?')) return;
    setRecalls(prev => prev.filter(r => r.id !== id));
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-red-900 rounded-3xl p-8 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Supply Chain Safety & Recall</h2>
          <p className="text-red-200 text-xs font-bold uppercase tracking-widest mt-1">FDA 21 CFR 7 / ICH Q10 Incident Management</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button onClick={() => handleInitiate('Mock')} className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-xl text-xs font-black uppercase transition-all">Mock Recall Drill</button>
          <button onClick={() => handleInitiate('Class I')} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl text-xs font-black uppercase shadow-xl transition-all">Initiate Class I Recall</button>
        </div>
        <div className="absolute right-0 bottom-0 text-9xl opacity-10 pointer-events-none select-none">🚨</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Health Hazard Evaluation (HHE) Dashboard</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-4 py-3">Ref / Batch</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Risk</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recalls.map((hhe) => (
                    <tr key={hhe.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-4">
                        <p className="text-xs font-black text-slate-800">{hhe.ref}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Lot: {hhe.batch}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black text-slate-600 uppercase">{hhe.type}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-black uppercase ${hhe.risk === 'Critical' ? 'text-red-600' : 'text-blue-600'}`}>{hhe.risk}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          hhe.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                          hhe.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {hhe.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {isAdmin ? (
                          <div className="flex gap-2 justify-end">
                            {hhe.status !== 'Approved' && (
                              <button onClick={() => handleUpdateStatus(hhe.id, 'Approved')} className="text-[9px] font-bold text-blue-600 uppercase hover:underline">Approve</button>
                            )}
                            {hhe.status !== 'Closed' && (
                              <button onClick={() => handleUpdateStatus(hhe.id, 'Closed')} className="text-[9px] font-bold text-slate-500 uppercase hover:underline">Close</button>
                            )}
                            <button onClick={() => handleDeleteRecall(hhe.id)} className="text-[9px] font-bold text-red-600 uppercase hover:underline">Delete</button>
                          </div>
                        ) : (
                          <button className="text-[10px] font-black uppercase text-blue-600 hover:underline">View File</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recall Effectiveness</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                <span>Market Reconciliation</span>
                <span className="text-blue-600">92%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[92%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                <span>Distributor Contacted</span>
                <span className="text-green-600">100%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-full"></div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 tracking-widest">Last Mock Recall</p>
              <p className="text-sm font-black text-slate-800">2024-Q4: Completed In 4.5 Hours</p>
              <p className="text-[10px] text-green-600 font-black uppercase mt-1">✓ PASSED</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
