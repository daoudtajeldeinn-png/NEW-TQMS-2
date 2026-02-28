
import React from 'react';

export const SOPManager: React.FC = () => {
  const docs = [
    { id: 'SOP-QA-001', title: 'Deviation Management System', version: 'v4.2', status: 'Effective', date: '2024-01-15' },
    { id: 'SOP-PRD-025', title: 'Cleaning Validation Protocol', version: 'v3.0', status: 'In Revision', date: '2024-08-10' },
    { id: 'SOP-LAB-102', title: 'HPLC Calibration Procedure', version: 'v5.1', status: 'Effective', date: '2024-03-22' },
    { id: 'SOP-LOG-004', title: 'Cold Chain Maintenance', version: 'v2.0', status: 'Retired', date: '2023-11-05' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Document Management (EDMS)</h2>
          <p className="text-sm text-slate-500">21 CFR Part 11 Compliant Document Control</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">Upload New</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">New Version</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {docs.map((doc, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">📄</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                doc.status === 'Effective' ? 'bg-green-100 text-green-600' : 
                doc.status === 'In Revision' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {doc.status}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors mb-1">{doc.title}</h4>
            <p className="text-xs text-slate-400 mb-4">{doc.id} • {doc.version}</p>
            <div className="flex justify-between items-center border-t border-slate-50 pt-4">
              <span className="text-[10px] text-slate-400 font-medium">Updated: {doc.date}</span>
              <button className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">View PDF</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
