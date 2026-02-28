
import React, { useState } from 'react';
import { ChangeRequest, User } from '../types';
import { getRegulatoryChangeImpact } from '../geminiService';
import { triggerNotification } from '../NotificationService';

const MOCK_CHANGES: ChangeRequest[] = [
  {
    id: 'CC-2025-001',
    number: 'CCR-25-001',
    title: 'Upgrade Filter Integrity Tester',
    description: 'Replacing manual bubble point tester with Automated Palltronic Flowstar V.',
    category: 'Equipment',
    status: 'In Progress',
    priority: 'Major',
    riskScore: 6,
    impacts: ['Validation', 'Analytical'],
    dateInitiated: '2025-01-10',
    initiatedBy: 'Dr. Sarah Chen',
    tasks: [
      { id: '1', description: 'Draft IQ/OQ Protocol', owner: 'M. Thompson', status: 'Completed' },
      { id: '2', description: 'Update SOP-LAB-045', owner: 'S. Chen', status: 'Open' }
    ]
  },
  {
    id: 'CC-2025-002',
    number: 'CCR-25-002',
    title: 'Switching API Supplier for Metronidazole',
    description: 'Introducing secondary supplier (GlobalChem Ltd) to mitigate supply chain risks.',
    category: 'Analytical',
    status: 'Under Review',
    priority: 'Critical',
    riskScore: 9,
    impacts: ['Regulatory', 'Stability', 'Supplier'],
    dateInitiated: '2025-01-15',
    initiatedBy: 'A. Reynolds',
    tasks: []
  }
];

