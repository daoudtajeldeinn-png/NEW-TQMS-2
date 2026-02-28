
import React, { useState } from 'react';
import { MeaningOfSignature } from '../types';

interface ESignatureModalProps {
  onConfirm: (reason: string, meaning: MeaningOfSignature) => void;
  onCancel: () => void;
  actionName: string;
  defaultMeaning?: MeaningOfSignature;
}

const MEANINGS: MeaningOfSignature[] = ['Authorship', 'Review', 'Approval', 'Verification', 'Witnessing', 'Technical Release'];

export const ESignatureModal: React.FC<ESignatureModalProps> = ({ onConfirm, onCancel, actionName, defaultMeaning = 'Authorship' }) => {
  const [password, setPassword] = useState('');
  const [meaning, setMeaning] = useState<MeaningOfSignature>(defaultMeaning);
  const [reason, setReason] = useState('I certify that I have reviewed this record and found it to be accurate and compliant with site SOPs.');

  const handleSubmit = () => {
    if (password === 'admin123') {
      onConfirm(reason, meaning);
    } else {
      alert("Invalid E-Signature Credentials. Verification Failed per 21 CFR Part 11.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-8">
      <div className="bg-white rounded-[50px] w-full max-w-xl shadow-2xl animate-in zoom-in-95 border-t-[12px] border-indigo-600">
        <div className="p-12 space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner">🖋️</div>
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Electronic Signature</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[5px] mt-2 italic">21 CFR PART 11 SECURED PROTOCOL</p>
          </div>

          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Action ID</p>
            <p className="text-sm font-black text-slate-900 leading-snug">{actionName}</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Meaning of Signature (Legal Intent)</label>
                <select 
                  value={meaning}
                  onChange={e => setMeaning(e.target.value as MeaningOfSignature)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                >
                  {MEANINGS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Contemporaneous Remark</label>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none h-24 focus:border-indigo-500 transition-all"
                  placeholder="Record your observation..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Digital Authentication Key (Password)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button onClick={onCancel} className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-3xl transition-all">Abort Signing</button>
            <button 
              onClick={handleSubmit}
              className="flex-2 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transform transition-all active:scale-95 px-10"
            >
              🔐 Authenticate Identity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
