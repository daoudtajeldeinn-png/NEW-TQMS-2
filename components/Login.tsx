
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin123') {
      onLogin({
        username: 'admin',
        fullName: 'System Administrator',
        role: 'Quality Director',
        department: 'Quality Assurance',
        email: 'admin@pharmaqualify.com'
      });
    } else {
      setError('Authentication failed. Check credentials.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl border-t-4 border-blue-600 animate-in fade-in zoom-in-95">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-xl mx-auto mb-4 font-bold ring-4 ring-blue-50/50">PQ</div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">PharmaQualify Pro</h1>
          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[4px] mt-1">Total Quality Management</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-[10px] mb-6 font-bold uppercase tracking-wider text-center border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Username</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium transition-all text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Identity UID"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Password</label>
            <input 
              type="password" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 font-medium transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="••••••••"
            />
          </div>
          <button onClick={handleLogin} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10">
            🔐 Secure Access
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">21 CFR PART 11 • GxP VALIDATED</p>
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-left">
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Architect</p>
             <p className="text-[10px] font-bold text-slate-800">Dr. Daoud Tajeldeinn Ahmed</p>
          </div>
        </div>
      </div>
    </div>
  );
};
