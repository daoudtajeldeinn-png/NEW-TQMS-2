
import React, { useState, useEffect } from 'react';
import { Module, User } from '../types';
import { getNotifications } from '../NotificationService';

interface LayoutProps {
  children: React.ReactNode;
  activeModule: Module;
  onModuleChange: (module: Module) => void;
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeModule, onModuleChange, user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const unreadCount = getNotifications().filter(n => !n.isRead && n.priority === 'Critical').length;

  useEffect(() => {
    const checkInstallPrompt = () => {
      if ((window as any).deferredPrompt) setCanInstall(true);
    };
    const interval = setInterval(checkInstallPrompt, 2000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    {
      label: 'Main',
      items: [{ id: 'dashboard', label: 'Dashboard', icon: '📊' }]
    },
    {
      label: 'Quality',
      items: [
        { id: 'deviations', label: 'Deviations', icon: '⚠️' },
        { id: 'changes', label: 'Change Control', icon: '🔄' },
        { id: 'oos', label: 'OOS Management', icon: '❗' },
        { id: 'capa', label: 'CAPA System', icon: '🔧' },
        { id: 'risk', label: 'Risk (ICH Q9)', icon: '🛡️' }
      ]
    },
    {
      label: 'Production',
      items: [
        { id: 'batch-records', label: 'Batch Records (BMR)', icon: '📓' },
        { id: 'ipqc-comp', label: 'IPQC Portal', icon: '🧪' },
        { id: 'inventory', label: 'Materials', icon: '📦' }
      ]
    },
    {
      label: 'Laboratory',
      items: [
        { id: 'coa-manager', label: 'COA Manager', icon: '📋' },
        { id: 'lims', label: 'LIMS', icon: '🔬' },
        { id: 'stability', label: 'Stability', icon: '⏱️' }
      ]
    },
    {
      label: 'Compliance',
      items: [
        { id: 'audits', label: 'Audit Hub', icon: '📋' },
        { id: 'regulatory', label: 'Regulatory', icon: '📤' },
        { id: 'ai-advisor', label: 'AI Advisor', icon: '✨' }
      ]
    },
    {
      label: 'Admin',
      items: [
        { id: 'notifications', label: 'Notifications', icon: '✉️' },
        { id: 'audit-trail', label: 'Audit Trail', icon: '📜' },
        { id: 'archive', label: 'Archive & Backup', icon: '🗄️' }
      ]
    }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 border-r border-slate-800 z-30 shrink-0`}>
        <div className="h-20 flex items-center px-6 bg-slate-950/40 border-b border-white/5 overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white soft-shadow">
              <span className="text-xl">💊</span>
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-extrabold text-white text-lg tracking-tight">PharmaQualify</span>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-none mt-1">Enterprise GxP</p>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto pt-6 space-y-8 scroll-smooth">
          {sections.map((section, idx) => (
            <div key={idx} className="px-4">
              {!isCollapsed && <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 opacity-60">{section.label}</p>}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onModuleChange(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      activeModule === item.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="text-lg w-6 flex justify-center">{item.icon}</span>
                    {!isCollapsed && <span className="font-semibold truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 bg-slate-950/30 border-t border-white/5">
          <div className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-bold text-sm text-indigo-400 border border-indigo-500/20">
              {user.username.substring(0, 2).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter">{user.role}</p>
              </div>
            )}
          </div>
          <button onClick={onLogout} className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-all">
            <span>🚪</span> {!isCollapsed && 'Sign Out System'}
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-20">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              <svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 capitalize tracking-tight">
                {activeModule.replace(/-/g, ' ')}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace / {activeModule}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             {/* ALCOA+ Compliance Pulse */}
             <div className="hidden xl:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-inner">
                <div className="flex -space-x-1">
                  {['A','L','C','O','A'].map((letter, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-700 shadow-sm" title={`ALCOA Principle: ${letter}`}>
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="h-6 w-px bg-slate-200 mx-1"></div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Data Integrity</p>
                  <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    GxP SECURE
                  </p>
                </div>
             </div>

             <div onClick={() => onModuleChange('notifications')} className="relative cursor-pointer p-2.5 hover:bg-slate-100 rounded-xl transition-all group">
               <span className="text-xl group-hover:scale-110 transition-transform block">🔔</span>
               {unreadCount > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full ring-4 ring-white font-black">{unreadCount}</span>}
             </div>
             
             <div className="h-8 w-px bg-slate-200"></div>
             
             <button onClick={onLogout} className="p-2.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all" title="Secure Logout">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
