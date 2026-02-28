

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDeveloperInfo } from '../geminiService';

const data = [
  { name: 'Jan', deviations: 4, closed: 3 },
  { name: 'Feb', deviations: 7, closed: 5 },
  { name: 'Mar', deviations: 5, closed: 5 },
  { name: 'Apr', deviations: 12, closed: 8 },
  { name: 'May', deviations: 8, closed: 7 },
  { name: 'Jun', deviations: 3, closed: 3 },
];

const auditData = [
  { name: 'Production', value: 40 },
  { name: 'Lab', value: 30 },
  { name: 'Warehouse', value: 20 },
  { name: 'QA', value: 10 },
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export const Dashboard: React.FC = () => {
  const [isLaunched, setIsLaunched] = useState(false);
  const [devBio, setDevBio] = useState('Quality Systems Architect & Lead Developer.');
  const [devSources, setDevSources] = useState<{uri: string, title: string}[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunched(true), 500);
    if (navigator.onLine) {
       getDeveloperInfo().then(res => {
         setDevBio(res.text);
         setDevSources(res.sources);
       }).catch(() => {});
    }
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* System Status Banner */}
      <div className={`p-5 rounded-xl border-l-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-all ${isLaunched ? 'bg-white border-blue-500' : 'bg-slate-100 border-slate-300 opacity-50'}`}>
         <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-blue-50 text-blue-600`}>🌐</div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Quality Engine v4.0 Active</h2>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{navigator.onLine ? 'Cloud Synchronization: Online' : 'Offline GxP Storage'}</p>
            </div>
         </div>
         <div className="flex gap-6">
            <div className="text-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Health</p>
               <div className="flex items-center gap-1.5 justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold">OPTIMAL</span>
               </div>
            </div>
            <div className="text-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Data Ledger</p>
               <span className="text-[10px] font-bold text-blue-600">ENCRYPTED</span>
            </div>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Deviations', value: '14', trend: '+2 New', color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'CAPA Pipeline', value: '08', trend: '-12% MoM', color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Site Compliance', value: '98.2%', trend: 'Target: 95%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'OOS Incidence', value: '01', trend: 'Active Invest.', color: 'text-red-500', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.bg} ${stat.color}`}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Quality Event Trends</h3>
            <select className="text-[10px] font-bold bg-slate-50 border-none outline-none p-1 rounded">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="deviations" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={32} />
                <Bar dataKey="closed" fill="#10b981" radius={[2, 2, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6">Audit Distribution</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={auditData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {auditData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {auditData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                    <span className="text-[10px] text-slate-600 font-medium uppercase">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-800">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Developer Context Footer */}
      <footer className="bg-slate-900 text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm no-print">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-xl shadow-lg">👨‍🔬</div>
            <div className="flex-1 min-w-0">
               <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">System Architect</p>
               <h4 className="text-base font-bold text-white tracking-tight">Dr. Daoud Tajeldeinn Ahmed Abdel kareim</h4>
               <p className="text-[10px] text-slate-400 mt-1 max-w-xl leading-relaxed italic truncate">{devBio}</p>
               {/* Search Grounding compliant display of sources */}
               {devSources.length > 0 && (
                 <div className="mt-2 flex flex-wrap gap-2">
                   {devSources.map((s, i) => (
                     <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[8px] text-blue-400 hover:text-blue-300 transition-colors bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800/50">
                       [{i+1}] {s.title}
                     </a>
                   ))}
                 </div>
               )}
            </div>
         </div>
         <div className="flex gap-2 shrink-0">
            <button className="px-4 py-1.5 bg-slate-800 rounded-md text-[9px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">CV Details</button>
            <button className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-[9px] font-bold uppercase tracking-widest hover:bg-blue-500 transition-all shadow-md">Developer Support</button>
         </div>
      </footer>
    </div>
  );
};