export const ChangeControl: React.FC<{ user: User }> = ({ user }) => {
  const [changes, setChanges] = useState<ChangeRequest[]>(MOCK_CHANGES);
  const [selectedCC, setSelectedCC] = useState<ChangeRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<ChangeRequest['category']>('Process');

  const analyzeWithAI = async () => {
    if (!title || !desc) return;
    setAiLoading(true);
    try {
      const result = await getRegulatoryChangeImpact(title, desc);
      setAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreate = () => {
    const newCC: ChangeRequest = {
      id: `CC-${Date.now()}`,
      number: `CCR-25-00${changes.length + 3}`,
      title,
      description: desc,
      category,
      status: 'Pending',
      priority: aiResult?.riskScore > 7 ? 'Critical' : 'Major',
      riskScore: aiResult?.riskScore,
      impacts: aiResult?.impactsFound || [],
      tasks: aiResult?.suggestedTasks?.map((t: string, i: number) => ({
        id: i.toString(),
        description: t,
        owner: 'TBD',
        status: 'Open'
      })) || [],
      dateInitiated: new Date().toISOString().split('T')[0],
      initiatedBy: user.fullName
    };

    setChanges([newCC, ...changes]);
    triggerNotification(user, 'Task', 'High', 'New Change Request Logged', `${newCC.number} requires impact assessment approval.`);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDesc('');
    setCategory('Process');
    setAiResult(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Change Management Portal</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Regulatory & Quality System Alignment</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2"
        >
          <span>🔄</span> Initiate Change Request
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Change List */}
        <div className="lg:col-span-2 space-y-4">
          {changes.map(cc => (
            <div 
              key={cc.id}
              onClick={() => setSelectedCC(cc)}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer bg-white shadow-sm ${
                selectedCC?.id === cc.id ? 'border-blue-500 shadow-md ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 py-1 bg-blue-50 rounded">
                    {cc.number}
                  </span>
                  {cc.riskScore !== undefined && (
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                      cc.riskScore > 7 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                      Risk Score: {cc.riskScore}/10
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                  cc.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                  cc.status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {cc.status}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">{cc.title}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{cc.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {cc.impacts.map(impact => (
                  <span key={impact} className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase border border-slate-200">
                    {impact}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedCC ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm sticky top-8 animate-in slide-in-from-right-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[4px] mb-6">Change Detail</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl text-white">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Risk Profile</p>
                    <p className="text-xs font-bold text-slate-200 uppercase tracking-widest">{selectedCC.priority} Impact</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">AI Risk Score</p>
                    <p className={`text-2xl font-black ${selectedCC.riskScore && selectedCC.riskScore > 7 ? 'text-red-400' : 'text-blue-400'}`}>
                      {selectedCC.riskScore !== undefined ? `${selectedCC.riskScore}/10` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Impact Analysis</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">GMP Validation</p>
                      <p className="text-xs font-black text-slate-700">{selectedCC.impacts.includes('Validation') ? 'REQUIRED' : 'NO IMPACT'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Regulatory Filing</p>
                      <p className="text-xs font-black text-slate-700">{selectedCC.impacts.includes('Regulatory') ? 'VARIATION REQ.' : 'NO IMPACT'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Implementation Tasks</p>
                  <div className="space-y-2">
                    {selectedCC.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group hover:bg-blue-50 transition-colors">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                          task.status === 'Completed' ? 'bg-green-500 border-green-500' : 'border-slate-300'
                        }`}>
                          {task.status === 'Completed' && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {task.description}
                          </p>
                          <p className="text-[9px] text-slate-400 font-black uppercase">{task.owner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Controls */}
                {user?.role?.toLowerCase() === 'admin' && (
                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Admin Controls</p>
                    <div className="flex gap-2">
                      {selectedCC.status !== 'Approved' && (
                        <button 
                          onClick={() => {
                            const updated = { ...selectedCC, status: 'Approved' as const };
                            setChanges(prev => prev.map(c => c.id === updated.id ? updated : c));
                            setSelectedCC(updated);
                          }}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-green-700 transition-all"
                        >
                          Approve
                        </button>
                      )}
                      {selectedCC.status !== 'Closed' && (
                        <button 
                          onClick={() => {
                            const updated = { ...selectedCC, status: 'Closed' as const };
                            setChanges(prev => prev.map(c => c.id === updated.id ? updated : c));
                            setSelectedCC(updated);
                          }}
                          className="flex-1 py-2 bg-slate-800 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all"
                        >
                          Close
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (window.confirm('Delete this change request?')) {
                            setChanges(prev => prev.filter(c => c.id !== selectedCC.id));
                            setSelectedCC(null);
                          }
                        }}
                        className="flex-1 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-100 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Sign with 21 CFR E-Signature
                  </button>
                  <button className="w-full py-3 bg-white text-slate-400 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50">
                    View Impact Matrix
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-slate-400 opacity-50">
              <span className="text-6xl mb-4">🔍</span>
              <p className="font-black uppercase tracking-widest text-center text-xs">Select a Change Request to view regulatory lifecycle</p>
            </div>
          )}
        </div>
      </div>

      {/* Initiation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left Form */}
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Initiate CCR</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">ICH Q10 Compliant Change Control</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Proposal Title</label>
                    <input 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. HVAC Filter Redundancy Installation"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Proposed Change Rationale</label>
                    <textarea 
                      value={desc}
                      onChange={e => setDesc(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-32"
                      placeholder="Describe current state and benefit of proposed state..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">System Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Process', 'Equipment', 'Facility', 'IT', 'Document', 'Analytical'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat as any)}
                          className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            category === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={analyzeWithAI}
                    disabled={aiLoading || !title}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    {aiLoading ? 'AI Scoping...' : '✨ Run Impact AI'}
                  </button>
                </div>
              </div>

              {/* Right Results (AI Analysis) */}
              <div className="bg-slate-50 p-8 border-l border-slate-100 overflow-y-auto max-h-[80vh] custom-scrollbar">
                {aiResult ? (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase">Regulatory Scoping Result</span>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Risk Score</p>
                        <p className={`text-xl font-black ${aiResult.riskScore > 7 ? 'text-red-600' : 'text-blue-600'}`}>{aiResult.riskScore}/10</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Regulatory Impact</h4>
                      <div className="space-y-2">
                        {aiResult.regulatoryImplications.map((imp: string, i: number) => (
                          <div key={i} className="flex gap-2 items-start text-xs font-bold text-slate-700">
                            <span className="text-blue-500">•</span>
                            {imp}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Recommended GxP Tasks</h4>
                      <div className="space-y-2">
                        {aiResult.suggestedTasks.map((task: string, i: number) => (
                          <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                      aiResult.isValidationRequired ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'
                    }`}>
                      <p className="text-[10px] font-black uppercase">Impact on Validated State</p>
                      <p className="text-xs font-black">{aiResult.isValidationRequired ? 'RE-VALIDATION REQ' : 'VERIFICATION ONLY'}</p>
                    </div>

                    <button 
                      onClick={handleCreate}
                      className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all"
                    >
                      Confirm & Submit Request
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner">
                      <span className="text-3xl grayscale opacity-30">✨</span>
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Awaiting Proposal Data...</p>
                    <p className="text-xs text-slate-400">Run AI Impact to automatically map ICH/FDA requirements</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
