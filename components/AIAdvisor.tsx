
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

export const AIAdvisor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    setLoading(true);
    setHistory(prev => [...prev, { role: 'user', text: query }]);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the "PharmaQualify Pro AI Advisor", a regulatory expert on GMP (Good Manufacturing Practice), ICH guidelines, and FDA/EMA/PIC/S regulations.
        Answer the following query concisely and accurately with regulatory context.
        
        User Query: ${query}`,
      });
      
      setHistory(prev => [...prev, { role: 'ai', text: response.text || 'Error generating response.' }]);
      setQuery('');
    } catch (e) {
      console.error(e);
      setHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error connecting to the regulatory database.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 rounded-2xl text-white mb-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">GMP Regulatory Advisor</h2>
          <p className="text-blue-100 max-w-xl">Ask any question about GMP compliance, validation, or current industry trends. Powered by Gemini 3 Flash.</p>
        </div>
        <div className="absolute right-0 top-0 text-9xl font-black text-white/5 select-none pointer-events-none">GMP</div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-2xl border border-slate-100">✨</div>
              <p className="text-sm font-medium">Hello Quality Team. How can I assist with compliance today?</p>
              <div className="flex gap-2">
                {["Draft a deviation rationale", "Explain ICH Q10", "GMP in Cell Therapy"].map((chip, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setQuery(chip)}
                    className="text-[10px] px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-full font-bold transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200 shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-4 rounded-2xl flex gap-2">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Ask a regulatory question..."
              className="flex-1 p-3 outline-none text-sm font-medium text-slate-700"
            />
            <button 
              onClick={handleAsk}
              disabled={loading || !query}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              Send
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">AI Advisor may provide generalized guidance. Always refer to your site SOPs and specific regulatory filings.</p>
        </div>
      </div>
    </div>
  );
};
