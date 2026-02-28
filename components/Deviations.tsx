
import React, { useState, useEffect, useMemo } from 'react';
import { getCAPASuggestions } from '../geminiService';
import { triggerNotification } from '../NotificationService';
import { logAuditAction } from '../services/AuditService';
import { Deviation, User, Module } from '../types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  BarChart3, 
  FileText,
  ChevronRight,
  ShieldAlert,
  Activity,
  ArrowUpRight
} from 'lucide-react';

interface DeviationsProps {
  currentUser?: User;
  onModuleChange?: (module: Module, preFill?: string) => void;
}

const ITEMS_PER_PAGE = 8;
const STORAGE_KEY = 'pharma_deviations_v1';

const mockDeviations: Deviation[] = [
  { id: 'DEV-24-441', number: 'D24-441', date: '2024-10-20', department: 'QC Lab', description: 'OOS result in stability testing for Batch #X-102.', severity: 'High', status: 'Pending', aiAnalysis: { rootCause: 'Potential column degradation or reagent contamination.', correctiveAction: 'Re-extract sample and use fresh column.', preventiveAction: 'Implement column usage log and tighter reagent expiry checks.' } },
  { id: 'DEV-24-442', number: 'D24-442', date: '2024-10-21', department: 'Production', description: 'Temperature excursion in Warehouse Cold Room.', severity: 'Medium', status: 'In Progress' },
  { id: 'DEV-24-443', number: 'D24-443', date: '2024-10-22', department: 'Packaging', description: 'Labeling machine misalignment causing skewed labels.', severity: 'Low', status: 'Completed' },
  { id: 'DEV-24-444', number: 'D24-444', date: '2024-10-23', department: 'QA', description: 'Missing signature on cleaning log for Room 402.', severity: 'Medium', status: 'Pending' },
  { id: 'DEV-24-445', number: 'D24-445', date: '2024-10-24', department: 'Warehouse', description: 'Forklift impact on pallet racking in Aisle 4.', severity: 'High', status: 'Pending' },
  { id: 'DEV-24-446', number: 'D24-446', date: '2024-10-25', department: 'Production', description: 'Power flicker caused centrifuge shutdown mid-cycle.', severity: 'Critical', status: 'In Progress' },
];

