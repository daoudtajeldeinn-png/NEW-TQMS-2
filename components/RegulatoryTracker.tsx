
import React from 'react';

export const RegulatoryTracker: React.FC = () => {
  const submissions = [
    { id: 'SUB-441', product: 'Metronidazole 500mg', type: 'ANDA', market: 'US FDA', status: 'Submitted', date: '2024-11-20' },
    { id: 'SUB-452', product: 'Aspirin Gastro-Resistant', type: 'Dossier', market: 'EMA', status: 'Under Review', date: '2025-01-10' },
    { id: 'SUB-991', product: 'Paracetamol IV', type: 'Post-Approval Change', market: 'TGA Australia', status: 'Approved', date: '2025-01-25' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-3xl p-8 text-white flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Global Regulatory Submissions</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[4px] mt-1">Lifecycle Management & Filings</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all">New Filing</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {submissions.map((sub, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-blue-500 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">📄</div>
              <span className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter ${
                sub.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>{sub.status}</span>
            </div>
            <h4 className="text-sm font-black text-slate-800 mb-1">{sub.product}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">{sub.type} | {sub.market}</p>
            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold">DATE: {sub.date}</span>
              <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
