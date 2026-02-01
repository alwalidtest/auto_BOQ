
import React, { useState } from 'react';
import { GeminiModel } from '../types';

interface ModelSelectorProps {
  selectedModel: GeminiModel;
  onSelect: (model: GeminiModel) => void;
  disabled: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelect, disabled }) => {
  const [showInfo, setShowInfo] = useState(false);

  const models: { id: GeminiModel; name: string; description: string; badge: string; color: string }[] = [
    { 
      id: 'gemini-3-pro-preview', 
      name: 'Gemini 3.0 Pro', 
      description: 'أفضل نموذج للاستدلال المعقد والمهام الهندسية الدقيقة. يدعم التفكير العميق.',
      badge: 'الأكثر ذكاءً',
      color: 'bg-purple-100 text-purple-700'
    },
    { 
      id: 'gemini-3-flash-preview', 
      name: 'Gemini 3.0 Flash', 
      description: 'سرعة عالية مع قدرات استدلال متقدمة. ممتاز للمشاريع الكبيرة.',
      badge: 'متوازن جداً',
      color: 'bg-indigo-100 text-indigo-700'
    },
    { 
      id: 'gemini-2.5-flash-thinking-latest', 
      name: 'Gemini 2.5 Flash Thinking', 
      description: 'متخصص في التفكير المنطقي وحل المشكلات المتسلسلة.',
      badge: 'تفكير منطقي',
      color: 'bg-blue-100 text-blue-700'
    },
    { 
      id: 'gemini-flash-latest', 
      name: 'Gemini 2.5 Flash', 
      description: 'النموذج القياسي السريع. اقتصادي وفعال للمهام الروتينية.',
      badge: 'قياسي',
      color: 'bg-green-100 text-green-700'
    },
    { 
      id: 'gemini-flash-lite-latest', 
      name: 'Gemini 2.5 Flash Lite', 
      description: 'الأسرع والأقل تكلفة. مناسب للمسح الأولي السريع.',
      badge: 'اقتصادي',
      color: 'bg-slate-100 text-slate-700'
    },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative">
          <select 
            value={selectedModel}
            onChange={(e) => onSelect(e.target.value as GeminiModel)}
            disabled={disabled}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-8 pr-2 cursor-pointer disabled:opacity-50 min-w-[200px] font-arabic shadow-sm hover:border-blue-300 transition-colors"
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-full hover:bg-slate-100"
          title="تفاصيل النماذج"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </button>
      </div>

      {showInfo && (
        <div className="absolute top-12 left-0 w-80 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-50 animate-fade-in text-right">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-slate-800 text-sm">مستويات الذكاء للنموذج</h4>
            <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {models.map(m => (
              <div key={m.id} className={`p-3 rounded-lg border transition-all ${selectedModel === m.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900">{m.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${m.color}`}>{m.badge}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
