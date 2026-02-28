
import React, { useState, useEffect, useRef } from 'react';
import { COARecord, MaterialSpec, COAAttachment, User, COAType } from '../types';
import { getMonographTests } from '../geminiService';
import { logAuditAction } from '../services/AuditService';
import { ESignatureModal } from './ESignatureModal';
import { 
  Printer, 
  Download, 
  Plus, 
  Activity, 
  AlertCircle, 
  Database, 
  Trash2, 
  FileText, 
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface COAManagerProps {
  currentUser?: User;
}

const COA_TYPES: COAType[] = ['Finished Product', 'Raw Material', 'Water Analysis', 'Microbiology', 'Utilities', 'API'];

const BRAND_MAPPING: Record<string, string> = {
  'Paramol': 'Paracetamol',
  'Panadol': 'Paracetamol',
  'Flagyl': 'Metronidazole',
  'Effer-C': 'Effervescent Granules',
  'Effervescent Vitamin C': 'Effervescent Granules'
};

const BP_MONOGRAPH_LIBRARY: Record<string, Partial<COARecord>> = {
  'Paracetamol': {
    genericName: 'Paracetamol Tablets BP 2025',
    dosageForm: 'Tablets',
    category: 'Finished Product',
    specs: [
      { t: "Appearance", s: "White, circular, biconvex tablets", r: "White biconvex tablets", status: 'pass', category: 'Physical' },
      { t: "Hardness (Breaking Force)", s: "NLT 80 N", r: "98 N", status: 'pass', category: 'Physical' },
      { t: "Identification (IR)", s: "Conforms to BP Reference Standard", r: "Conforms", status: 'pass', category: 'Chemical' },
      { t: "Assay (Paracetamol)", s: "95.0% to 105.0% of labeled claim", r: "99.8%", status: 'pass', category: 'Chemical' },
      { t: "TAMC", s: "NMT 10³ CFU/g", r: "20 CFU/g", status: 'pass', category: 'Microbiological' },
      { t: "TYMC", s: "NMT 10² CFU/g", r: "< 10 CFU/g", status: 'pass', category: 'Microbiological' }
    ]
  },
  'Metronidazole': {
    genericName: 'Metronidazole Tablets BP 2025',
    dosageForm: 'Tablets',
    category: 'Finished Product',
    specs: [
      { t: "Appearance", s: "White or yellowish, circular tablets", r: "White circular tablets", status: 'pass', category: 'Physical' },
      { t: "Identification (IR)", s: "Conforms to reference spectrum", r: "Conforms", status: 'pass', category: 'Chemical' },
      { t: "Disintegration", s: "NMT 15 minutes", r: "8 minutes", status: 'pass', category: 'Physical' },
      { t: "Assay (Metronidazole)", s: "95.0% to 105.0%", r: "100.2%", status: 'pass', category: 'Chemical' }
    ]
  },
  'Aspirin': {
    genericName: 'Aspirin Tablets BP 2025',
    dosageForm: 'Tablets',
    category: 'Finished Product',
    specs: [
      { t: "Appearance", s: "White, crystalline powder or colorless crystals", r: "White tablets", status: 'pass', category: 'Physical' },
      { t: "Identification", s: "Conforms to BP tests", r: "Conforms", status: 'pass', category: 'Chemical' },
      { t: "Salicylic acid", s: "NMT 0.1%", r: "0.02%", status: 'pass', category: 'Chemical' },
      { t: "Assay (Aspirin)", s: "95.0% to 105.0%", r: "99.5%", status: 'pass', category: 'Chemical' }
    ]
  },
  'Effervescent Granules': {
    genericName: 'Effervescent Powder/Granules BP 2024',
    dosageForm: 'Powder',
    category: 'Finished Product',
    manufacturer: 'PharmaQualify Manufacturing Ltd.',
    manufacturerAddress: 'Industrial Zone 4, Quality Way, Pharma City, 55021',
    manufacturerId: 'LIC-PQ-2025-09921',
    shelfLife: '24 Months',
    storageCondition: 'Store in airtight containers. Protect from moisture (RH < 25%).',
    specs: [
      { t: "Appearance", s: "White to off-white coarse granules/powder", r: "White granules", status: 'pass', category: 'Descriptive' },
      { t: "Effervescence Time", s: "NMT 5 minutes in 200mL water @ 20°C (per BP Appendix XII E)", r: "2 min 15 sec", status: 'pass', category: 'Physical' },
      { t: "pH of Reconstituted Solution", s: "3.5 to 5.5 (1% aqueous solution)", r: "4.2", status: 'pass', category: 'Chemical' },
      { t: "Loss on Drying (Moisture Content)", s: "NMT 0.5% (60°C in vacuo)", r: "0.28%", status: 'pass', category: 'Chemical' },
      { t: "Carbon Dioxide yield", s: "NLT 8% w/w CO2 evolution", r: "10.2%", status: 'pass', category: 'Chemical' },
      { t: "Particle Size Distribution", s: "90% between 250µm and 1.5mm", r: "94.5%", status: 'pass', category: 'Physical' },
      { t: "Assay (Active Ingredient)", s: "95.0% to 105.0% of target", r: "100.4%", status: 'pass', category: 'Chemical' },
      { t: "TAMC", s: "NMT 10³ CFU/g", r: "15 CFU/g", status: 'pass', category: 'Microbiological' },
      { t: "TYMC", s: "NMT 10² CFU/g", r: "< 10 CFU/g", status: 'pass', category: 'Microbiological' },
      { t: "E. coli", s: "Absence in 1g", r: "Absent", status: 'pass', category: 'Microbiological' }
    ]
  },
  'Purified Water': {
    genericName: 'Purified Water BP 2024',
    dosageForm: 'Liquid',
    category: 'Water Analysis',
    specs: [
      { t: "Appearance", s: "Clear, colorless, odorless and tasteless liquid", r: "Complies", status: 'pass', category: 'Descriptive' },
      { t: "Conductivity (Stage 1)", s: "NMT 1.3 µS/cm @ 25.0°C", r: "0.8 µS/cm", status: 'pass', category: 'Physical' },
      { t: "Total Organic Carbon (TOC)", s: "NMT 500 ppb", r: "120 ppb", status: 'pass', category: 'Chemical' },
      { t: "Nitrates", s: "NMT 0.2 ppm", r: "< 0.2 ppm", status: 'pass', category: 'Chemical' },
      { t: "Heavy Metals", s: "NMT 0.1 ppm", r: "Complies", status: 'pass', category: 'Chemical' },
      { t: "TAMC", s: "NMT 100 CFU/mL", r: "2 CFU/mL", status: 'pass', category: 'Microbiological' }
    ]
  },
  'Compressed Air': {
    genericName: 'Compressed Air (Medicinal) BP 2024',
    dosageForm: 'Gas',
    category: 'Utilities',
    specs: [
      { t: "Oil Content", s: "NMT 0.1 mg/m³", r: "0.02 mg/m³", status: 'pass', category: 'Chemical' },
      { t: "Dew Point", s: "NMT -40°C", r: "-45°C", status: 'pass', category: 'Physical' },
      { t: "Carbon Monoxide", s: "NMT 5 ppm", r: "1 ppm", status: 'pass', category: 'Chemical' },
      { t: "Carbon Dioxide", s: "NMT 500 ppm", r: "350 ppm", status: 'pass', category: 'Chemical' },
      { t: "Water Vapor", s: "NMT 67 ppm", r: "45 ppm", status: 'pass', category: 'Chemical' }
    ]
  },
  'Amoxicillin': {
    genericName: 'Amoxicillin Capsules BP 2024',
    dosageForm: 'Capsules',
    category: 'Finished Product',
    specs: [
      { t: "Appearance", s: "Hard capsules containing white to off-white powder", r: "Complies", status: 'pass', category: 'Descriptive' },
      { t: "Identification (IR)", s: "Conforms to BP Reference Standard", r: "Conforms", status: 'pass', category: 'Chemical' },
      { t: "Dissolution", s: "NLT 80% (Q) in 30 minutes", r: "92%", status: 'pass', category: 'Physical' },
      { t: "Assay (Amoxicillin)", s: "92.5% to 107.5%", r: "99.1%", status: 'pass', category: 'Chemical' }
    ]
  },
  'Lactose Monohydrate': {
    genericName: 'Lactose Monohydrate BP 2024 / Ph.Eur.',
    dosageForm: 'Powder',
    category: 'Raw Material',
    specs: [
      { t: "Characters", s: "White or almost white, crystalline powder", r: "White powder", status: 'pass', category: 'Descriptive' },
      { t: "Identification (IR)", s: "Conforms to reference spectrum", r: "Conforms", status: 'pass', category: 'Chemical' },
      { t: "Acidity or Alkalinity", s: "NMT 0.4 mL of 0.01 M NaOH", r: "0.1 mL", status: 'pass', category: 'Chemical' },
      { t: "Specific Optical Rotation", s: "+54.4° to +55.9°", r: "+55.2°", status: 'pass', category: 'Physical' },
      { t: "Water (Karl Fischer)", s: "4.5% to 5.5%", r: "5.1%", status: 'pass', category: 'Chemical' }
    ]
  }
};

const generateRandomId = (prefix: string) => `${prefix}-${Math.floor(Math.random() * 90000 + 10000)}`;

export const COAManager: React.FC<COAManagerProps> = ({ currentUser }) => {
  const [coas, setCoas] = useState<COARecord[]>(() => {
    const saved = localStorage.getItem('master_coa_records_pro_v3');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedCOA, setSelectedCOA] = useState<COARecord | null>(coas[0] || null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<COAType | 'All'>('All');
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<COARecord>>({
    productName: '',
    batchNumber: '',
    batchSize: '',
    storageCondition: 'Store below 25°C. RH < 25%.',
    category: 'Finished Product',
    dosageForm: 'Powder',
    specs: [],
    sampleId: generateRandomId('SAM'),
    analysisNo: generateRandomId('ANL'),
    mfrNo: generateRandomId('MFR'),
    manufacturer: 'PharmaQualify Manufacturing Ltd.',
    marketComplaintStatus: 'Verified and Compliant'
  });

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedCOA ? `COA-${selectedCOA.coaNumber}` : 'COA',
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current || !selectedCOA) return;
    const element = printRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${selectedCOA.coaNumber}.pdf`);
  };

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(coas));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `coa_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  useEffect(() => {
    localStorage.setItem('master_coa_records_pro_v3', JSON.stringify(coas));
  }, [coas]);

  const handleIntializeProtocol = async () => {
    if (!wizardData.productName) return;
    setLoading(true);
    try {
      const searchName = BRAND_MAPPING[wizardData.productName] || wizardData.productName;
      const dbKey = Object.keys(BP_MONOGRAPH_LIBRARY).find(k => {
        const query = searchName.toLowerCase();
        const key = k.toLowerCase();
        return query.includes(key) || key.includes(query);
      });
      
      let finalSpecs: MaterialSpec[] = [];
      let meta = { ...wizardData };

      if (dbKey) {
        const entry = BP_MONOGRAPH_LIBRARY[dbKey];
        finalSpecs = entry.specs || [];
        meta = { ...meta, ...entry };
      } else if (navigator.onLine) {
        const aiTests = await getMonographTests(searchName, wizardData.category || 'Finished Product');
        finalSpecs = aiTests.map((t: any) => ({ ...t, r: 'PENDING', status: 'pass' }));
      }

      setWizardData({ ...meta, productName: wizardData.productName, batchNumber: wizardData.batchNumber, specs: finalSpecs });
      setWizardStep(2);
    } finally {
      setLoading(false);
    }
  };

  const finalizeRelease = (reason: string) => {
    const finalRecord: COARecord = {
      ...wizardData as COARecord,
      id: `coa-${Date.now()}`,
      coaNumber: `COA-${wizardData.batchNumber}-${Math.floor(Math.random() * 999)}`,
      status: 'Released',
      releasedBy: currentUser?.fullName || 'SYSTEM_AUTH',
      releaseDate: new Date().toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      mfgDate: wizardData.mfgDate || new Date().toISOString().split('T')[0],
      expDate: wizardData.expDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
      analyzedBy: currentUser?.fullName || 'QC Analyst',
      checkedBy: 'QC Supervisor',
      approvedBy: 'QA Manager'
    };
    if (currentUser) {
      logAuditAction(currentUser, 'COA_RELEASED', 'Laboratory', `Released COA ${finalRecord.coaNumber} for ${finalRecord.productName}.`);
    }
    setCoas([finalRecord, ...coas]);
    setSelectedCOA(finalRecord);
    setIsSignModalOpen(false);
    setIsWizardOpen(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="print-watermark">OFFICIAL LABORATORY RECORD</div>
      {isSignModalOpen && (
        <ESignatureModal 
          actionName={`Release of ${wizardData.productName} Batch ${wizardData.batchNumber}`}
          onConfirm={finalizeRelease}
          onCancel={() => setIsSignModalOpen(false)}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm no-print gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Activity className="text-white w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">COA Master Console</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[8px] mt-1">Pharmacopoeial Data Integrity Locked</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleBackup} className="bg-amber-50 text-amber-700 border border-amber-200 px-6 py-4 rounded-[25px] font-black text-xs uppercase hover:bg-amber-100 shadow-sm flex items-center gap-2 transition-all active:scale-95">
            <Database className="w-4 h-4" /> Backup System
          </button>
          <button onClick={() => { setWizardStep(1); setIsWizardOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-[25px] font-black text-xs uppercase hover:bg-black shadow-xl flex items-center gap-2 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> New Analytical Release
          </button>
        </div>
      </div>

      <div className="no-print">
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button 
            onClick={() => setActiveTab('All')}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'All' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            All Records
          </button>
          {COA_TYPES.map(type => (
            <button 
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4 no-print">
          <div className="bg-slate-900 rounded-[35px] p-6 text-white h-[650px] flex flex-col shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Master Ledger</p>
               <Database className="w-4 h-4 text-slate-500" />
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {coas.filter(c => activeTab === 'All' || c.category === activeTab).length === 0 ? (
                  <div className="text-center py-10 opacity-30">
                    <FileText className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase">No records</p>
                  </div>
                ) : (
                  coas.filter(c => activeTab === 'All' || c.category === activeTab).map(coa => (
                    <button key={coa.id} onClick={() => setSelectedCOA(coa)} className={`w-full text-left p-5 rounded-3xl border-2 transition-all group ${selectedCOA?.id === coa.id ? 'border-blue-500 bg-blue-600/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase">{coa.category}</p>
                        {coa.status === 'Released' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                      </div>
                      <p className="text-sm font-black text-slate-100 truncate group-hover:text-white transition-colors">{coa.productName}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">LOT: {coa.batchNumber}</p>
                        <p className="text-[8px] font-black text-slate-600">{coa.releaseDate}</p>
                      </div>
                    </button>
                  ))
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedCOA ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[35px] border-2 border-slate-100 flex justify-between items-center no-print shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Released By</p>
                    <p className="text-xs font-black text-slate-900">{selectedCOA.releasedBy} on {selectedCOA.releaseDate}</p>
                  </div>
                  {currentUser?.role?.toLowerCase() === 'admin' && (
                    <button 
                      onClick={() => {
                        if (window.confirm('Delete this COA record?')) {
                          setCoas(prev => prev.filter(c => c.id !== selectedCOA.id));
                          setSelectedCOA(null);
                        }
                      }}
                      className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={handleDownloadPDF} className="bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-200 transition-all">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                  <button onClick={handlePrint} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95">
                    <Printer className="w-4 h-4" /> Print Certificate
                  </button>
                </div>
              </div>

              <div ref={printRef} className="bg-white p-12 md:p-20 rounded-[60px] shadow-2xl border-4 border-slate-900 print-full-width relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
                
                <div className="flex justify-between items-start mb-16">
                  <div className="text-left">
                    <h1 className="text-4xl font-black uppercase tracking-tight mb-2">{selectedCOA.manufacturer.toUpperCase()}</h1>
                    <p className="text-[10px] font-bold text-slate-500 max-w-xs leading-relaxed">{selectedCOA.manufacturerAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-400 mb-2">Certificate of Analysis</p>
                    <p className="text-2xl font-black text-slate-900">{selectedCOA.coaNumber}</p>
                  </div>
                </div>

                <div className="text-center mb-16 border-y-2 border-slate-950 py-10">
                   <p className="text-[10px] font-black uppercase tracking-[10px] mb-4 text-slate-400">Official Laboratory Record</p>
                   <h2 className="text-4xl font-black uppercase tracking-tight mb-2">{selectedCOA.productName}</h2>
                   <p className="text-base font-bold italic bg-slate-100 py-2 inline-block px-10 rounded-full">{selectedCOA.genericName}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 p-8 text-[11px] font-bold border-2 border-slate-950 bg-slate-50 rounded-3xl">
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Lot Identification</p><p className="text-sm font-black">{selectedCOA.batchNumber}</p></div>
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Batch Size</p><p className="text-sm font-black">{selectedCOA.batchSize}</p></div>
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Mfg Date</p><p className="text-sm font-black">{selectedCOA.mfgDate}</p></div>
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Exp Date</p><p className="text-sm font-black">{selectedCOA.expDate}</p></div>
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Analysis No</p><p className="text-sm font-black">{selectedCOA.analysisNo}</p></div>
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Sample ID</p><p className="text-sm font-black">{selectedCOA.sampleId}</p></div>
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Dosage Form</p><p className="text-sm font-black">{selectedCOA.dosageForm}</p></div>
                   <div><p className="text-slate-400 uppercase text-[8px] mb-1">Strength</p><p className="text-sm font-black">{selectedCOA.strength || 'N/A'}</p></div>
                </div>

                <div className="space-y-16">
                   {['Descriptive', 'Physical', 'Chemical', 'Microbiological'].map(cat => {
                     const catSpecs = selectedCOA.specs.filter(s => s.category === cat);
                     if (catSpecs.length === 0) return null;
                     return (
                       <div key={cat} className="animate-in fade-in slide-in-from-top-4">
                         <h3 className="text-xs font-black uppercase tracking-[6px] mb-6 border-l-4 border-slate-950 pl-4">{cat} Profile</h3>
                         <table className="w-full text-left border-2 border-slate-950">
                           <thead className="bg-slate-100 text-[10px] font-black uppercase">
                             <tr className="border-b-2 border-slate-950">
                               <th className="p-4 border-r-2 border-slate-950">Parameter</th>
                               <th className="p-4 border-r-2 border-slate-950">Monograph Limit</th>
                               <th className="p-4 border-r-2 border-slate-950">Actual Observation</th>
                               <th className="p-4 text-center">Compliance</th>
                             </tr>
                           </thead>
                           <tbody className="text-[12px] font-bold">
                             {catSpecs.map((s, i) => (
                               <tr key={i} className="border-b border-slate-200 last:border-0">
                                 <td className="p-4 border-r-2 border-slate-950 bg-slate-50/30">{s.t}</td>
                                 <td className="p-4 border-r-2 border-slate-950 italic whitespace-pre-wrap">{s.s}</td>
                                 <td className="p-4 border-r-2 border-slate-950 font-mono text-blue-700">{s.r}</td>
                                 <td className="p-4 text-center">
                                   <span className={`text-[9px] font-black uppercase px-3 py-1 border rounded ${
                                     s.status === 'pass' ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-rose-500 text-rose-600 bg-rose-50'
                                   }`}>
                                     {s.status === 'pass' ? 'Complies' : 'Does Not Comply'}
                                   </span>
                                 </td>
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>
                     );
                   })}
                </div>

                <div className="mt-16 p-8 border-2 border-slate-950 italic text-xs font-bold bg-slate-50 rounded-3xl">
                   <p className="mb-4"><strong>Compliance Statement:</strong> The batch mentioned above has been analyzed as per the specifications of {selectedCOA.productName} and is found to be <strong>{selectedCOA.specs.every(t => t.status === 'pass') ? 'COMPLYING' : 'NOT COMPLYING'}</strong> with the requirements.</p>
                   <p><strong>Market Complaint / Recall Compliance:</strong> {selectedCOA.marketComplaintStatus || 'Verified and Compliant'}</p>
                </div>

                <div className="mt-24 pt-12 border-t-2 border-slate-950 grid grid-cols-3 gap-12 text-center uppercase tracking-widest">
                   <div className="space-y-4">
                      <div className="h-12 flex items-end justify-center font-serif italic text-lg text-slate-400">/ {selectedCOA.analyzedBy} /</div>
                      <p className="text-[10px] font-black border-t border-slate-950 pt-2">Analyzed By</p>
                   </div>
                   <div className="space-y-4">
                      <div className="h-12 flex items-end justify-center font-serif italic text-lg text-slate-400">/ {selectedCOA.checkedBy} /</div>
                      <p className="text-[10px] font-black border-t border-slate-950 pt-2">Checked By</p>
                   </div>
                   <div className="space-y-4">
                      <div className="h-12 flex items-end justify-center font-serif italic text-lg text-slate-400">/ {selectedCOA.approvedBy} /</div>
                      <p className="text-[10px] font-black border-t border-slate-950 pt-2">Approved By (QA)</p>
                   </div>
                </div>

                <div className="absolute bottom-10 right-10 w-44 h-44 border-8 border-double border-slate-950 rounded-full flex items-center justify-center rotate-[-15deg] mix-blend-multiply bg-slate-950/5 opacity-50 pointer-events-none">
                   <div className="text-center font-black">
                      <p className="text-2xl leading-none">QC</p>
                      <p className="text-[10px] mt-1">PASSED</p>
                      <div className="h-0.5 w-24 bg-slate-950 my-2 mx-auto"></div>
                      <p className="text-[10px]">{selectedCOA.releaseDate}</p>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full border-4 border-dashed border-slate-200 rounded-[50px] flex flex-col items-center justify-center p-20 text-center opacity-30">
               <span className="text-9xl mb-10 grayscale">🔬</span>
               <p className="text-xl md:text-2xl font-black uppercase tracking-[15px]">Select Lab Record</p>
            </div>
          )}
        </div>
      </div>

      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[50px] w-full max-w-5xl shadow-2xl flex flex-col animate-in zoom-in-95 my-auto">
             <div className="bg-slate-900 p-12 text-white flex justify-between items-center">
                <div>
                   <h3 className="text-4xl font-black uppercase tracking-tighter">Analytical Release Wizard</h3>
                   <p className="text-[10px] text-blue-400 font-black uppercase tracking-[10px] mt-2 italic">BP 2024 / USP Monograph Surveillance</p>
                </div>
                <button onClick={() => setIsWizardOpen(false)} className="text-3xl p-4">✕</button>
             </div>

             <div className="flex-1 p-16 space-y-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {wizardStep === 1 ? (
                  <div className="space-y-10">
                     <div className="bg-blue-50 p-8 rounded-[40px] border-2 border-blue-100">
                        <div className="flex items-center gap-4 mb-6">
                           <AlertCircle className="text-blue-600 w-6 h-6" />
                           <p className="text-sm font-black text-blue-900 uppercase tracking-widest">Step 1: Protocol Initialization</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                           <div>
                              <label className="block text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">Category</label>
                              <select value={wizardData.category} onChange={e => setWizardData({...wizardData, category: e.target.value as any})} className="w-full p-5 bg-white border-2 border-blue-100 rounded-2xl font-black text-sm focus:border-blue-500 transition-all outline-none">
                                 {COA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">Material Name</label>
                              <input value={wizardData.productName} onChange={e => setWizardData({...wizardData, productName: e.target.value})} className="w-full p-5 bg-white border-2 border-blue-100 rounded-2xl font-black text-lg focus:border-blue-500 transition-all outline-none" placeholder="e.g. Paracetamol Effervescent" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Batch Number</label>
                           <input value={wizardData.batchNumber} onChange={e => setWizardData({...wizardData, batchNumber: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm font-mono" placeholder="BN-2025-001" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Batch Size</label>
                           <input value={wizardData.batchSize} onChange={e => setWizardData({...wizardData, batchSize: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm" placeholder="100,000 Tablets" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Strength</label>
                           <input value={wizardData.strength} onChange={e => setWizardData({...wizardData, strength: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm" placeholder="500mg" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Mfg Date</label>
                           <input type="date" value={wizardData.mfgDate} onChange={e => setWizardData({...wizardData, mfgDate: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Exp Date</label>
                           <input type="date" value={wizardData.expDate} onChange={e => setWizardData({...wizardData, expDate: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Dosage Form</label>
                           <input value={wizardData.dosageForm} onChange={e => setWizardData({...wizardData, dosageForm: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm" placeholder="Tablets" />
                        </div>
                     </div>

                     <div className="space-y-6">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Manufacturer Details</label>
                        <input value={wizardData.manufacturer} onChange={e => setWizardData({...wizardData, manufacturer: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm" placeholder="Manufacturer Name" />
                        <textarea value={wizardData.manufacturerAddress} onChange={e => setWizardData({...wizardData, manufacturerAddress: e.target.value})} className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm h-24" placeholder="Manufacturer Address" />
                     </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Step 2: Analytical Observations</p>
                        <button 
                          onClick={() => setWizardData({...wizardData, specs: [...(wizardData.specs || []), { t: '', s: '', r: '', status: 'pass', category: 'Physical' }]})}
                          className="text-[10px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3" /> Add Custom Parameter
                        </button>
                     </div>
                     <div className="grid grid-cols-12 gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest px-8">
                        <div className="col-span-4">Test Parameter</div>
                        <div className="col-span-3">Specification</div>
                        <div className="col-span-3">Actual Result</div>
                        <div className="col-span-2 text-center">Inference</div>
                     </div>
                     {wizardData.specs?.map((spec, i) => (
                       <div key={i} className="p-6 bg-white border-2 border-slate-100 rounded-[30px] grid grid-cols-12 gap-6 items-center hover:border-blue-200 transition-all group">
                          <div className="col-span-4">
                             <input 
                               className="w-full bg-transparent font-black text-sm outline-none"
                               value={spec.t}
                               onChange={(e) => {
                                 const newSpecs = [...(wizardData.specs || [])];
                                 newSpecs[i].t = e.target.value;
                                 setWizardData({...wizardData, specs: newSpecs});
                               }}
                               placeholder="Test Name"
                             />
                             <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{spec.category}</p>
                          </div>
                          <div className="col-span-3">
                             <textarea 
                               className="w-full bg-transparent text-[11px] font-bold text-slate-500 outline-none resize-none"
                               value={spec.s}
                               onChange={(e) => {
                                 const newSpecs = [...(wizardData.specs || [])];
                                 newSpecs[i].s = e.target.value;
                                 setWizardData({...wizardData, specs: newSpecs});
                               }}
                               placeholder="Limit"
                               rows={2}
                             />
                          </div>
                          <div className="col-span-3">
                             <input 
                               className="w-full p-3 bg-slate-50 rounded-xl text-sm font-black border-2 border-transparent focus:border-blue-500 transition-all outline-none"
                               placeholder="Reading..."
                               value={spec.r}
                               onChange={(e) => {
                                 const newSpecs = [...(wizardData.specs || [])];
                                 newSpecs[i].r = e.target.value;
                                 setWizardData({...wizardData, specs: newSpecs});
                               }}
                             />
                          </div>
                          <div className="col-span-2 flex justify-center">
                             <select 
                               value={spec.status} 
                               onChange={(e) => {
                                 const newSpecs = [...(wizardData.specs || [])];
                                 newSpecs[i].status = e.target.value as any;
                                 setWizardData({...wizardData, specs: newSpecs});
                               }}
                               className={`text-[9px] font-black uppercase p-2 rounded-lg border-2 transition-all outline-none ${
                                 spec.status === 'pass' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-rose-500 text-rose-700 bg-rose-50'
                               }`}
                             >
                               <option value="pass">Pass</option>
                               <option value="fail">Fail</option>
                               <option value="Pending">Pending</option>
                               <option value="N/A">N/A</option>
                             </select>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
             </div>

             <div className="p-12 border-t border-slate-100 flex justify-end gap-6 bg-slate-50 rounded-b-[50px]">
                {wizardStep === 1 ? (
                  <button onClick={handleIntializeProtocol} disabled={loading || !wizardData.productName} className="px-20 py-6 bg-slate-900 text-white rounded-[25px] font-black uppercase text-xs">Load Monograph Protocol →</button>
                ) : (
                  <button onClick={() => setIsSignModalOpen(true)} className="px-20 py-6 bg-blue-600 text-white rounded-[25px] font-black uppercase text-xs">Review & E-Sign Release</button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
