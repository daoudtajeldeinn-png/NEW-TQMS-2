
import React, { useState, useEffect } from 'react';
import { MFR, BMRRecord, BMRStep, User, Ingredient, MeaningOfSignature } from '../types';
import { getMFRTemplate } from '../geminiService';
import { ESignatureModal } from './ESignatureModal';
import { logAuditAction } from '../services/AuditService';

interface BatchRecordSystemProps {
  user: User;
}

const SCI_LOGO = (
  <div className="flex flex-col items-center justify-center p-2 border-2 border-slate-900 rounded-lg bg-white shadow-sm">
    <span className="text-sm font-black leading-none tracking-tighter text-slate-900">S.C.I.</span>
    <span className="text-[6px] font-black uppercase text-center mt-0.5 leading-[0.8] text-slate-600">Sudanese Chemical<br/>Industries</span>
  </div>
);

export const BatchRecordSystem: React.FC<BatchRecordSystemProps> = ({ user }) => {
  const [mfrs, setMfrs] = useState<MFR[]>(() => {
    const saved = localStorage.getItem('master_mfr_vault_v8');
    return saved ? JSON.parse(saved) : [];
  });
  const [bmrs, setBmrs] = useState<BMRRecord[]>(() => {
    const saved = localStorage.getItem('active_bmr_vault_v8');
    return saved ? JSON.parse(saved) : [];
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'MFR' | 'Execution' | 'Archive'>('MFR');
  const [viewMode, setViewMode] = useState<'list' | 'mfr-edit' | 'mfr-detail' | 'bmr-execute'>('list');
  const [activeMfrSection, setActiveMfrSection] = useState<'Formulation' | 'Manufacturing' | 'Packaging'>('Formulation');
  
  const [selectedMFR, setSelectedMFR] = useState<MFR | null>(null);
  const [selectedBMR, setSelectedBMR] = useState<BMRRecord | null>(null);
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [productName, setProductName] = useState('');
  const [batchNo, setBatchNo] = useState('');

  // Execution Context for E-Sign
  const [signingContext, setSigningContext] = useState<{
    stepId: string;
    type: 'sign' | 'verify' | 'line-clearance';
    category: 'steps' | 'packagingSteps';
  } | null>(null);

  const [editMfr, setEditMfr] = useState<Partial<MFR>>({});

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => { window.removeEventListener('online', updateOnline); window.removeEventListener('offline', updateOnline); };
  }, []);

  useEffect(() => {
    localStorage.setItem('master_mfr_vault_v8', JSON.stringify(mfrs));
    localStorage.setItem('active_bmr_vault_v8', JSON.stringify(bmrs));
  }, [mfrs, bmrs]);

  const initiateAiMfr = async () => {
    if (!productName || !isOnline) return;
    setLoading(true);
    try {
      const template = await getMFRTemplate(productName, 'Tablet');
      const draftMFR: Partial<MFR> = {
        id: `mfr-${Date.now()}`,
        productName: productName,
        productCode: productName.substring(0, 3).toUpperCase() + '01',
        documentNo: `PD/${productName.substring(0, 3).toUpperCase()}-MFR/01`,
        revision: 'R01',
        version: '1.0',
        dosageForm: 'Tablet',
        batchSize: template.batchSize || '100,000 Tabs',
        ingredients: template.ingredients.map((ing: any) => ({ ...ing, theoreticalQty: ing.quantity })),
        packagingMaterials: [
          { materialName: 'PVC Film 250mic', qtyPerUnit: '-', theoreticalQty: '50', unit: 'kg' },
          { materialName: 'Aluminium Foil 20mic', qtyPerUnit: '-', theoreticalQty: '30', unit: 'kg' },
          { materialName: 'Outer Carton', qtyPerUnit: '1', theoreticalQty: '1000', unit: 'Nos' }
        ],
        steps: template.steps.map((s: any, i: number) => ({ id: `s-${i}`, ...s, isCritical: true })),
        packagingSteps: [
          { id: 'p1', operation: 'Blistering', instruction: 'Set sealing temp at 140-150°C.', category: 'Packaging', isCritical: true },
          { id: 'p2', operation: 'Packing', instruction: 'Insert 3 blisters and 1 leaflet per box.', category: 'Packaging', isCritical: false }
        ],
        status: 'Draft',
        description: `Master Protocol for ${productName}`,
        composition: `Standard Formula`
      };
      setEditMfr(draftMFR);
      setViewMode('mfr-edit');
      setIsWizardOpen(false);
    } catch (e) {
      alert("AI Synthesis Failed. Please check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const saveMfr = () => {
    const finalMFR = { 
      ...editMfr, 
      status: 'Effective', 
      approvals: [{ name: user.fullName, designation: user.role, meaning: 'Authorship' }] 
    } as MFR;
    
    const existingIndex = mfrs.findIndex(m => m.id === finalMFR.id);
    if (existingIndex > -1) {
      const updated = [...mfrs];
      updated[existingIndex] = finalMFR;
      setMfrs(updated);
    } else {
      setMfrs([finalMFR, ...mfrs]);
    }
    setViewMode('list');
    logAuditAction(user, 'MFR_SAVED', 'QA', `Saved Master Protocol for ${finalMFR.productName}`);
  };

  const handleExecutionSign = (stepId: string, type: 'sign' | 'verify', category: 'steps' | 'packagingSteps') => {
    setSigningContext({ stepId, type, category });
    setIsSigning(true);
  };

  const confirmSignature = (reason: string, meaning: MeaningOfSignature) => {
    if (signingContext) {
      const { stepId, type, category } = signingContext;
      if (selectedBMR) {
        const updatedBmr = { ...selectedBMR };
        const stepList = category === 'steps' ? updatedBmr.steps : updatedBmr.packagingSteps;
        const stepIndex = stepList.findIndex(s => s.id === stepId);

        if (stepIndex > -1) {
          if (type === 'sign') {
            stepList[stepIndex].signOffBy = user.fullName;
            stepList[stepIndex].signOffDate = new Date().toISOString();
          } else {
            stepList[stepIndex].checkedBy = user.fullName;
            stepList[stepIndex].checkedDate = new Date().toISOString();
          }
        }

        const newBmrs = bmrs.map(b => b.id === updatedBmr.id ? updatedBmr : b);
        setBmrs(newBmrs);
        setSelectedBMR(updatedBmr);
        logAuditAction(user, type === 'sign' ? 'STEP_SIGNED' : 'STEP_VERIFIED', 'Production', `Executed signature for ${stepId} in Lot ${selectedBMR.batchNumber}`, { newValue: updatedBmr });
      }
      setSigningContext(null);
      setIsSigning(false);
    } else {
      // Handle MFR Issuance logic
      confirmIssuance(reason);
    }
  };

  const confirmIssuance = (reason: string) => {
    if (!selectedMFR || !batchNo) return;
    const newBMR: BMRRecord = {
      id: `bmr-${Date.now()}`,
      mfrId: selectedMFR.id,
      batchNumber: batchNo,
      productName: selectedMFR.productName,
      issuedBy: user.fullName,
      issuanceDate: new Date().toISOString().split('T')[0],
      status: 'Issued',
      steps: selectedMFR.steps.map(s => ({ ...s })),
      packagingSteps: selectedMFR.packagingSteps.map(s => ({ ...s })),
      ingredients: selectedMFR.ingredients.map(i => ({ ...i })),
      packagingMaterials: selectedMFR.packagingMaterials.map(m => ({ ...m })),
      lineClearance: { status: false }
    };
    setBmrs([newBMR, ...bmrs]);
    setIsIssuing(false);
    setIsSigning(false);
    setActiveTab('Execution');
  };

  const handleLineClearance = () => {
    if (selectedBMR) {
      const updated = { ...selectedBMR, lineClearance: { status: true, verifiedBy: user.fullName, verifiedDate: new Date().toISOString() } };
      setSelectedBMR(updated);
      setBmrs(bmrs.map(b => b.id === updated.id ? updated : b));
    }
  };

  const SCIHeader = ({ title, docNo, lot }: { title: string, docNo: string, lot?: string }) => (
    <div className="grid grid-cols-12 border-2 border-slate-900 text-[10px] font-bold bg-white mb-8 overflow-hidden rounded-lg">
      <div className="col-span-2 border-r-2 border-slate-900 p-4 flex items-center justify-center bg-slate-50">{SCI_LOGO}</div>
      <div className="col-span-7 border-r-2 border-slate-900 p-4 flex flex-col justify-center text-center">
        <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight leading-none">Sudanese Chemical Industries</h2>
        <p className="text-[8px] uppercase font-bold text-slate-400 mt-1">Quality Management System • GMP Compliant</p>
      </div>
      <div className="col-span-3 p-4 flex flex-col items-center justify-center text-indigo-600 bg-indigo-50/30">
        <span className="text-[10px] font-black uppercase tracking-widest">{lot ? 'BATCH RECORD' : 'MASTER FORMULA'}</span>
        <span className="text-[7px] font-bold mt-1 uppercase">Vault Verified</span>
      </div>
      <div className="col-span-12 border-t-2 border-slate-900 grid grid-cols-4 divide-x-2 divide-slate-900 bg-white">
        <div className="p-2 flex flex-col"><span className="text-slate-400 uppercase text-[7px]">Product</span><span className="truncate uppercase">{title}</span></div>
        <div className="p-2 flex flex-col"><span className="text-slate-400 uppercase text-[7px]">Doc Ref</span><span>{docNo}</span></div>
        <div className="p-2 flex flex-col"><span className="text-slate-400 uppercase text-[7px]">Lot No</span><span className="text-indigo-600 font-black">{lot || 'MASTER'}</span></div>
        <div className="p-2 flex flex-col"><span className="text-slate-400 uppercase text-[7px]">State</span><span className="text-emerald-600 uppercase">Secure</span></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Network Status */}
      {!isOnline && (
        <div className="bg-amber-500 text-white p-3 rounded-2xl flex items-center justify-between shadow-lg no-print border border-amber-600">
           <div className="flex items-center gap-3">
             <span className="text-lg">📵</span>
             <p className="text-[10px] font-black uppercase tracking-widest leading-none">Offline Mode: Local Vault Storage Active</p>
           </div>
           <span className="text-[9px] font-bold uppercase opacity-80">Full Records Access Enabled</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-between items-end no-print">
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[25px] border-2 border-slate-200">
          {(['MFR', 'Execution', 'Archive'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); setViewMode('list'); }} className={`px-10 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-xl border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab === 'MFR' ? 'Master Formulae' : tab === 'Execution' ? 'Batch Production' : 'Archives'}
            </button>
          ))}
        </div>
        {activeTab === 'MFR' && viewMode === 'list' && (
          <button onClick={() => setIsWizardOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all">✨ New Master Protocol</button>
        )}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'MFR' && viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mfrs.map(mfr => (
              <div key={mfr.id} className="bg-white p-10 rounded-[45px] border-2 border-slate-50 hover:border-indigo-500 hover:shadow-2xl transition-all group flex flex-col relative h-full">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">📄</div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-full border border-emerald-100">Effective</span>
                </div>
                <h4 onClick={() => { setSelectedMFR(mfr); setViewMode('mfr-detail'); }} className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4 cursor-pointer hover:text-indigo-600">{mfr.productName}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-10">{mfr.documentNo}</p>
                <div className="mt-auto flex gap-2">
                  <button onClick={() => { setSelectedMFR(mfr); setBatchNo(''); setIsIssuing(true); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[3px] shadow-lg hover:bg-indigo-700 transition-all">🚀 Issue Lot</button>
                  <button onClick={() => { setEditMfr(mfr); setViewMode('mfr-edit'); }} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200">Edit</button>
                  {user?.role?.toLowerCase() === 'admin' && (
                    <button 
                      onClick={() => {
                        if (window.confirm('Delete this Master Protocol?')) {
                          setMfrs(prev => prev.filter(m => m.id !== mfr.id));
                        }
                      }}
                      className="px-4 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'mfr-edit' && (
          <div className="bg-white rounded-[50px] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-500">
             <div className="bg-slate-900 p-12 text-white flex justify-between items-center no-print">
                <div>
                   <h3 className="text-3xl font-black uppercase tracking-tighter">Protocol Architect</h3>
                   <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[10px] mt-2">Design & Validate SCI Standards</p>
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setViewMode('list')} className="px-8 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase">Cancel</button>
                   <button onClick={saveMfr} className="px-10 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Approve & Save to Vault</button>
                </div>
             </div>

             <div className="bg-slate-50 p-4 flex gap-4 overflow-x-auto no-print">
                {(['Formulation', 'Manufacturing', 'Packaging'] as const).map(sec => (
                  <button key={sec} onClick={() => setActiveMfrSection(sec)} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMfrSection === sec ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-200'}`}>
                    {sec}
                  </button>
                ))}
             </div>

             <div className="p-12">
                {activeMfrSection === 'Formulation' && (
                  <div className="space-y-10">
                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Product Official Name</label>
                           <input value={editMfr.productName} onChange={e => setEditMfr({...editMfr, productName: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-lg font-black uppercase" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Batch Size (Standard)</label>
                           <input value={editMfr.batchSize} onChange={e => setEditMfr({...editMfr, batchSize: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-lg font-black" />
                        </div>
                     </div>
                     <div className="space-y-6">
                        <h4 className="text-lg font-black text-slate-900 uppercase border-l-4 border-indigo-600 pl-4">Raw Materials (Manufacturing BOM)</h4>
                        <table className="w-full border-collapse">
                           <thead>
                              <tr className="bg-slate-100 text-[10px] font-black uppercase">
                                 <th className="p-4 text-left">Material Name</th>
                                 <th className="p-4 text-center">Qty / Unit</th>
                                 <th className="p-4 text-right">Batch Theoretical</th>
                                 <th className="p-4 w-10"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {editMfr.ingredients?.map((ing, i) => (
                                <tr key={i}>
                                   <td className="p-2"><input value={ing.materialName} onChange={e => {
                                      const newIng = [...editMfr.ingredients!];
                                      newIng[i].materialName = e.target.value;
                                      setEditMfr({...editMfr, ingredients: newIng});
                                   }} className="w-full p-2 bg-transparent border-b outline-none text-xs font-bold uppercase" /></td>
                                   <td className="p-2"><input value={ing.qtyPerUnit} onChange={e => {
                                      const newIng = [...editMfr.ingredients!];
                                      newIng[i].qtyPerUnit = e.target.value;
                                      setEditMfr({...editMfr, ingredients: newIng});
                                   }} className="w-full p-2 bg-transparent border-b outline-none text-center text-xs" /></td>
                                   <td className="p-2"><input value={ing.theoreticalQty} onChange={e => {
                                      const newIng = [...editMfr.ingredients!];
                                      newIng[i].theoreticalQty = e.target.value;
                                      setEditMfr({...editMfr, ingredients: newIng});
                                   }} className="w-full p-2 bg-transparent border-b outline-none text-right text-xs font-black" /></td>
                                   <td className="p-2"><button onClick={() => {
                                      const newIng = editMfr.ingredients!.filter((_, idx) => idx !== i);
                                      setEditMfr({...editMfr, ingredients: newIng});
                                   }} className="text-rose-500 font-black">×</button></td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                        <button onClick={() => setEditMfr({...editMfr, ingredients: [...(editMfr.ingredients || []), { materialName: '', qtyPerUnit: '', theoreticalQty: '', unit: 'kg' }]})} className="text-[10px] font-black text-indigo-600 uppercase">+ Add Row</button>
                     </div>
                  </div>
                )}

                {activeMfrSection === 'Manufacturing' && (
                  <div className="space-y-6">
                     <h4 className="text-lg font-black text-slate-900 uppercase border-l-4 border-emerald-600 pl-4">Manufacturing Process Sequence</h4>
                     <div className="space-y-4">
                        {editMfr.steps?.map((s, i) => (
                           <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-200 group">
                              <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">{i+1}</span>
                              <div className="flex-1 grid grid-cols-4 gap-4">
                                 <input value={s.operation} onChange={e => {
                                    const newSteps = [...editMfr.steps!];
                                    newSteps[i].operation = e.target.value;
                                    setEditMfr({...editMfr, steps: newSteps});
                                 }} className="col-span-1 p-3 rounded-xl border bg-white text-[10px] font-black uppercase" placeholder="Operation" />
                                 <textarea value={s.instruction} onChange={e => {
                                    const newSteps = [...editMfr.steps!];
                                    newSteps[i].instruction = e.target.value;
                                    setEditMfr({...editMfr, steps: newSteps});
                                 }} className="col-span-3 p-3 rounded-xl border bg-white text-xs font-bold" placeholder="Instruction" />
                              </div>
                              <button onClick={() => {
                                 const newSteps = editMfr.steps!.filter((_, idx) => idx !== i);
                                 setEditMfr({...editMfr, steps: newSteps});
                              }} className="text-rose-500 font-black">×</button>
                           </div>
                        ))}
                        <button onClick={() => setEditMfr({...editMfr, steps: [...(editMfr.steps || []), { id: `s-${Date.now()}`, operation: '', instruction: '', category: 'Processing', isCritical: true }]})} className="text-[10px] font-black text-emerald-600 uppercase">+ Add Step</button>
                     </div>
                  </div>
                )}

                {activeMfrSection === 'Packaging' && (
                  <div className="space-y-12">
                     <div className="space-y-6">
                        <h4 className="text-lg font-black text-slate-900 uppercase border-l-4 border-amber-600 pl-4">Packaging Materials (Secondary BOM)</h4>
                        <table className="w-full">
                           <thead>
                              <tr className="bg-slate-100 text-[10px] font-black uppercase">
                                 <th className="p-4 text-left">Component Name</th>
                                 <th className="p-4 text-right">Theoretical Quantity</th>
                                 <th className="p-4 w-10"></th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {editMfr.packagingMaterials?.map((pm, i) => (
                                <tr key={i}>
                                   <td className="p-2"><input value={pm.materialName} onChange={e => {
                                      const newPM = [...editMfr.packagingMaterials!];
                                      newPM[i].materialName = e.target.value;
                                      setEditMfr({...editMfr, packagingMaterials: newPM});
                                   }} className="w-full p-2 bg-transparent border-b outline-none text-xs font-bold uppercase" /></td>
                                   <td className="p-2"><input value={pm.theoreticalQty} onChange={e => {
                                      const newPM = [...editMfr.packagingMaterials!];
                                      newPM[i].theoreticalQty = e.target.value;
                                      setEditMfr({...editMfr, packagingMaterials: newPM});
                                   }} className="w-full p-2 bg-transparent border-b outline-none text-right text-xs font-black" /></td>
                                   <td className="p-2"><button onClick={() => {
                                      const newPM = editMfr.packagingMaterials!.filter((_, idx) => idx !== i);
                                      setEditMfr({...editMfr, packagingMaterials: newPM});
                                   }} className="text-rose-500 font-black">×</button></td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                        <button onClick={() => setEditMfr({...editMfr, packagingMaterials: [...(editMfr.packagingMaterials || []), { materialName: '', qtyPerUnit: '-', theoreticalQty: '', unit: 'Nos' }]})} className="text-[10px] font-black text-amber-600 uppercase">+ Add Material</button>
                     </div>

                     <div className="space-y-6">
                        <h4 className="text-lg font-black text-slate-900 uppercase border-l-4 border-amber-600 pl-4">Packaging & Labeling Process</h4>
                        <div className="space-y-4">
                           {editMfr.packagingSteps?.map((ps, i) => (
                              <div key={i} className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                 <span className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs">{i+1}</span>
                                 <div className="flex-1 grid grid-cols-4 gap-4">
                                    <input value={ps.operation} onChange={e => {
                                       const newPS = [...editMfr.packagingSteps!];
                                       newPS[i].operation = e.target.value;
                                       setEditMfr({...editMfr, packagingSteps: newPS});
                                    }} className="col-span-1 p-3 rounded-xl border bg-white text-[10px] font-black uppercase" />
                                    <textarea value={ps.instruction} onChange={e => {
                                       const newPS = [...editMfr.packagingSteps!];
                                       newPS[i].instruction = e.target.value;
                                       setEditMfr({...editMfr, packagingSteps: newPS});
                                    }} className="col-span-3 p-3 rounded-xl border bg-white text-xs font-bold" />
                                 </div>
                                 <button onClick={() => {
                                    const newPS = editMfr.packagingSteps!.filter((_, idx) => idx !== i);
                                    setEditMfr({...editMfr, packagingSteps: newPS});
                                 }} className="text-rose-500 font-black">×</button>
                              </div>
                           ))}
                           <button onClick={() => setEditMfr({...editMfr, packagingSteps: [...(editMfr.packagingSteps || []), { id: `p-${Date.now()}`, operation: '', instruction: '', category: 'Packaging', isCritical: true }]})} className="text-[10px] font-black text-amber-600 uppercase">+ Add Step</button>
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* BMR Execution View (Live Control) */}
        {viewMode === 'bmr-execute' && selectedBMR && (
          <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
             <div className="bg-white rounded-[60px] w-full max-w-7xl max-h-full flex flex-col shadow-2xl overflow-hidden">
                <div className="bg-slate-900 p-12 text-white flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-8">
                      <button onClick={() => setViewMode('list')} className="text-4xl text-white/40 hover:text-white transition-colors">✕</button>
                      <div>
                         <h3 className="text-3xl font-black uppercase tracking-tighter">Live Production Log</h3>
                         <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[10px] mt-2 italic">Secured Lot Execution System</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-black uppercase">Batch No</p>
                      <p className="text-2xl font-black text-indigo-400">{selectedBMR.batchNumber}</p>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-16 space-y-20 custom-scrollbar bg-slate-50">
                   <div className="max-w-5xl mx-auto space-y-20 pb-32">
                      <section className={`p-12 rounded-[50px] shadow-sm border-2 transition-all ${selectedBMR.lineClearance.status ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                         <div className="flex justify-between items-center mb-10">
                            <h4 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-4">
                               <span className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl text-white">🧹</span> Area & Line Clearance
                            </h4>
                            {selectedBMR.lineClearance.status ? (
                               <div className="text-right">
                                  <p className="text-[9px] font-black text-emerald-600 uppercase">Verified by {selectedBMR.lineClearance.verifiedBy}</p>
                                  <p className="text-[8px] text-slate-400 font-bold">{new Date(selectedBMR.lineClearance.verifiedDate!).toLocaleString()}</p>
                               </div>
                            ) : (
                               <button onClick={handleLineClearance} className="px-10 py-4 bg-indigo-600 text-white rounded-3xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 transition-all">Authenticate Line Clearance</button>
                            )}
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {['Previous Labels Removed', 'Area Cleaning Complete', 'Equipment Log Verified'].map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-6 bg-white/50 rounded-3xl border border-slate-100">
                                 <input type="checkbox" checked={selectedBMR.lineClearance.status} readOnly className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600" />
                                 <span className="text-[11px] font-black text-slate-700 uppercase leading-tight">{item}</span>
                              </div>
                            ))}
                         </div>
                      </section>

                      {/* Manufacturing Section */}
                      <section className="space-y-10">
                         <h4 className="text-lg font-black uppercase tracking-widest text-slate-400 flex items-center gap-4">
                            <span className="h-0.5 bg-slate-200 flex-1"></span> Manufacturing Protocol <span className="h-0.5 bg-slate-200 flex-1"></span>
                         </h4>
                         <div className="space-y-8">
                            {selectedBMR.steps.map((step, i) => (
                               <div key={step.id} className={`p-10 rounded-[50px] bg-white border-2 flex gap-10 items-start transition-all shadow-sm ${
                                 step.checkedBy ? 'border-emerald-500 shadow-emerald-50' : 
                                 step.signOffBy ? 'border-indigo-500 shadow-indigo-50' : 
                                 step.isCritical ? 'border-rose-100' : 'border-slate-50'
                               }`}>
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0 ${
                                    step.checkedBy ? 'bg-emerald-600' :
                                    step.signOffBy ? 'bg-indigo-600' :
                                    step.isCritical ? 'bg-rose-600' : 'bg-slate-900'
                                  }`}>{i+1}</div>
                                  <div className="flex-1 space-y-6">
                                     <div className="flex justify-between items-start">
                                        <div>
                                           <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{step.operation}</p>
                                           <h5 className="text-base font-bold text-slate-700 leading-relaxed mt-2">{step.instruction}</h5>
                                        </div>
                                        {step.checkedBy && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-4 py-1 rounded-full uppercase">Verified</span>}
                                     </div>
                                     <div className="flex gap-4">
                                        <button 
                                          onClick={() => !step.signOffBy && handleExecutionSign(step.id, 'sign', 'steps')} 
                                          disabled={!!step.signOffBy}
                                          className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[4px] transition-all ${
                                            step.signOffBy ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-900 text-white shadow-lg hover:bg-black'
                                          }`}
                                        >
                                          {step.signOffBy ? `Signed: ${step.signOffBy}` : 'Sign Completion'}
                                        </button>
                                        <button 
                                          onClick={() => !step.checkedBy && handleExecutionSign(step.id, 'verify', 'steps')}
                                          disabled={!step.signOffBy || !!step.checkedBy}
                                          className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[4px] border-2 transition-all ${
                                            step.checkedBy ? 'bg-emerald-50 text-emerald-600 border-emerald-500' : 
                                            !step.signOffBy ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                                          }`}
                                        >
                                          {step.checkedBy ? `Verified: ${step.checkedBy}` : 'Verified By'}
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </section>

                      {/* Packaging Section */}
                      <section className="space-y-10">
                         <h4 className="text-lg font-black uppercase tracking-widest text-slate-400 flex items-center gap-4">
                            <span className="h-0.5 bg-slate-200 flex-1"></span> Packaging & Labeling <span className="h-0.5 bg-slate-200 flex-1"></span>
                         </h4>
                         <div className="space-y-8">
                            {selectedBMR.packagingSteps.map((step, i) => (
                               <div key={step.id} className={`p-10 rounded-[50px] bg-white border-2 flex gap-10 items-start transition-all shadow-sm ${
                                 step.checkedBy ? 'border-emerald-500 shadow-emerald-50' : 
                                 step.signOffBy ? 'border-amber-500 shadow-amber-50' : 'border-amber-100'
                               }`}>
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shrink-0 shadow-lg ${
                                    step.checkedBy ? 'bg-emerald-600' :
                                    step.signOffBy ? 'bg-amber-600' : 'bg-amber-400'
                                  }`}>{i+1}</div>
                                  <div className="flex-1 space-y-6">
                                     <div className="flex justify-between items-start">
                                        <div>
                                           <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">{step.operation}</p>
                                           <h5 className="text-base font-bold text-slate-700 leading-relaxed mt-2">{step.instruction}</h5>
                                        </div>
                                     </div>
                                     <div className="flex gap-4">
                                        <button 
                                          onClick={() => !step.signOffBy && handleExecutionSign(step.id, 'sign', 'packagingSteps')}
                                          disabled={!!step.signOffBy}
                                          className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[4px] transition-all ${
                                            step.signOffBy ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-amber-600 text-white shadow-lg shadow-amber-200 hover:bg-amber-700'
                                          }`}
                                        >
                                           {step.signOffBy ? `Signed: ${step.signOffBy}` : 'Sign Stage'}
                                        </button>
                                        <button 
                                          onClick={() => !step.checkedBy && handleExecutionSign(step.id, 'verify', 'packagingSteps')}
                                          disabled={!step.signOffBy || !!step.checkedBy}
                                          className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[4px] border-2 transition-all ${
                                            step.checkedBy ? 'bg-emerald-50 text-emerald-600 border-emerald-500' : 
                                            !step.signOffBy ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                                          }`}
                                        >
                                           {step.checkedBy ? `Verified: ${step.checkedBy}` : 'QA Verify'}
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </section>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Execution Queue */}
        {activeTab === 'Execution' && viewMode === 'list' && (
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden no-print">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-10 py-6">Lot ID</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th className="text-right px-10">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bmrs.map(bmr => (
                  <tr key={bmr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-6 font-black text-slate-900 text-base">{bmr.batchNumber}</td>
                    <td className="font-bold text-indigo-600 uppercase">{bmr.productName}</td>
                    <td><span className="px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase border border-blue-100">{bmr.status}</span></td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex gap-2 justify-end">
                         <button onClick={() => { setSelectedBMR(bmr); setViewMode('bmr-execute'); }} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">Enter production zone</button>
                         {user?.role?.toLowerCase() === 'admin' && (
                           <>
                             {bmr.status !== 'Completed' && (
                               <button 
                                 onClick={() => {
                                   const updated = { ...bmr, status: 'Completed' as const };
                                   setBmrs(prev => prev.map(b => b.id === updated.id ? updated : b));
                                 }}
                                 className="px-4 py-3 bg-emerald-600 text-white rounded-2xl text-[9px] font-black uppercase hover:bg-emerald-700"
                               >
                                 Close
                               </button>
                             )}
                             <button 
                               onClick={() => {
                                 if (window.confirm('Delete this batch record?')) {
                                   setBmrs(prev => prev.filter(b => b.id !== bmr.id));
                                 }
                               }}
                               className="px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[9px] font-black uppercase hover:bg-red-100"
                             >
                               Delete
                             </button>
                           </>
                         )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Protocol Creation Wizard */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[300] flex items-center justify-center p-6 animate-in zoom-in-95">
           <div className="bg-white rounded-[60px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/10">
              <div className="bg-slate-900 p-12 text-center text-white relative">
                 <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 transform rotate-12">✨</div>
                 <h3 className="text-3xl font-black uppercase tracking-tighter">AI Master Architect</h3>
                 <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[8px] mt-2 italic">Product Protocol Synthesis</p>
              </div>
              <div className="p-12 space-y-10">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">Enter Product Name (Common/Brand)</label>
                    <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Paracetamol BP" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-2xl font-black outline-none focus:border-indigo-500 uppercase text-center" />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsWizardOpen(false)} className="flex-1 py-6 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-3xl transition-all">Cancel</button>
                    <button onClick={initiateAiMfr} disabled={loading || !productName} className="flex-2 py-6 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-[5px] shadow-2xl hover:bg-black transition-all px-12">
                       {loading ? 'Synthesizing...' : 'Generate Draft Protocol'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Issuance Confirmation Modal */}
      {isIssuing && selectedMFR && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-6 animate-in zoom-in-95">
           <div className="bg-white rounded-[60px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/10">
              <div className="bg-indigo-600 p-12 text-center text-white relative">
                 <h3 className="text-4xl font-black uppercase tracking-tighter">Release Lot (BMR)</h3>
                 <p className="text-[10px] text-indigo-200 font-black uppercase tracking-[10px] mt-2 italic text-center">Official GxP Release Confirmation</p>
              </div>
              <div className="p-12 space-y-10 text-center">
                 <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Target Product Protocol</p>
                    <p className="text-xl font-black text-slate-800 uppercase">{selectedMFR.productName}</p>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest uppercase">Target Batch/Lot Number</label>
                    <input value={batchNo} onChange={e => setBatchNo(e.target.value)} placeholder="PARA-25-001" className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-3xl font-black outline-none focus:border-indigo-500 uppercase text-center font-mono" />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsIssuing(false)} className="flex-1 py-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                    <button onClick={() => setIsSigning(true)} disabled={!batchNo} className="flex-2 py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-[6px] shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 px-12">Authenticate & Issue</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isSigning && (
        <ESignatureModal 
          actionName={signingContext ? `BMR Execution Stage: ${signingContext.stepId}` : `BMR Release Auth: ${selectedMFR?.productName} Lot ${batchNo}`}
          defaultMeaning={signingContext ? (signingContext.type === 'sign' ? 'Authorship' : 'Verification') : 'Technical Release'}
          onConfirm={confirmSignature}
          onCancel={() => {
            setIsSigning(false);
            setSigningContext(null);
          }}
        />
      )}
    </div>
  );
};
