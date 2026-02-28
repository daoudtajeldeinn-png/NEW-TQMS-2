
import React, { useState, useEffect } from 'react';
import { LIMSSample } from '../types';

export const LIMS: React.FC = () => {
  const [samples, setSamples] = useState<LIMSSample[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<LIMSSample>>({
    productName: '',
    batchNo: '',
    type: 'Finished Product',
    analyst: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('master_lims_samples');
    if (saved) setSamples(JSON.parse(saved));
  }, []);

  const handleLogSample = () => {
    if (!formData.productName || !formData.batchNo) return;
    const newSample: LIMSSample = {
      id: Date.now().toString(),
      sampleNo: `SAM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: formData.productName,
      batchNo: formData.batchNo,
      type: formData.type as any,
      status: 'Logged',
      analyst: formData.analyst || 'UNASSIGNED',
      dateLogged: new Date().toISOString().split('T')[0]
    };
    const updated = [newSample, ...samples];
    setSamples(updated);
    localStorage.setItem('master_lims_samples', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const getStatusColor = (status: LIMSSample['status']) => {
    switch (status) {
      case 'Logged': return 'bg-slate-100 text-slate-600';
      case 'Testing': return 'bg-blue-100 text-blue-600';
      case 'Review': return 'bg-amber-100 text-amber-600';
      case 'Released': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-slate-900 p-10 rounded-[40px] text-white flex justify-between items-center shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter">LIMS Control Center</h2>
          <p className="text-[10px] text-blue-400 font-black tracking-[4px] mt-1 uppercase">Sample Lifecycle Management</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all z-10"
        >
          ➕ Log New Sample
        </button>
        <div className="absolute right-0 top-0 text-9xl font-black text-white/5 pointer-events-none select-none">LAB</div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">
                <th className="px-8 py-6">Sample No.</th>
                <th className="px-8 py-6">Product & Batch</th>
                <th className="px-8 py-6">Type</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Analyst</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {samples.map(sample => (
                <tr key={sample.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-black text-blue-600">{sample.sampleNo}</td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-800">{sample.productName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{sample.batchNo}</p>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase">{sample.type}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(sample.status)}`}>
                      {sample.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-700 text-xs">{sample.analyst}</td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button className="text-[9px] font-black uppercase text-blue-600 hover:underline">Update</button>
                    <button className="text-[9px] font-black uppercase text-slate-400 hover:underline">Details</button>
                  </td>
                </tr>
              ))}
              {samples.length === 0 && (
                <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">No active lab worklogs</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-10 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8 text-center">Sample Intake Protocol</h3>
            <div className="space-y-6">
              <input value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} placeholder="Product Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              <input value={formData.batchNo} onChange={e => setFormData({...formData, batchNo: e.target.value})} placeholder="Batch No." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold">
                <option>Raw Material</option>
                <option>In-Process</option>
                <option>Finished Product</option>
                <option>Stability</option>
              </select>
              <input value={formData.analyst} onChange={e => setFormData({...formData, analyst: e.target.value})} placeholder="Assigned Analyst" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-xs">Cancel</button>
                <button onClick={handleLogSample} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-200">Commit to LIMS</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
