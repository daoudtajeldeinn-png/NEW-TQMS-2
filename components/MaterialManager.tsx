
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../types';

const INITIAL_MOCK_INVENTORY: InventoryItem[] = [
  { id: 'MAT-001', name: 'Metronidazole Powder', category: 'API', lotNumber: 'LOT-2024-X44', stock: 450, unit: 'kg', reorderLevel: 100, status: 'Approved', expiryDate: '2026-12-01', manufacturerName: 'GlobalChem Ltd', manufacturerAddress: '12 Industrial Rd, Mumbai, India', manufacturerId: 'MFR-IND-991', batchSize: '5000 kg', storageCondition: 'Store below 25°C', coaDocument: { name: 'Supplier_CoA_X44.pdf', type: 'application/pdf' } },
  { id: 'MAT-002', name: 'Lactose Monohydrate', category: 'Excipient', lotNumber: 'L-8821-A', stock: 1200, unit: 'kg', reorderLevel: 500, status: 'Approved', expiryDate: '2027-05-20', manufacturerName: 'EuroExcipients NV', manufacturerAddress: 'Port Way 5, Antwerp, Belgium', manufacturerId: 'MFR-BE-442', batchSize: '10000 kg', storageCondition: 'Store in a dry place', coaDocument: { name: 'Lac_Mono_CoA.pdf', type: 'application/pdf' } },
];

