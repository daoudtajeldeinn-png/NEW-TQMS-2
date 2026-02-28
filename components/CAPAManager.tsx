
import React, { useState, useEffect } from 'react';
import { CAPA, User } from '../types';
import { getCAPASuggestions } from '../geminiService';

const INITIAL_MOCK_CAPAS: CAPA[] = [
  { id: '1', number: 'CAPA-24-001', source: 'Deviation', sourceRef: 'D24-441', description: 'Install automated temp monitoring in Cold Room B', type: 'Preventive', owner: 'M. Thompson', dueDate: '2025-03-15', status: 'In Progress' },
  { id: '2', number: 'CAPA-24-002', source: 'Audit', sourceRef: 'IA-2024-05', description: 'Update HPLC Calibration SOP', type: 'Corrective', owner: 'S. Chen', dueDate: '2025-02-10', status: 'Completed', verificationDate: '2025-02-12' },
];

interface CAPAManagerProps {
  user?: User | null;
  preFillSourceRef?: string | null;
  onClearPreFill?: () => void;
}

export const CAPAManager: React.FC<CAPAManagerProps> = ({ user, preFillSourceRef, onClearPreFill }) => {
  const [capas, setCapas] = useState<CAPA[]>(() => {
    const saved = localStorage.getItem('pharma_capa_v4');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_CAPAS;
  });
  const [selectedCapa, setSelectedCapa] = useState<CAPA | null>(capas[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CAPA>>({
    source: 'Deviation', sourceRef: '', description: '', type: 'Corrective', owner: '', dueDate: new Date().toISOString().split('T')[0], status: 'Pending'
  });

  useEffect(() => {
    if (preFillSourceRef) {
      setFormData(prev => ({ ...prev, source: 'Deviation', sourceRef: preFillSourceRef }));
      setIsModalOpen(true);
      if (onClearPreFill) onClearPreFill();
    }
  }, [preFillSourceRef, onClearPreFill]);

  useEffect(() => { localStorage.setItem('pharma_capa_v4', JSON.stringify(capas)); }, [capas]);

  const handleCreateCAPA = () => {
    if (!formData.description || !formData.owner) return;
    const newCapa: CAPA = { ...formData as CAPA, id: Date.now().toString(), number: `CAPA-25-${capas.length + 101}`, status: 'Pending' };
    setCapas([newCapa, ...capas]);
    setSelectedCapa(newCapa);
    setIsModalOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: CAPA['status']) => {
    const updatedCapas = capas.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCapas(updatedCapas);
    if (selectedCapa?.id === id) {
      setSelectedCapa({ ...selectedCapa, status: newStatus });
    }
  };

  const handleDeleteCAPA = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this CAPA?')) return;
    const updatedCapas = capas.filter(c => c.id !== id);
    setCapas(updatedCapas);
    if (selectedCapa?.id === id) {
      setSelectedCapa(updatedCapas[0] || null);
    }
  };

  const suggestRCA = async () => {
    if (!formData.description) return;
    setAiLoading(true);
    try {
      const suggestions = await getCAPASuggestions(formData.description);
      setFormData(prev => ({ ...prev, description: `RCA: ${suggestions.rootCause}. \nAction: ${suggestions.correctiveAction} ${suggestions.preventiveAction}` }));
    } finally { setAiLoading(false); }
  };

  const stages = ['Initiation', 'Investigation', 'Planning', 'Implementation', 'Verification'];
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">CAPA Lifecycle</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Corrective & Preventive Action Portfolio</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm">
          + Open CAPA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Ledger List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200"><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action Ledger</h3></div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {capas.map(capa => (
              <button key={capa.id} onClick={() => setSelectedCapa(capa)} className={`w-full text-left p-4 transition-all ${selectedCapa?.id === capa.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{capa.number}</span>
                  <span className={`text-[8px] font-bold uppercase ${
                    capa.status === 'Completed' ? 'text-green-600' : 
                    capa.status === 'Approved' ? 'text-blue-600' :
                    capa.status === 'Closed' ? 'text-slate-500' :
                    'text-amber-600'
                  }`}>{capa.status}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 line-clamp-1 truncate">{capa.description}</p>
                <p className="text-[9px] text-slate-400 mt-2">Owner: {capa.owner} | Due: {capa.dueDate}</p>
              </button>
            ))}
          </div>
        </div>

        {/* View Panel */}
        <div className="lg:col-span-3">
          {selectedCapa ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-right-2">
              <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">{selectedCapa.type} • {selectedCapa.number}</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-3 leading-tight">{selectedCapa.description}</h3>
                  <div className="flex gap-4 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Source: {selectedCapa.source} ({selectedCapa.sourceRef})</span>
                  </div>
                </div>
                <div className="md:text-right shrink-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Completion</p>
                  <p className="text-lg font-bold text-slate-800">{selectedCapa.dueDate}</p>
                </div>
              </div>

              {/* Admin Controls */}
              {isAdmin && (
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="w-full text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Controls</p>
                  {selectedCapa.status !== 'Approved' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedCapa.id, 'Approved')}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-[9px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                      Approve
                    </button>
                  )}
                  {selectedCapa.status !== 'Closed' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedCapa.id, 'Closed')}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Close
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteCAPA(selectedCapa.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Minimal Stepper */}
              <div className="flex justify-between items-center relative py-4">
                <div className="absolute left-0 right-0 h-0.5 bg-slate-100 top-1/2 -translate-y-1/2"></div>
                {stages.map((label, idx) => {
                  const isActive = selectedCapa.status === 'In Progress' && idx <= 2;
                  const isDone = selectedCapa.status === 'Completed' || selectedCapa.status === 'Approved' || selectedCapa.status === 'Closed' || (selectedCapa.status === 'In Progress' && idx < 2);
                  return (
                    <div key={label} className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-[10px] transition-all ${isDone ? 'bg-green-600 border-green-600 text-white' : isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <p className={`mt-2 text-[9px] font-bold uppercase tracking-tighter ${isDone || isActive ? 'text-slate-800' : 'text-slate-400'}`}>{label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Process Lead</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">{selectedCapa.owner[0]}</div>
                    <span className="text-sm font-bold text-slate-800">{selectedCapa.owner}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg text-white shadow-lg">
                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1">Current Lifecycle State</p>
                  <p className="text-lg font-bold uppercase tracking-tight">{selectedCapa.status}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 font-bold uppercase text-xs tracking-widest">Select Record</div>
          )}
        </div>
      </div>

      {/* Initiation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider">Initiate Action Plan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Source</label>
                  <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value as any})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none">
                    <option>Deviation</option><option>Audit</option><option>OOS</option>
                  </select>
                </div>
                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Ref ID</label>
                  <input value={formData.sourceRef} onChange={e => setFormData({...formData, sourceRef: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none" placeholder="e.g. D24-441" />
                </div>
              </div>
              <div><div className="flex justify-between items-center mb-1"><label className="block text-[9px] font-bold text-slate-400 uppercase">Action Plan Description</label>
                <button onClick={suggestRCA} disabled={aiLoading || !formData.description} className="text-[8px] font-bold text-blue-600 uppercase hover:underline">✨ AI RCA Suggestion</button></div>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-xs min-h-[100px] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Type</label>
                  <div className="flex gap-1">
                    {['Corrective', 'Preventive'].map(t => <button key={t} onClick={() => setFormData({...formData, type: t as any})} className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase ${formData.type === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{t}</button>)}
                  </div>
                </div>
                <div><label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Owner</label>
                  <input value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 font-bold text-[10px] uppercase hover:bg-slate-200 rounded">Cancel</button>
              <button onClick={handleCreateCAPA} className="px-6 py-2 bg-blue-600 text-white rounded text-[10px] font-bold uppercase tracking-widest">Commit CAPA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
