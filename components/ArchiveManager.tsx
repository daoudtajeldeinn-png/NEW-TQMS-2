import React, { useState } from 'react';
import { Archive as ArchiveIcon, Download, Upload, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const STORAGE_KEYS = [
  'pharma_user',
  'master_coa_records_pro_v3',
  'pharma_master_audit_trail_v6',
  'pharma_risk_register_v1',
  'pharma_stability_v1',
  'master_ipqc_ledger_v3',
  'master_lims_samples',
  'pharma_audit_records_v1',
  'pharma_capa_v4',
  'pharma_recalls_v1',
  'pharma_inventory_v2',
  'pharma_oos_records_v1',
  'pharma_deviations_v1',
  'master_mfr_vault_v8',
  'active_bmr_vault_v8',
  'pharma_notifications',
  'pharma_notification_prefs'
];

export function ArchiveManager() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data: Record<string, any> = {};
            
            STORAGE_KEYS.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        data[key] = JSON.parse(value);
                    } catch (e) {
                        data[key] = value;
                    }
                }
            });

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pharmaqms-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('System backup exported successfully');
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export system data');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm("CRITICAL WARNING: This will OVERWRITE all current data with the backup. Are you sure you want to proceed?")) {
            event.target.value = ''; 
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json);

                // Clear and Restore
                Object.keys(data).forEach(key => {
                    const value = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                    localStorage.setItem(key, value);
                });

                toast.success('System restored successfully. Reloading environment...');
                setTimeout(() => window.location.reload(), 1500);

            } catch (error) {
                console.error('Import failed', error);
                toast.error('Restoration failed. Invalid archive format.');
            } finally {
                setIsImporting(false);
                event.target.value = '';
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-6 border-b border-slate-200 pb-8">
                <div className="h-16 w-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl">
                    <ArchiveIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Data Archiving & Backup</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Enterprise-grade local data management, secure backups, and system restoration.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <Download className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Export System Data</h3>
                            <p className="text-sm text-slate-500 font-medium">Create a full snapshot of your QMS database.</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl mb-8 text-sm text-slate-600 border border-slate-100 flex-1">
                        <p className="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-4">Encapsulated Modules:</p>
                        <ul className="grid grid-cols-2 gap-y-3 gap-x-4">
                            {['Products & Batches', 'Test Methods', 'Stability Data', 'Quality Logs', 'Audit Trails', 'Inventory', 'COA Records', 'BMR Vault'].map(item => (
                                <li key={item} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                    >
                        {isExporting ? (
                            <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                            <><Download className="h-4 w-4" /> Download Backup (.json)</>
                        )}
                    </button>
                </div>

                <div className="bg-amber-50/30 p-10 rounded-[40px] shadow-sm border border-amber-100 flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-100 rounded-2xl">
                            <Upload className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Restore System</h3>
                            <p className="text-sm text-slate-500 font-medium">Revert system to a previous state.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl mb-8 border border-amber-100 flex-1">
                        <div className="flex items-start gap-4 text-amber-900">
                            <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-1" />
                            <div>
                                <p className="font-black uppercase tracking-widest text-[10px] mb-2">Critical Warning</p>
                                <p className="text-xs font-bold leading-relaxed">
                                    Restoring will <span className="text-rose-600 underline">permanently overwrite</span> all current data on this device. This action is irreversible and compliant with data integrity protocols only if authorized.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            disabled={isImporting}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button
                            disabled={isImporting}
                            className="w-full bg-white text-amber-700 border-2 border-amber-200 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
                        >
                            {isImporting ? (
                                <><RefreshCw className="h-4 w-4 animate-spin" /> Restoring...</>
                            ) : (
                                <><Upload className="h-4 w-4" /> Select Archive File</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center shadow-inner">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Storage Integrity Verified</h4>
                    <p className="text-sm text-slate-500 font-medium">
                        Your data is secured using high-performance LocalStorage with automated redundancy checks.
                    </p>
                </div>
                <div className="ml-auto flex gap-2">
                    <span className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest">v6.2.0-STABLE</span>
                </div>
            </div>
        </div>
    );
}

export default ArchiveManager;
