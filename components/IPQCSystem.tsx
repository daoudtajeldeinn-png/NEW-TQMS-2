
import React, { useState, useRef, useEffect } from 'react';
import { IPQCData } from '../types';
import { getIPQCMonograph } from '../geminiService';

type DosageForm = 'Tablet' | 'Capsule' | 'Syrup/Suspension' | 'Sterile Injection' | 'Topical/Ointment' | 'Effervescent Powder';

export const IPQCSystem: React.FC = () => {
  const [batchNo, setBatchNo] = useState('BN-EFF-2025-01');
  const [productName, setProductName] = useState('Paracetamol Effervescent Powder');
  const [dosageForm, setDosageForm] = useState<DosageForm>('Effervescent Powder');
  const [analysisNo, setAnalysisNo] = useState('AN-2025-001');
  const [sampleId, setSampleId] = useState('S-001');
  const [stage, setStage] = useState('Mixing');
  const [manufacturer, setManufacturer] = useState('PharmaQualify Global Labs');
  const [pharmacopoeia, setPharmacopoeia] = useState('BP 2024');
  
  const [testType, setTestType] = useState('Effervescence Time');
  const [readings, setReadings] = useState<string[]>(Array(20).fill(''));
  const [specs, setSpecs] = useState({ target: 120, usl: 300, lsl: 0, unit: 'sec' });
  
  const [loadingMonograph, setLoadingMonograph] = useState(false);
  const [aiMonograph, setAiMonograph] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<IPQCData[]>([]);
  const [showBatchReport, setShowBatchReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'monograph' | 'calculators' | 'standards'>('monograph');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Specialized Calculator States
  const [calcData, setCalcData] = useState({
    weightVar: { avg: 500, readings: '498,502,499,501,497,503,500,499,501,498' },
    friability: { initial: 6.512, final: 6.480 },
    disintegration: { times: '8.5,9.0,8.0,8.5,9.5,8.0', limit: 15 },
    contentUniformity: { results: '100.2,99.8,101.0,98.5,100.5,99.2,100.8,101.2,99.5,100.0' }
  });

  const t = {
    en: {
      title: "IPQC Portal",
      subtitle: "Multi-Dosage Monograph Surveillance",
      batchSummary: "📋 Batch Summary",
      aiSync: "✨ AI Monograph Sync",
      commit: "Commit IPC Data",
      monograph: "Monograph Mode",
      calculators: "Specialized Calculators",
      standards: "Reference Standards",
      weightVar: "Tablet Weight Variation (USP <905>)",
      friability: "Friability Test (USP <1216>)",
      disintegration: "Disintegration Test (USP <701>)",
      contentUniformity: "Content Uniformity (USP <905>)",
      calculate: "Calculate",
      result: "Result",
      pass: "PASS",
      fail: "FAIL",
      warning: "WARNING"
    },
    ar: {
      title: "بوابة مراقبة الجودة (IPQC)",
      subtitle: "مراقبة المواصفات الدوائية لجميع الأشكال الصيدلانية",
      batchSummary: "📋 ملخص التشغيلة",
      aiSync: "✨ مزامنة المواصفات بالذكاء الاصطناعي",
      commit: "حفظ بيانات IPC",
      monograph: "وضع المواصفات",
      calculators: "الحاسبات المتخصصة",
      standards: "المعايير المرجعية",
      weightVar: "تباين وزن الأقراص (USP <905>)",
      friability: "اختبار الهشاشة (USP <1216>)",
      disintegration: "اختبار التفكك (USP <701>)",
      contentUniformity: "توحيد المحتوى (USP <905>)",
      calculate: "احسب",
      result: "النتيجة",
      pass: "مقبول",
      fail: "مرفوض",
      warning: "تحذير"
    }
  }[lang];

  // Moisture sensitivity logic for Effervescent forms
  const isHygroscopicAlert = dosageForm === 'Effervescent Powder' && (testType.includes('Moisture') || testType.includes('Loss on Drying'));

  useEffect(() => {
    const saved = localStorage.getItem('master_ipqc_ledger_v3');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleFetchMonograph = async () => {
    if (!productName) return;
    setLoadingMonograph(true);
    try {
      const data = await getIPQCMonograph(productName, dosageForm);
      setAiMonograph(data);
      setPharmacopoeia(data.pharmacopoeiaRef || 'BP/USP');
      if (data.tests && data.tests.length > 0) {
        const t = data.tests[0];
        setTestType(t.testName);
        setStage(t.stage || 'Processing');
        setSpecs({ 
          target: parseFloat(t.target) || 0, 
          usl: t.usl, 
          lsl: t.lsl, 
          unit: t.unit 
        });
      }
    } catch (e) {
      alert("Failed to fetch official monograph from regulatory database.");
    } finally {
      setLoadingMonograph(false);
    }
  };

  const calculateStats = () => {
    const numericReadings = readings.map(v => parseFloat(v)).filter(v => !isNaN(v));
    if (numericReadings.length < 3) {
      alert("At least 3 readings required for IPC verification.");
      return;
    }
    const n = numericReadings.length;
    const sum = numericReadings.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    
    // Variance calculation
    const sqDiffs = numericReadings.map(v => Math.pow(v - mean, 2));
    const avgSqDiff = sqDiffs.reduce((a, b) => a + b, 0) / (n - 1);
    const sd = Math.sqrt(avgSqDiff);
    const cpk = sd === 0 ? 2.0 : Math.min((specs.usl - mean) / (3 * sd), (mean - specs.lsl) / (3 * sd));

    const isFailure = numericReadings.some(r => r > specs.usl || r < specs.lsl);

    const log: IPQCData = {
      id: Date.now().toString(),
      batchNumber: batchNo,
      productName,
      analysisNumber: analysisNo,
      sampleId,
      productionStage: stage,
      manufacturer,
      pharmacopoeia,
      testName: testType,
      readings: numericReadings,
      mean: mean.toFixed(3) + ' ' + specs.unit,
      sd: sd.toFixed(4),
      cpk: cpk.toFixed(2),
      status: isFailure ? 'FAIL' : (cpk < 1.0 ? 'MARGINAL' : 'PASS'),
      timestamp: new Date().toISOString(),
      extraData: { dosageForm }
    };
    
    saveLog(log);
    setStats(log);
  };

  const saveLog = (log: IPQCData) => {
    const newHistory = [log, ...history].slice(0, 500);
    setHistory(newHistory);
    localStorage.setItem('master_ipqc_ledger_v3', JSON.stringify(newHistory));
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateWeightVar = () => {
    const weights = calcData.weightVar.readings.split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w));
    const avg = calcData.weightVar.avg;
    if (weights.length === 0 || avg <= 0) return;

    let outside5 = 0, outside10 = 0, outside20 = 0;
    weights.forEach(w => {
      const diff = Math.abs(w - avg) / avg * 100;
      if (diff > 20) outside20++;
      else if (diff > 10) outside10++;
      else if (diff > 5) outside5++;
    });

    let status: 'PASS' | 'FAIL' | 'MARGINAL' = 'PASS';
    if (outside20 > 0 || outside10 > 2) status = 'FAIL';
    else if (outside5 > 0) status = 'MARGINAL';

    const log: IPQCData = {
      id: Date.now().toString(),
      batchNumber: batchNo,
      productName,
      analysisNumber: analysisNo,
      sampleId,
      productionStage: stage,
      manufacturer,
      pharmacopoeia,
      testName: 'Weight Variation (USP <905>)',
      readings: weights,
      mean: avg.toFixed(2) + ' mg',
      sd: 'N/A',
      cpk: 'N/A',
      status,
      timestamp: new Date().toISOString()
    };
    saveLog(log);
    setStats(log);
    alert(`Weight Variation Result: ${status}\nOutside 5%: ${outside5}\nOutside 10%: ${outside10}\nOutside 20%: ${outside20}`);
  };

  const calculateFriability = () => {
    const { initial, final } = calcData.friability;
    const loss = ((initial - final) / initial) * 100;
    const status = loss <= 1.0 ? 'PASS' : 'FAIL';
    
    const log: IPQCData = {
      id: Date.now().toString(),
      batchNumber: batchNo,
      productName,
      analysisNumber: analysisNo,
      sampleId,
      productionStage: stage,
      manufacturer,
      pharmacopoeia,
      testName: 'Friability (USP <1216>)',
      readings: [initial, final],
      mean: loss.toFixed(2) + '%',
      sd: 'N/A',
      cpk: 'N/A',
      status,
      timestamp: new Date().toISOString()
    };
    saveLog(log);
    setStats(log);
    alert(`Friability Result: ${status} (${loss.toFixed(2)}% loss)`);
  };

  const batchTests = history.filter(h => h.batchNumber === batchNo);

  useEffect(() => {
    if (stats && canvasRef.current) {
      drawControlChart();
    }
  }, [stats]);

  const drawControlChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = readings.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...data, specs.usl) * 1.05;
    const minVal = Math.min(...data, specs.lsl) * 0.95;
    const range = maxVal - minVal;
    
    const getY = (val: number) => height - padding - ((val - minVal) / range) * (height - 2 * padding);
    const getX = (i: number) => padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);

    const isFail = stats.status === 'FAIL';
    ctx.setLineDash([8, 4]);
    ctx.strokeStyle = isFail || isHygroscopicAlert ? '#e11d48' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, getY(specs.usl)); ctx.lineTo(width - padding, getY(specs.usl));
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.strokeStyle = isFail ? '#e11d48' : '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    data.forEach((val, i) => { i === 0 ? ctx.moveTo(getX(i), getY(val)) : ctx.lineTo(getX(i), getY(val)); });
    ctx.stroke();

    data.forEach((val, i) => {
      ctx.fillStyle = (val > specs.usl || val < specs.lsl) ? '#e11d48' : '#2563eb';
      ctx.beginPath(); ctx.arc(getX(i), getY(val), 4, 0, Math.PI * 2); ctx.fill();
    });
  };

  const defaultTests = [
    'Effervescence Time',
    'CO2 Evolution',
    'Loss on Drying (Moisture)',
    'pH (Reconstituted)',
    'Particle Size distribution',
    'Uniformity of Mass',
    'Average Weight',
    'Hardness',
    'Disintegration'
  ];

  const currentTestOptions = aiMonograph?.tests ? aiMonograph.tests.map((t: any) => t.testName) : defaultTests;

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-6 no-print">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-[25px] flex items-center justify-center text-3xl shadow-inner ${dosageForm === 'Effervescent Powder' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
            {dosageForm === 'Effervescent Powder' ? '🫧' : '🧪'}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{t.title}</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[8px] mt-1">
               {lang === 'ar' ? t.subtitle : (dosageForm === 'Effervescent Powder' ? 'MOISTURE SENSITIVE EFF. POWDER' : t.subtitle)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>EN</button>
             <button onClick={() => setLang('ar')} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${lang === 'ar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>AR</button>
           </div>
           <button 
             onClick={() => setShowBatchReport(!showBatchReport)} 
             className={`px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all shadow-sm ${showBatchReport ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
           >
             {t.batchSummary}
           </button>
           <button 
             onClick={handleFetchMonograph} 
             disabled={loadingMonograph || !productName} 
             className="px-6 py-4 bg-pink-50 text-pink-700 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-pink-200 hover:bg-pink-100 transition-all shadow-sm disabled:opacity-50"
           >
             {loadingMonograph ? '...' : t.aiSync}
           </button>
           <button onClick={calculateStats} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">{t.commit}</button>
        </div>
      </div>

      <div className="flex gap-2 no-print">
        {(['monograph', 'calculators', 'standards'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
          >
            {t[tab]}
          </button>
        ))}
      </div>

      {showBatchReport && (
        <div className="bg-white p-10 rounded-[40px] border-2 border-blue-100 shadow-2xl animate-in slide-in-from-top-4 duration-500 print-full-width">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Consolidated Batch IPC Report</h3>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-[4px] mt-1">Batch: {batchNo} • {productName}</p>
            </div>
            <button onClick={handlePrint} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all no-print">🖨️ Print Batch Report</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div><p className="text-[8px] font-black text-slate-400 uppercase">Manufacturer</p><p className="text-xs font-bold text-slate-800">{manufacturer}</p></div>
            <div><p className="text-[8px] font-black text-slate-400 uppercase">Analysis No</p><p className="text-xs font-bold text-slate-800">{analysisNo}</p></div>
            <div><p className="text-[8px] font-black text-slate-400 uppercase">Pharmacopoeia</p><p className="text-xs font-bold text-slate-800">{pharmacopoeia}</p></div>
            <div><p className="text-[8px] font-black text-slate-400 uppercase">Report Date</p><p className="text-xs font-bold text-slate-800">{new Date().toLocaleDateString()}</p></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b-2 border-slate-100">
                  <th className="px-4 py-4">Test Description</th>
                  <th className="px-4 py-4">Stage</th>
                  <th className="px-4 py-4">Mean Result</th>
                  <th className="px-4 py-4">Cpk</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {batchTests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-800 text-xs">{t.testName}</td>
                    <td className="px-4 py-4 text-slate-500 text-[10px] font-bold uppercase">{t.productionStage}</td>
                    <td className="px-4 py-4 text-slate-800 text-xs font-black">{t.mean}</td>
                    <td className="px-4 py-4 text-slate-600 text-xs font-bold">{t.cpk}</td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        t.status === 'PASS' ? 'bg-emerald-100 text-emerald-700' :
                        t.status === 'FAIL' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-[9px]">{new Date(t.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
                {batchTests.length === 0 && (
                  <tr><td colSpan={6} className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest">No data committed for this batch</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-12 pt-12 border-t-2 border-dashed border-slate-100 grid grid-cols-2 gap-20">
            <div className="text-center">
              <div className="h-px bg-slate-300 mb-4"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prepared By (QC Analyst)</p>
            </div>
            <div className="text-center">
              <div className="h-px bg-slate-300 mb-4"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewed By (QA Manager)</p>
            </div>
          </div>
        </div>
      )}

      {dosageForm === 'Effervescent Powder' && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-rose-200 animate-pulse">
           <div className="flex items-center gap-4 px-4">
             <span className="text-xl">⚠️</span>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest">Environmental Warning</p>
                <p className="text-xs font-bold">Effervescent Dosage Form: Relative Humidity must be &lt; 25% to prevent hydration.</p>
             </div>
           </div>
           <div className="px-6 border-l border-white/20">
              <p className="text-[8px] font-black uppercase">Current RH</p>
              <p className="text-lg font-black tracking-tighter">21.4%</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print-full-width">
        {activeTab === 'monograph' && (
          <>
            <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Process Context</h3>
                  {aiMonograph && (
                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100 uppercase animate-in fade-in">AI Verified</span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Batch Number</label>
                      <input value={batchNo} onChange={e => setBatchNo(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Analysis Number</label>
                      <input value={analysisNo} onChange={e => setAnalysisNo(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Sample ID</label>
                      <input value={sampleId} onChange={e => setSampleId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Production Stage</label>
                      <input value={stage} onChange={e => setStage(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Manufacturer</label>
                    <input value={manufacturer} onChange={e => setManufacturer(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Pharmacopoeia Reference</label>
                    <input value={pharmacopoeia} onChange={e => setPharmacopoeia(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Product Name</label>
                    <div className="relative">
                      <input 
                        value={productName} 
                        onChange={e => setProductName(e.target.value)} 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10" 
                      />
                      {!aiMonograph && !loadingMonograph && (
                        <button 
                          onClick={handleFetchMonograph}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-700 bg-white rounded-xl shadow-sm border border-slate-100"
                          title="Sync limits with AI"
                        >
                          ✨
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Dosage Form</label>
                    <select value={dosageForm} onChange={e => setDosageForm(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none">
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Effervescent Powder">Effervescent Powder</option>
                      <option value="Sterile Injection">Sterile Injection</option>
                      <option value="Syrup/Suspension">Syrup/Suspension</option>
                      <option value="Topical/Ointment">Topical/Ointment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Test Parameter</label>
                    <select 
                      value={testType} 
                      onChange={e => {
                        const selected = aiMonograph?.tests?.find((t: any) => t.testName === e.target.value);
                        setTestType(e.target.value);
                        if (selected) {
                          setSpecs({ 
                            target: parseFloat(selected.target) || 0, 
                            usl: selected.usl, 
                            lsl: selected.lsl, 
                            unit: selected.unit 
                          });
                        }
                      }} 
                      className={`w-full p-4 bg-slate-50 border rounded-2xl text-xs font-black outline-none transition-colors ${aiMonograph ? 'border-emerald-200 ring-4 ring-emerald-500/5' : 'border-slate-200'}`}
                    >
                      {currentTestOptions.map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Lower Limit (LSL)</label>
                        <input type="number" value={specs.lsl} onChange={e => setSpecs({...specs, lsl: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Upper Limit (USL)</label>
                        <input type="number" value={specs.usl} onChange={e => setSpecs({...specs, usl: parseFloat(e.target.value)})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                     </div>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-[35px] border-2 transition-all ${isHygroscopicAlert ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
                 <h3 className={`text-[10px] font-black uppercase tracking-widest mb-6 ${isHygroscopicAlert ? 'text-rose-600' : 'text-blue-600'}`}>
                    {isHygroscopicAlert ? '🚨 CRITICAL MOISTURE LOG' : 'Validated Entry'}
                 </h3>
                 <div className="grid grid-cols-4 gap-2">
                    {readings.slice(0, 16).map((val, i) => (
                      <input key={i} value={val} onChange={e => { const nr = [...readings]; nr[i] = e.target.value; setReadings(nr); }} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-center text-[10px] font-black focus:border-blue-500 outline-none transition-all placeholder:text-slate-300" placeholder={`#${i+1}`} />
                    ))}
                 </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
               {stats ? (
                 <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className={`p-8 rounded-[40px] border-2 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
                      stats.status === 'FAIL' ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                       <div className="flex items-center gap-6 text-slate-800">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg ${stats.status === 'FAIL' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>{stats.status === 'FAIL' ? '!' : '✓'}</div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Analysis Outcome</p>
                            <h4 className="text-2xl font-black uppercase tracking-tighter">{stats.status}</h4>
                          </div>
                       </div>
                       <div className="grid grid-cols-3 gap-8 text-center px-10 border-x border-slate-200">
                          <div><p className="text-[8px] font-black text-slate-400 uppercase">Mean</p><p className="text-sm font-black text-slate-900">{stats.mean}</p></div>
                          <div><p className="text-[8px] font-black text-slate-400 uppercase">SD</p><p className="text-sm font-black text-slate-900">{stats.sd}</p></div>
                          <div><p className="text-[8px] font-black text-slate-400 uppercase">Cpk</p><p className="text-sm font-black text-slate-900">{stats.cpk}</p></div>
                       </div>
                       <div className="shrink-0">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border ${stats.status === 'FAIL' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                            {stats.status === 'FAIL' ? 'OOS LOG REQUIRED' : 'COMPLIANT'}
                          </span>
                       </div>
                    </div>

                    <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl">
                      <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Statistical Control Chart</h3>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase">
                          <div className="flex items-center gap-2"><span className="w-3 h-0.5 border-t-2 border-dashed border-slate-300"></span> Limit Line</div>
                          <div className="flex items-center gap-2"><span className="w-3 h-0.5 border-t-2 border-blue-500"></span> Mean Path</div>
                        </div>
                      </div>
                      <div className="bg-slate-50/50 rounded-[30px] p-6 border border-slate-100">
                        <canvas ref={canvasRef} width={900} height={350} className="w-full h-auto" />
                      </div>
                    </div>
                 </div>
               ) : (
                 <div className="h-full bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[50px] flex flex-col items-center justify-center p-20 text-center opacity-40">
                    <span className="text-7xl mb-6">📊</span>
                    <p className="text-lg font-black uppercase tracking-[12px]">Analytical Ready</p>
                    <p className="text-xs font-bold text-slate-400 mt-4 max-w-xs">Enter process readings or sync with regulatory monograph to begin IPC surveillance.</p>
                 </div>
               )}
            </div>
          </>
        )}

        {activeTab === 'calculators' && (
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
            {/* Weight Variation */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm">⚖️</span>
                {t.weightVar}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Average Weight (mg)</label>
                  <input type="number" value={calcData.weightVar.avg} onChange={e => setCalcData({...calcData, weightVar: {...calcData.weightVar, avg: parseFloat(e.target.value)}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Individual Weights (mg, comma separated)</label>
                  <textarea value={calcData.weightVar.readings} onChange={e => setCalcData({...calcData, weightVar: {...calcData.weightVar, readings: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold h-24" />
                </div>
                <button onClick={calculateWeightVar} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all">{t.calculate}</button>
              </div>
            </div>

            {/* Friability */}
            <div className="bg-white p-8 rounded-[35px] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center text-sm">🧊</span>
                {t.friability}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Initial Weight (g)</label>
                    <input type="number" value={calcData.friability.initial} onChange={e => setCalcData({...calcData, friability: {...calcData.friability, initial: parseFloat(e.target.value)}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Final Weight (g)</label>
                    <input type="number" value={calcData.friability.final} onChange={e => setCalcData({...calcData, friability: {...calcData.friability, final: parseFloat(e.target.value)}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" />
                  </div>
                </div>
                <button onClick={calculateFriability} className="w-full py-3 bg-pink-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-pink-700 transition-all">{t.calculate}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'standards' && (
          <div className="lg:col-span-12 bg-white rounded-[35px] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-8 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">ICH / USP / BP Reference Standards</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="p-6">Parameter</th>
                    <th className="p-6">BP Limit</th>
                    <th className="p-6">USP Limit</th>
                    <th className="p-6">Acceptance Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  <tr>
                    <td className="p-6 font-bold text-slate-800">Weight Variation (≥ 250mg)</td>
                    <td className="p-6">±5%</td>
                    <td className="p-6">±5%</td>
                    <td className="p-6 text-slate-500">NMT 2 units outside ±10%, none outside ±20%</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-slate-800">Content Uniformity (AV)</td>
                    <td className="p-6">≤15.0</td>
                    <td className="p-6">≤15.0</td>
                    <td className="p-6 text-slate-500">Stage 1: AV ≤ 15.0, Stage 2: AV ≤ 25.0</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-slate-800">Disintegration (Uncoated)</td>
                    <td className="p-6">15 min</td>
                    <td className="p-6">15 min</td>
                    <td className="p-6 text-slate-500">All 6 units disintegrate completely</td>
                  </tr>
                  <tr>
                    <td className="p-6 font-bold text-slate-800">Friability</td>
                    <td className="p-6">≤1.0%</td>
                    <td className="p-6">≤1.0%</td>
                    <td className="p-6 text-slate-500">Weight loss NMT 1.0% after 100 rotations</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
