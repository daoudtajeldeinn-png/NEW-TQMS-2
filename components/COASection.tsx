
import React, { useState } from 'react';
import { Material } from '../types';

const METRO_SPEC: Material = {
  id: 'metro',
  name: 'Metronidazole (BP 2025 / Ph.Eur. 0675)',
  specs: [
    { t: "Characters", s: "White or yellowish, crystalline powder", r: "White crystalline powder" },
    { t: "Identification (IR)", s: "Conforms to reference spectrum", r: "Conforms" },
    { t: "Melting point", s: "159°C to 163°C", r: "161.2°C" },
    { t: "Specific Absorbance (277 nm)", s: "365 to 395", r: "382" },
    { t: "Assay (Non-aqueous titration)", s: "99.0% to 101.0%", r: "100.2%" }
  ],
  micro: true,
  microSpecs: [
    { t: "TAMC", s: "NMT 10³ CFU/g", r: "50 CFU/g" },
    { t: "TYMC", s: "NMT 10² CFU/g", r: "< 10 CFU/g" }
  ]
};

const ASPIRIN_SPEC: Material = {
  id: 'aspirin',
  name: 'Aspirin (BP 2025 / Ph.Eur. 0309)',
  specs: [
    { t: "Characters", s: "White or almost white, crystalline powder", r: "White powder" },
    { t: "Melting point", s: "About 143°C", r: "143.5°C" },
    { t: "Loss on drying", s: "NMT 0.5%", r: "0.2%" },
    { t: "Assay (Titration)", s: "99.5% to 101.0%", r: "100.1%" }
  ]
};

const PARA_SPEC: Material = {
  id: 'para',
  name: 'Paracetamol (BP 2025 / Ph.Eur. 0049)',
  specs: [
    { t: "Melting point", s: "168°C to 172°C", r: "170.5°C" },
    { t: "Assay", s: "99.0% to 101.0%", r: "99.8%" },
    { t: "Total impurities", s: "NMT 0.2%", r: "0.08%" }
  ]
};

export const COASection: React.FC<{ type: 'metro' | 'aspirin' | 'para' }> = ({ type }) => {
  const data = type === 'metro' ? METRO_SPEC : type === 'aspirin' ? ASPIRIN_SPEC : PARA_SPEC;
  const [results, setResults] = useState(data.specs.map(s => ({ ...s, status: 'pass' })));

  const updateStatus = (index: number, val: string) => {
    const newRes = [...results];
    newRes[index].status = val;
    setResults(newRes);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl print:shadow-none print:border-none">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">CERTIFICATE OF ANALYSIS</h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">PharmaQualify Quality Control Laboratory</p>
          </div>
          <div className="text-right text-[10px] font-black text-slate-400">
            DOC NO: COA-{data.id.toUpperCase()}-2025-001<br/>
            VERSION: 1.0 | GMP VALIDATED
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10 text-xs">
          <div className="space-y-1">
            <p><span className="text-slate-400 font-bold uppercase tracking-tighter">Material:</span> <span className="font-bold text-slate-800">{data.name}</span></p>
            <p><span className="text-slate-400 font-bold uppercase tracking-tighter">Batch No:</span> <span className="font-bold text-slate-800">BN-2025-001</span></p>
          </div>
          <div className="space-y-1">
            <p><span className="text-slate-400 font-bold uppercase tracking-tighter">Mfg Date:</span> <span className="font-bold text-slate-800">2025-01-15</span></p>
            <p><span className="text-slate-400 font-bold uppercase tracking-tighter">Exp Date:</span> <span className="font-bold text-slate-800">2027-01-14</span></p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-6 py-2 rounded-lg font-black text-sm ${
              results.every(r => r.status === 'pass') ? 'bg-green-100 text-green-700 ring-2 ring-green-600' : 'bg-red-100 text-red-700 ring-2 ring-red-600'
            }`}>
              {results.every(r => r.status === 'pass') ? '✓ PASSED' : '✗ FAILED'}
            </div>
          </div>
        </div>

        <table className="w-full border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th className="p-4 border border-slate-200 text-left">Test Description</th>
              <th className="p-4 border border-slate-200 text-left">Specification</th>
              <th className="p-4 border border-slate-200 text-left">Actual Result</th>
              <th className="p-4 border border-slate-200 text-center w-32">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {results.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30">
                <td className="p-4 border border-slate-200 font-bold text-slate-800">{item.t}</td>
                <td className="p-4 border border-slate-200 text-xs font-mono text-blue-700">{item.s}</td>
                <td className="p-4 border border-slate-200">
                  <input 
                    defaultValue={item.r} 
                    className="w-full bg-transparent outline-none focus:bg-white p-1 rounded font-medium"
                  />
                </td>
                <td className="p-4 border border-slate-200 text-center">
                  <select 
                    value={item.status} 
                    onChange={(e) => updateStatus(idx, e.target.value)}
                    className={`text-[10px] font-black uppercase p-1 rounded border-2 ${
                      item.status === 'pass' ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-500 text-red-700 bg-red-50'
                    }`}
                  >
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.micro && (
          <div className="mt-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Microbiological Parameters</h3>
            <table className="w-full border-collapse border border-slate-200">
              <tbody className="text-sm">
                {data.microSpecs?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-4 border border-slate-200 font-bold text-slate-800 w-1/3">{item.t}</td>
                    <td className="p-4 border border-slate-200 text-xs font-mono text-blue-700 w-1/3">{item.s}</td>
                    <td className="p-4 border border-slate-200 font-medium">{item.r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-16 grid grid-cols-3 gap-12 text-[10px] font-black text-slate-400 text-center uppercase tracking-widest">
          <div>
            <div className="h-10 border-b border-slate-200 mb-2"></div>
            Analyst Signature
          </div>
          <div>
            <div className="h-10 border-b border-slate-200 mb-2"></div>
            Reviewed By (QC)
          </div>
          <div>
            <div className="h-10 border-b border-slate-200 mb-2"></div>
            Approved By (QA)
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-4 no-print">
        <button className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700">💾 Save Progress</button>
        <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg">🖨️ Print COA</button>
      </div>
    </div>
  );
};
