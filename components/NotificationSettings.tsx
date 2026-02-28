
import React, { useState, useEffect } from 'react';
import { getNotificationPreferences, saveNotificationPreferences, getNotifications } from '../NotificationService';
import { NotificationPreferences, Notification } from '../types';

export const NotificationSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences());
  const [history, setHistory] = useState<Notification[]>([]);

  useEffect(() => {
    setHistory(getNotifications());
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    saveNotificationPreferences(newPrefs);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <span className="text-blue-600">✉️</span> Email & Alert Preferences
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-800 text-sm">Critical Deviation Alerts</p>
              <p className="text-xs text-slate-500">Send email immediately when a High or Critical severity deviation is logged.</p>
            </div>
            <button 
              onClick={() => handleToggle('emailOnCriticalDeviation')}
              className={`w-12 h-6 rounded-full transition-colors relative ${prefs.emailOnCriticalDeviation ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.emailOnCriticalDeviation ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-800 text-sm">CAPA Assignments</p>
              <p className="text-xs text-slate-500">Notify the owner via email when a new Corrective/Preventive action is assigned.</p>
            </div>
            <button 
              onClick={() => handleToggle('emailOnCapaAssignment')}
              className={`w-12 h-6 rounded-full transition-colors relative ${prefs.emailOnCapaAssignment ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.emailOnCapaAssignment ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="font-bold text-slate-800 text-sm">Overdue Task Escalations</p>
              <p className="text-xs text-slate-500">Send daily digest of quality tasks that have exceeded their target closure date.</p>
            </div>
            <button 
              onClick={() => handleToggle('emailOnOverdueTask')}
              className={`w-12 h-6 rounded-full transition-colors relative ${prefs.emailOnOverdueTask ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.emailOnOverdueTask ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notification History (Last 50)</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {history.length > 0 ? history.map(notif => (
            <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
              <div className={`mt-1 p-2 rounded-lg ${
                notif.priority === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {notif.type === 'Email' ? '📧' : '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-slate-800 truncate">{notif.title}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                <div className="mt-2 flex gap-2">
                  <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase tracking-tighter">
                    {notif.category}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-tighter ${
                    notif.priority === 'Critical' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {notif.priority}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-slate-400">
              <p className="text-xs font-bold uppercase tracking-[4px]">No notification history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
