
import React, { useState, useEffect } from 'react';
import { getAuditChecklist } from '../geminiService';
import { AuditRecord, User, Status } from '../types';

interface AuditManagerProps {
  user?: User | null;
}

export const AuditManager: React.FC<AuditManagerProps> = ({ user }) => {
  const [department, setDepartment] = useState('');
  const [checklist, setChecklist] = useState<{checkItem: string, regulatoryRef: string, completed: boolean}[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() => {
    const saved = localStorage.getItem('pharma_audit_records_v1');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pharma_audit_records_v1', JSON.stringify(auditRecords));
  }, [auditRecords]);

  const generateChecklist = async () => {
    if (!department) return;
    setLoading(true);
    try {
      const result = await getAuditChecklist(department);
      setChecklist(result.map((item: any) => ({ ...item, completed: false })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitAudit = () => {
    if (checklist.length === 0) return;
    const newRecord: AuditRecord = {
      id: `AUDIT-${Date.now()}`,
      department,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      checklist: [...checklist],
      auditor: user?.fullName || 'System'
    };
    setAuditRecords([newRecord, ...auditRecords]);
    setChecklist([]);
    setDepartment('');
  };

  const handleUpdateStatus = (id: string, newStatus: Status) => {
    setAuditRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const handleDeleteAudit = (id: string) => {
    if (!window.confirm('Delete this audit record?')) return;
    setAuditRecords(prev => prev.filter(r => r.id !== id));
  };

  const toggleCheckItem = (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx].completed = !newChecklist[idx].completed;
    setChecklist(newChecklist);
  };

  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Audit Record Detail</h3>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[8px] mt-1">{selectedRecord.department} • {selectedRecord.date}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-2xl hover:text-blue-400 transition-colors">✕</button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Auditor</p>
                  <p className="text-sm font-black text-slate-800">{selectedRecord.auditor}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                  <p className="text-sm font-black text-slate-800">{selectedRecord.status}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checklist Verification</p>
                {selectedRecord.checklist.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${item.completed ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                      {item.completed ? '✓' : '○'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">{item.checkItem}</p>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase mt-1 inline-block">{item.regulatoryRef}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedRecord(null)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Close Detail</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Audit Preparation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Department</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select Department...</option>
                  <option value="Packaging Line 3">Packaging Line 3</option>
                  <option value="Stability Chambers">Stability Chambers</option>
                  <option value="Purified Water System">Purified Water System</option>
                  <option value="Sterile Filling">Sterile Filling</option>
                </select>
              </div>
              <button 
                onClick={generateChecklist}
                disabled={loading || !department}
                className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Analyzing GMP...' : '✨ Generate AI Checklist'}
              </button>
            </div>
          </div>

          <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold mb-2">Upcoming Audit Notification</h4>
              <p className="text-blue-100 text-sm mb-4">FDA Inspection simulated window starts in 48 hours.</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold">Review Readiness Plan</button>
            </div>
            <span className="absolute -bottom-4 -right-4 text-7xl opacity-10">📋</span>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {checklist.length > 0 ? (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Dynamic Audit Checklist: <span className="text-blue-600">{department}</span></h3>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500">Self-Inspection Mode</span>
              </div>
              <div className="space-y-4">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors group">
                    <div className="mt-1">
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={() => toggleCheckItem(idx)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="flex-1">
                      <p className={`text-slate-800 font-medium mb-1 ${item.completed ? 'line-through opacity-50' : ''}`}>{item.checkItem}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">{item.regulatoryRef}</span>
                        <button className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold hover:text-blue-500">Attach Evidence</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button onClick={() => setChecklist([])} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Discard</button>
                <button onClick={submitAudit} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">Submit Audit Record</button>
              </div>
            </div>
          ) : (
            <div className="h-96 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-white shadow-sm">
              <span className="text-5xl mb-4">🔍</span>
              <p className="font-medium">Select a department to generate a GMP-compliant checklist</p>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Audit History Log</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{auditRecords.length} Records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Auditor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {auditRecords.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{record.id.split('-')[1]}</td>
                  <td className="px-6 py-4 text-slate-500">{record.date}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{record.department}</td>
                  <td className="px-6 py-4 text-slate-600">{record.auditor}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      record.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      record.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setSelectedRecord(record)} className="text-[9px] font-bold text-indigo-600 uppercase hover:underline">View</button>
                      {isAdmin && (
                        <>
                          {record.status !== 'Approved' && (
                            <button onClick={() => handleUpdateStatus(record.id, 'Approved')} className="text-[9px] font-bold text-blue-600 uppercase hover:underline">Approve</button>
                          )}
                          {record.status !== 'Closed' && (
                            <button onClick={() => handleUpdateStatus(record.id, 'Closed')} className="text-[9px] font-bold text-slate-500 uppercase hover:underline">Close</button>
                          )}
                          <button onClick={() => handleDeleteAudit(record.id)} className="text-[9px] font-bold text-red-600 uppercase hover:underline">Delete</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {auditRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-300 font-bold uppercase tracking-widest">No audit records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

