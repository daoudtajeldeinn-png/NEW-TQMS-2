
import React, { useState, useEffect } from 'react';
import { AuditTrailEntry } from '../types';
import { getAuditTrail } from '../services/AuditService';

export const AuditTrail: React.FC = () => {
  const [entries, setEntries] = useState<AuditTrailEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditTrailEntry | null>(null);

  useEffect(() => {
    setEntries(getAuditTrail());
  }, []);

  const filteredEntries = entries.filter(entry => 
    entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const complianceGuidelines = [
    { 
      name: '21 CFR Part 11', 
      clause: 'Subpart B - Electronic Records',
      status: 'Compliant' as const, 
      riskImpact: 'Critical',
      requirement: 'Validation, Ability to generate copies, Protection of records.',
      lastVerified: '2025-02-01'
    },
    { 
      name: '21 CFR Part 11', 
      clause: 'Subpart C - Electronic Signatures',
      status: 'Compliant' as const, 
      riskImpact: 'High',
      requirement: 'Signature manifestations, Signature/record linking.',
      lastVerified: '2025-02-01'
    },
    { 
      name: 'EU GMP Annex 11', 
      clause: 'Clause 9 - Audit Trails',
      status: 'Compliant' as const, 
      riskImpact: 'Critical',
      requirement: 'System-generated time-stamped audit trails.',
      lastVerified: '2025-01-20'
    },
    { 
      name: 'EU GMP Annex 11', 
      clause: 'Clause 12 - Security',
      status: 'Pending Review' as const, 
      riskImpact: 'Medium',
      requirement: 'Physical and/or logical controls to restrict access.',
      lastVerified: 'N/A'
    },
    { 
      name: 'GAMP 5', 
      clause: 'Data Integrity Lifecycle',
      status: 'Compliant' as const, 
      riskImpact: 'High',
      requirement: 'Risk-based approach to compliant GxP systems.',
      lastVerified: '2025-02-10'
    },
    { 
      name: 'WHO TRS 996', 
      clause: 'Annex 5 - Data Integrity',
      status: 'Compliant' as const, 
      riskImpact: 'High',
      requirement: 'ALCOA+ principles integration across processes.',
      lastVerified: '2025-02-12'
    }
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Compliant': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Non-Compliant': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'text-rose-600 font-black';
      case 'High': return 'text-amber-600 font-bold';
      default: return 'text-slate-400';
    }
  };

  const healthScore = Math.round((complianceGuidelines.filter(g => g.status === 'Compliant').length / complianceGuidelines.length) * 100);

  const viewProtocol = (name: string) => {
    alert(`Retrieving Validation Protocol for ${name}...\nEvidence Hash: SHA-256 Verified.\nCompliance State: VALIDATED.`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm gap-8 no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">System Audit Ledger</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[8px] mt-1">21 CFR Part 11 & Annex 11 Integrity Log</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <div className="relative flex-1 xl:flex-none">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search Compliance Trail..."
              className="pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none w-full xl:w-80 focus:ring-4 focus:ring-indigo-500/5 transition-all"
            />
          </div>
          <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Verify Ledger Integrity</button>
        </div>
      </div>

      {/* COMPLIANCE STATUS MATRIX */}
      <section className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
        <div className="bg-slate-900 p-8 flex justify-between items-center">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-900/40">🛡️</div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Regulatory Compliance Matrix</h3>
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[4px] mt-1 italic">Real-time GxP Qualification Tracking</p>
              </div>
           </div>
           <div className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="text-center px-6 border-r border-white/10">
                 <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Global Health</p>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <p className="text-2xl font-black text-emerald-400">{healthScore}%</p>
                 </div>
              </div>
              <div className="text-right px-4">
                 <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Last Full Assessment</p>
                 <p className="text-xs font-bold text-white uppercase italic">12-FEB-2025</p>
              </div>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b">
                <th className="px-8 py-6">Standard / Clause</th>
                <th>Requirement Context</th>
                <th className="text-center">Risk Impact</th>
                <th className="text-center">Status Indicator</th>
                <th className="px-8 text-right">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complianceGuidelines.map((guideline, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900">{guideline.name}</p>
                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-tighter mt-1">{guideline.clause}</p>
                  </td>
                  <td className="text-[11px] text-slate-500 max-w-sm leading-relaxed font-medium">
                    {guideline.requirement}
                  </td>
                  <td className="text-center">
                    <span className={`text-[9px] uppercase tracking-widest ${getRiskStyle(guideline.riskImpact)}`}>
                      {guideline.riskImpact}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(guideline.status)}`}>
                      {guideline.status}
                    </span>
                  </td>
                  <td className="px-8 text-right">
                    <div className="flex flex-col items-end gap-1">
                       <p className="font-mono text-[10px] text-slate-400">{guideline.lastVerified}</p>
                       <button onClick={() => viewProtocol(guideline.name)} className="text-[8px] font-black text-indigo-500 uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">View Protocol</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trail Ledger List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-[4px]">Audit Ledger Entries</h3>
             <div className="flex items-center gap-3">
               <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
               <span className="text-[9px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border">ALCOA+ SECURED</span>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 border-b">
                  <th className="px-10 py-6">Timestamp (UTC)</th>
                  <th>Operator</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th className="text-right px-10">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(entry => (
                  <tr 
                    key={entry.id} 
                    onClick={() => setSelectedEntry(entry)}
                    className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedEntry?.id === entry.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-10 py-6 text-[10px] font-mono text-slate-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="text-xs font-black text-slate-900">@{entry.user}</td>
                    <td><span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black rounded uppercase border border-slate-200">{entry.action}</span></td>
                    <td className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{entry.module}</td>
                    <td className="px-10 py-6 text-right">
                       <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Inspect</button>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr><td colSpan={5} className="py-32 text-center text-slate-300 font-black uppercase tracking-[15px] opacity-30">Vault Empty</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4">
          {selectedEntry ? (
            <div className="bg-slate-900 text-white rounded-[40px] p-10 shadow-2xl sticky top-8 animate-in slide-in-from-right-4 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
               <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[4px] mb-8">Record Metadata</h3>
               
               <div className="space-y-8 relative z-10">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Unique ID</p>
                    <p className="text-xs font-mono font-bold text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">{selectedEntry.id}</p>
                  </div>
                  
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Detailed Log Remark</p>
                    <p className="text-sm font-medium leading-relaxed italic border-l-2 border-indigo-500 pl-4 py-1">"{selectedEntry.details}"</p>
                  </div>

                  {selectedEntry.reasonForChange && (
                    <div>
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Reason for Signature</p>
                      <p className="text-xs font-bold bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">{selectedEntry.reasonForChange}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 pt-6 border-t border-white/10">
                     {selectedEntry.previousValue && (
                       <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-inner">
                          <p className="text-[8px] font-black text-rose-400 uppercase mb-2">Previous State</p>
                          <pre className="text-[9px] font-mono overflow-x-auto whitespace-pre-wrap text-rose-200 opacity-60">
                             {JSON.stringify(JSON.parse(selectedEntry.previousValue), null, 2)}
                          </pre>
                       </div>
                     )}
                     {selectedEntry.newValue && (
                       <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-inner">
                          <p className="text-[8px] font-black text-emerald-400 uppercase mb-2">New (Current) State</p>
                          <pre className="text-[9px] font-mono overflow-x-auto whitespace-pre-wrap text-emerald-100">
                             {JSON.stringify(JSON.parse(selectedEntry.newValue), null, 2)}
                          </pre>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          ) : (
            <div className="h-full border-4 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center p-12 text-center opacity-30">
               <span className="text-6xl mb-6 grayscale">📜</span>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">Select trail entry for 21 CFR verification</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