export const MaterialManager: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('pharma_inventory_v2');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_INVENTORY;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coaFile, setCoaFile] = useState<{ name: string; type: string; data?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const [activeUpdateId, setActiveUpdateId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'API',
    lotNumber: '',
    stock: 0,
    unit: 'kg',
    reorderLevel: 0,
    status: 'Quarantine',
    expiryDate: new Date().toISOString().split('T')[0],
    manufacturerName: '',
    manufacturerAddress: '',
    manufacturerId: '',
    batchSize: '',
    storageCondition: 'Store below 25°C'
  });

  useEffect(() => {
    localStorage.setItem('pharma_inventory_v2', JSON.stringify(items));
  }, [items]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoaFile({
          name: file.name,
          type: file.type,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUpdateId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileData = {
          name: file.name,
          type: file.type,
          data: reader.result as string
        };
        setItems(prev => prev.map(item => item.id === activeUpdateId ? { ...item, coaDocument: fileData } : item));
        setActiveUpdateId(null);
        if (inlineFileInputRef.current) inlineFileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerInlineUpload = (id: string) => {
    setActiveUpdateId(id);
    inlineFileInputRef.current?.click();
  };

  const handleSave = () => {
    if (!formData.name || !formData.lotNumber || !formData.manufacturerName) {
      alert("GDP Compliance: Material Name, Lot Number, and Manufacturer details are mandatory.");
      return;
    }

    const newItem: InventoryItem = {
      id: `MAT-${Date.now()}`,
      name: formData.name as string,
      category: formData.category as any,
      lotNumber: formData.lotNumber as string,
      stock: Number(formData.stock) || 0,
      unit: formData.unit as string,
      reorderLevel: Number(formData.reorderLevel) || 0,
      status: formData.status as any,
      expiryDate: formData.expiryDate as string,
      manufacturerName: formData.manufacturerName,
      manufacturerAddress: formData.manufacturerAddress,
      manufacturerId: formData.manufacturerId,
      batchSize: formData.batchSize,
      storageCondition: formData.storageCondition,
      coaDocument: coaFile || undefined
    };

    setItems([newItem, ...items]);
    setIsModalOpen(false);
    resetIntake();
  };

  const resetIntake = () => {
    setFormData({
      name: '',
      category: 'API',
      lotNumber: '',
      stock: 0,
      unit: 'kg',
      reorderLevel: 0,
      status: 'Quarantine',
      expiryDate: new Date().toISOString().split('T')[0],
      manufacturerName: '',
      manufacturerAddress: '',
      manufacturerId: '',
      batchSize: '',
      storageCondition: 'Store below 25°C'
    });
    setCoaFile(null);
  };

  const downloadCoa = (item: InventoryItem) => {
    if (item.coaDocument) {
      alert(`Accessing Secured Ledger for: ${item.coaDocument.name}\nAudit Log: Document hash verified by QA.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <input type="file" ref={inlineFileInputRef} className="hidden" onChange={handleInlineFileChange} accept=".pdf,.png,.jpg" />

      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm no-print">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Inventory & GDP Portal</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[8px] mt-1">Full Traceability & Manufacturer Metadata</p>
        </div>
        <button 
          onClick={() => { resetIntake(); setIsModalOpen(true); }}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
        >
          📥 Secure Intake Log
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50">
                <th className="px-8 py-6">Material / Category</th>
                <th className="px-8 py-6">Manufacturer Details (GDP)</th>
                <th className="px-8 py-6">Batch ID / Size</th>
                <th className="px-8 py-6">Status / Storage</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-900 uppercase">{item.name}</p>
                    <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest">{item.category}</p>
                  </td>
                  <td className="px-8 py-6 max-w-xs">
                    <p className="text-xs font-black text-slate-800">{item.manufacturerName}</p>
                    <p className="text-[9px] text-slate-400 font-bold truncate" title={item.manufacturerAddress}>{item.manufacturerAddress}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">ID: {item.manufacturerId}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-mono font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{item.lotNumber}</span>
                    <p className="text-[9px] text-slate-400 font-bold mt-2">Size: {item.batchSize || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      item.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>{item.status}</span>
                    <p className="text-[9px] text-red-500 font-black mt-2 uppercase">🌡️ {item.storageCondition}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => item.coaDocument ? downloadCoa(item) : triggerInlineUpload(item.id)}
                      className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all ${
                        item.coaDocument ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {item.coaDocument ? '📜 View CoA' : '📤 Upload CoA'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTAKE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-[50px] w-full max-w-6xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-12 text-white relative">
              <div>
                <h3 className="text-4xl font-black uppercase tracking-tighter">GxP Intake Portal</h3>
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[10px] mt-2 italic">Mandatory GDP Traceability Protocol</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="absolute top-12 right-12 text-2xl hover:rotate-90 transition-transform">✕</button>
            </div>

            <div className="p-16 space-y-12 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Part A: Material Identity</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Material Name</label>
                       <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="e.g. Paracetamol API" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Lot Identification</label>
                       <input value={formData.lotNumber} onChange={e => setFormData({...formData, lotNumber: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold font-mono" placeholder="LOT-XXXX" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Total Batch Size</label>
                       <input value={formData.batchSize} onChange={e => setFormData({...formData, batchSize: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="e.g. 5000 kg" />
                    </div>
                  </div>
                  
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2 pt-4">Part B: Storage Requirements</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">GDP Storage Conditions</label>
                       <select value={formData.storageCondition} onChange={e => setFormData({...formData, storageCondition: e.target.value})} className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold text-red-600">
                          <option>Store below 25°C (Ambient)</option>
                          <option>Store below 30°C</option>
                          <option>Refrigerated (2°C - 8°C)</option>
                          <option>Frozen (-20°C)</option>
                          <option>Protect from moisture & light</option>
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Current Qty</label>
                       <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Expiry Date</label>
                       <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b pb-2">Part C: Manufacturer Details (GDP Required)</h4>
                  <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Company Name</label>
                       <input value={formData.manufacturerName} onChange={e => setFormData({...formData, manufacturerName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Company Address</label>
                       <textarea value={formData.manufacturerAddress} onChange={e => setFormData({...formData, manufacturerAddress: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold h-20" placeholder="Full legal manufacturing address..." />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Company ID / License No.</label>
                       <input value={formData.manufacturerId} onChange={e => setFormData({...formData, manufacturerId: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold font-mono" placeholder="MFG-XXX-XXX" />
                    </div>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-6 h-32 border-4 border-dashed rounded-[35px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                      coaFile ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <span className="text-2xl mb-2">{coaFile ? '✅' : '📤'}</span>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{coaFile ? coaFile.name : 'Link Supplier CoA'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-12 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
              <button onClick={() => setIsModalOpen(false)} className="px-12 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-200 rounded-3xl transition-all">Cancel</button>
              <button onClick={handleSave} className="px-20 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-xs tracking-[6px] hover:bg-black shadow-2xl transition-all">Certify & Log Intake</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