export const Deviations: React.FC<DeviationsProps> = ({ currentUser, onModuleChange }) => {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDeviation, setViewingDeviation] = useState<Deviation | null>(null);
  const [isAiSectionExpanded, setIsAiSectionExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scopingLoading, setScopingLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<Deviation['severity']>('Medium');
  const [dept, setDept] = useState('Production');
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openCapas, setOpenCapas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Load deviations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setDeviations(JSON.parse(saved));
    } else {
      setDeviations(mockDeviations);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDeviations));
    }
  }, []);

  // Save deviations to localStorage
  useEffect(() => {
    if (deviations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deviations));
    }
  }, [deviations]);

  // Load open CAPAs for linking
  useEffect(() => {
    const savedCapas = localStorage.getItem('pharma_capa_v4');
    if (savedCapas) {
      const allCapas = JSON.parse(savedCapas);
      const filtered = allCapas.filter((c: any) => !['Closed', 'Completed'].includes(c.status));
      setOpenCapas(filtered);
    }
  }, [viewingDeviation]);

  // Automated AI Trigger for High/Critical Priority during intake
  useEffect(() => {
    if (isModalOpen && (severity === 'High' || severity === 'Critical') && description.length > 25 && !aiSuggestions && !loading) {
      const timer = setTimeout(() => handleGenerateCAPA(), 1000);
      return () => clearTimeout(timer);
    }
  }, [severity, description, isModalOpen]);

  // Reset expansion state when opening a new detail view
  useEffect(() => {
    if (viewingDeviation) {
      setIsAiSectionExpanded(false);
    }
  }, [viewingDeviation]);

  const handleGenerateCAPA = async () => {
    if (!description) return;
    setLoading(true);
    try {
      const result = await getCAPASuggestions(description);
      setAiSuggestions(result);
    } catch (e) {
      console.error("AI Analysis failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveScoping = async () => {
    if (!viewingDeviation) return;
    setScopingLoading(true);
    try {
      const result = await getCAPASuggestions(viewingDeviation.description);
      const updatedDev: Deviation = {
        ...viewingDeviation,
        aiAnalysis: {
          rootCause: result.rootCause,
          correctiveAction: result.correctiveAction,
          preventiveAction: result.preventiveAction
        }
      };
      setDeviations(prev => prev.map(d => d.id === updatedDev.id ? updatedDev : d));
      setViewingDeviation(updatedDev);
      setIsAiSectionExpanded(true);
    } catch (e) {
      console.error("Live Scoping Failed:", e);
    } finally {
      setScopingLoading(false);
    }
  };

  const handleSubmitDeviation = () => {
    const newDev: Deviation = {
      id: `DEV-${Date.now()}`,
      number: `D25-${deviations.length + 501}`,
      date: new Date().toISOString().split('T')[0],
      department: dept,
      description,
      severity,
      status: 'Pending',
      aiAnalysis: aiSuggestions ? {
        rootCause: aiSuggestions.rootCause,
        correctiveAction: aiSuggestions.correctiveAction,
        preventiveAction: aiSuggestions.preventiveAction
      } : undefined
    };
    setDeviations([newDev, ...deviations]);
    
    if (currentUser) {
      logAuditAction(
        currentUser,
        'Logged Deviation',
        'Deviations',
        `New deviation ${newDev.number} logged in ${dept}`,
        { recordId: newDev.id, newValue: newDev }
      );

      if (severity === 'High' || severity === 'Critical') {
        triggerNotification(currentUser, 'Deviation', severity, `Critical Event: ${newDev.number}`, `Logged in ${dept}.`);
      }
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAiSuggestions(null);
    setSeverity('Medium');
    setDept('Production');
  };

  const handleLinkCapa = (capaId: string) => {
    if (!viewingDeviation) return;
    const updatedDev = { ...viewingDeviation, capaId };
    setDeviations(prev => prev.map(d => d.id === updatedDev.id ? updatedDev : d));
    setViewingDeviation(updatedDev);
    
    if (currentUser) {
      logAuditAction(
        currentUser,
        'Linked CAPA',
        'Deviations',
        `Deviation ${updatedDev.number} linked to CAPA ${capaId}`,
        { recordId: updatedDev.id, newValue: { capaId } }
      );
    }
  };

  const getSeverityBadgeClass = (sev: Deviation['severity']) => {
    switch (sev) {
      case 'Critical':
        return 'bg-pink-600 text-white shadow-sm font-black ring-1 ring-pink-700/50';
      case 'High':
        return 'bg-pink-50 text-pink-700 border border-pink-200 font-bold';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border border-blue-100 font-bold';
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-100';
    }
  };

  const filteredDeviations = useMemo(() => {
    return deviations.filter(dev => {
      const matchesSearch = 
        dev.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || dev.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [deviations, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: deviations.length,
      pending: deviations.filter(d => d.status === 'Pending').length,
      inProgress: deviations.filter(d => d.status === 'In Progress').length,
      critical: deviations.filter(d => d.severity === 'Critical').length,
      closed: deviations.filter(d => d.status === 'Closed').length
    };
  }, [deviations]);

  const totalPages = Math.ceil(filteredDeviations.length / ITEMS_PER_PAGE);
  const currentDevs = filteredDeviations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Deviation Management</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">GxP Non-Conformity Tracking & AI Forensics</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="flex-1 lg:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95">
            <Activity className="w-4 h-4" /> Log New Deviation
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Events', value: stats.total, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Critical', value: stats.critical, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Closed', value: stats.closed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-5 rounded-[32px] border border-white shadow-sm flex flex-col items-center text-center`}>
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Monitoring & Filters */}
      <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, description, or department..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Approved">Approved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-[10px] font-black text-white uppercase tracking-[2px] border-b border-slate-200">
                  <th className="px-8 py-5">Record ID</th>
                  <th className="px-8 py-5">Incident Date</th>
                  <th className="px-8 py-5">Department</th>
                  <th className="px-8 py-5">Summary</th>
                  <th className="px-8 py-5">Severity</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {currentDevs.length > 0 ? currentDevs.map((dev) => (
                  <tr key={dev.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          dev.severity === 'Critical' ? 'bg-rose-500 animate-pulse' : 
                          dev.severity === 'High' ? 'bg-rose-400' : 
                          dev.severity === 'Medium' ? 'bg-blue-400' : 'bg-emerald-400'
                        }`} />
                        <span className="font-black text-slate-900">{dev.number}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-bold">{dev.date}</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {dev.department}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-slate-500 font-medium truncate max-w-[200px]" title={dev.description}>
                        {dev.description}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest ${getSeverityBadgeClass(dev.severity)}`}>
                        {dev.severity}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                       <span className={`flex items-center gap-1.5 font-black uppercase text-[10px] ${
                         dev.status === 'Closed' ? 'text-emerald-600' : 
                         dev.status === 'Pending' ? 'text-amber-600' : 'text-blue-600'
                       }`}>
                         {dev.status === 'Closed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                         {dev.status}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setViewingDeviation(dev)} 
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all group-hover:scale-110"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <Search className="w-12 h-12 mb-4" />
                        <p className="text-lg font-black uppercase tracking-[4px]">No Records Found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {currentDevs.length} of {filteredDeviations.length} records
            </p>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all"
              >
                Previous
              </button>
              <button 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Deviation Intake Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className={`px-6 py-4 flex justify-between items-center text-white ${
              severity === 'Critical' ? 'bg-pink-600' : severity === 'High' ? 'bg-pink-500' : 'bg-slate-900'
            }`}>
              <h3 className="font-bold text-sm uppercase tracking-wider">Quality Event Intake</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                  <select value={dept} onChange={e => setDept(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:border-blue-500">
                    <option>Production</option><option>QC Lab</option><option>QA</option><option>Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Severity</label>
                  <select value={severity} onChange={e => setSeverity(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold outline-none focus:border-blue-500">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Non-Conformity Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-xs min-h-[100px] outline-none focus:border-blue-500" placeholder="Describe the discrepancy..." />
              </div>

              {loading && (
                <div className="p-4 bg-pink-50 rounded-lg border border-pink-100 flex items-center justify-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce"></div>
                  <p className="text-[10px] font-bold text-pink-700 uppercase tracking-widest">AI Scoping Investigation...</p>
                </div>
              )}

              {aiSuggestions && !loading && (
                <div className="p-4 bg-pink-50/50 rounded-lg border border-pink-100 text-[11px] space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-pink-700 uppercase tracking-tighter flex items-center gap-2">
                       <span className="w-2 h-2 bg-pink-500 rounded-full"></span> AI Investigation Hypothesis
                    </p>
                    <button onClick={handleGenerateCAPA} className="text-[8px] font-bold text-pink-400 uppercase hover:underline">Refresh</button>
                  </div>
                  <p className="text-slate-700 leading-relaxed"><span className="font-bold">Root Cause:</span> {aiSuggestions.rootCause}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-white rounded border border-pink-50"><p className="font-bold text-pink-600 mb-1">Corrective</p>{aiSuggestions.correctiveAction}</div>
                    <div className="p-2 bg-white rounded border border-pink-50"><p className="font-bold text-pink-600 mb-1">Preventive</p>{aiSuggestions.preventiveAction}</div>
                  </div>
                </div>
              )}
              
              {!aiSuggestions && !loading && (severity === 'Low' || severity === 'Medium') && (
                <button onClick={handleGenerateCAPA} disabled={!description} className="w-full py-2.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">
                  ✨ Suggest AI Root Cause & CAPA
                </button>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded transition-all">Cancel</button>
              <button onClick={handleSubmitDeviation} className="px-6 py-2 bg-blue-600 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Log Incident</button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal with DEDICATED EXPANDABLE AI SECTION */}
      {viewingDeviation && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
               <div>
                 <h3 className="font-bold text-sm uppercase tracking-wider">Record Details: {viewingDeviation.number}</h3>
                 <p className="text-[10px] text-slate-400 font-medium">Logged on {viewingDeviation.date} by System</p>
               </div>
               <button onClick={() => setViewingDeviation(null)} className="text-white/60 hover:text-white transition-colors">✕</button>
             </div>
             
             <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Admin Controls */}
                {currentUser?.role?.toLowerCase() === 'admin' && (
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
                    <p className="w-full text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Controls</p>
                    {viewingDeviation.status !== 'Approved' && (
                      <button 
                        onClick={() => {
                          const updated = { ...viewingDeviation, status: 'Approved' as const };
                          setDeviations(prev => prev.map(d => d.id === updated.id ? updated : d));
                          setViewingDeviation(updated);
                          if (currentUser) {
                            logAuditAction(currentUser, 'Approved Deviation', 'Deviations', `Deviation ${updated.number} approved`, { recordId: updated.id });
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm"
                      >
                        Approve
                      </button>
                    )}
                    {viewingDeviation.status !== 'Closed' && (
                      <button 
                        onClick={() => {
                          const updated = { ...viewingDeviation, status: 'Closed' as const, closedDate: new Date().toISOString().split('T')[0] };
                          setDeviations(prev => prev.map(d => d.id === updated.id ? updated : d));
                          setViewingDeviation(updated);
                          if (currentUser) {
                            logAuditAction(currentUser, 'Closed Deviation', 'Deviations', `Deviation ${updated.number} closed`, { recordId: updated.id });
                          }
                        }}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-sm"
                      >
                        Close
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (window.confirm('Delete this deviation record?')) {
                          const devToDelete = viewingDeviation;
                          setDeviations(prev => prev.filter(d => d.id !== viewingDeviation.id));
                          setViewingDeviation(null);
                          if (currentUser && devToDelete) {
                            logAuditAction(currentUser, 'Deleted Deviation', 'Deviations', `Deviation ${devToDelete.number} deleted`, { recordId: devToDelete.id });
                          }
                        }
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                )}
                {/* Main Details Grid */}
                <div className="grid grid-cols-3 gap-6 pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Department</p>
                    <p className="text-xs font-bold text-slate-800">{viewingDeviation.department}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Severity</p>
                    <span className={`px-3 py-1 rounded text-[10px] uppercase tracking-wider ${getSeverityBadgeClass(viewingDeviation.severity)}`}>
                      {viewingDeviation.severity}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Current Status</p>
                    <p className="text-xs font-bold text-blue-600 uppercase">{viewingDeviation.status}</p>
                  </div>
                  {viewingDeviation.capaId && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Linked CAPA</p>
                      <p className="text-xs font-bold text-indigo-600 uppercase">{viewingDeviation.capaId}</p>
                    </div>
                  )}
                  {!viewingDeviation.capaId && openCapas.length > 0 && (
                    <div className="col-span-3 mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Link to Existing CAPA</p>
                        <p className="text-[9px] text-slate-500 font-medium">Select an open CAPA record to associate with this deviation</p>
                      </div>
                      <select 
                        onChange={(e) => handleLinkCapa(e.target.value)}
                        className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-[10px] font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        defaultValue=""
                      >
                        <option value="" disabled>Select CAPA ID...</option>
                        {openCapas.map(capa => (
                          <option key={capa.id} value={capa.number}>{capa.number} - {capa.description.substring(0, 30)}...</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incident Description</p>
                   <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed italic">
                      "{viewingDeviation.description}"
                   </div>
                </div>

                {/* DEDICATED EXPANDABLE AI SECTION */}
                <div className="mt-8 border-t border-slate-100 pt-8">
                  {viewingDeviation.aiAnalysis ? (
                    <div className="border border-indigo-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ring-1 ring-indigo-50">
                      <button 
                        onClick={() => setIsAiSectionExpanded(!isAiSectionExpanded)}
                        aria-expanded={isAiSectionExpanded}
                        className={`w-full flex items-center justify-between p-6 transition-all group ${
                          isAiSectionExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50/40 hover:bg-indigo-50 text-indigo-950'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            isAiSectionExpanded ? 'bg-white/20' : 'bg-indigo-100'
                          }`}>
                            <span className="text-xl">✨</span>
                          </div>
                          <div className="text-left">
                            <h4 className="text-[11px] font-black uppercase tracking-[3px]">
                               AI Investigation Intelligence
                            </h4>
                            <p className={`text-[9px] font-bold uppercase opacity-60 tracking-wider mt-0.5`}>
                               {isAiSectionExpanded ? 'Closing insights...' : 'Expand for Root Cause & CAPA suggestions'}
                            </p>
                          </div>
                        </div>
                        <span className={`transform transition-transform duration-500 ease-in-out ${isAiSectionExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      
                      {isAiSectionExpanded && (
                        <div className="p-8 space-y-8 bg-white animate-in slide-in-from-top-4 duration-500">
                          {/* Probable Root Cause Section */}
                          <div className="space-y-4">
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                                <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-[2px]">
                                   AI Forensics: Probable Root Cause
                                </h5>
                             </div>
                             <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-slate-200 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-[80px]"></div>
                                <p className="text-sm font-medium leading-relaxed relative z-10 font-sans italic">
                                   {viewingDeviation.aiAnalysis.rootCause}
                                </p>
                             </div>
                          </div>

                          {/* Corrective & Preventive Action Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-2xl hover:shadow-lg hover:shadow-emerald-500/5 transition-all group">
                                <h5 className="text-[10px] font-black text-emerald-700 uppercase mb-4 flex items-center gap-2">
                                   <span className="p-1.5 bg-emerald-100 rounded-lg text-lg">🔧</span> Corrective Action (Immediate)
                                </h5>
                                <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                                   {viewingDeviation.aiAnalysis.correctiveAction}
                                </p>
                             </div>
                             <div className="p-6 bg-blue-50/40 border border-blue-100 rounded-2xl hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                                <h5 className="text-[10px] font-black text-blue-700 uppercase mb-4 flex items-center gap-2">
                                   <span className="p-1.5 bg-blue-100 rounded-lg text-lg">🛡️</span> Preventive Action (Systemic)
                                </h5>
                                <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                                   {viewingDeviation.aiAnalysis.preventiveAction}
                                </p>
                             </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">
                                * Compliance Note: AI suggestions based on pharmacopoeial failure mode patterns.
                             </p>
                             <button 
                               onClick={() => onModuleChange?.('capa', viewingDeviation.number)}
                               className="text-[9px] font-black text-indigo-600 uppercase hover:underline tracking-widest px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100 transition-colors"
                             >
                                Apply to CAPA Ledger
                             </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/20 group hover:bg-slate-50 transition-all">
                      <div className={`w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 transition-all ${scopingLoading ? 'animate-pulse bg-indigo-100' : 'grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                        <span className="text-3xl">{scopingLoading ? '✨' : '🤖'}</span>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">
                        {scopingLoading ? 'Synthesizing Regulatory Insights...' : 'No AI Forensic Data Linked'}
                      </p>
                      <button 
                        onClick={handleLiveScoping}
                        disabled={scopingLoading}
                        className="text-[9px] font-black text-indigo-600 mt-6 hover:bg-indigo-600 hover:text-white px-8 py-3 rounded-full border border-indigo-100 uppercase tracking-widest transition-all shadow-sm bg-white disabled:opacity-50"
                      >
                         {scopingLoading ? 'Analyzing Failure Pattern...' : 'Initialize AI Scoping Now'}
                      </button>
                    </div>
                  )}
                </div>
             </div>

             <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-end gap-3">
               <button onClick={() => setViewingDeviation(null)} className="px-6 py-3 text-slate-400 font-bold text-[10px] uppercase hover:bg-slate-200 rounded-xl transition-all tracking-widest">Close Record</button>
               <button 
                 onClick={() => onModuleChange?.('capa', viewingDeviation.number)}
                 className="px-6 py-3 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all tracking-widest"
               >
                 🔗 Link to CAPA
               </button>
               <button className="px-10 py-3 bg-slate-900 text-white font-black text-[10px] uppercase rounded-xl shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center gap-2 tracking-widest">
                 <span>📄</span> Generate Formal GxP Report
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
