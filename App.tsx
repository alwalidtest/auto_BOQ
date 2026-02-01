
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import AnalysisProgress from './components/AnalysisProgress';
import ResultsView from './components/ResultsView';
import ChatBot from './components/ChatBot';
import ModelSelector from './components/ModelSelector';
import { AnalysisStatus, BOQItem, GeminiModel, LogEntry } from './types';
import { analyzeProjectDocs } from './services/geminiService';
import { MODULES } from './constants';

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [boqData, setBoqData] = useState<BOQItem[]>([]);
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-3-pro-preview');

  const handleFileUpload = async (files: File[]) => {
    setCurrentFiles(files);
    setStatus(AnalysisStatus.PROCESSING);
    setLogs([]);
    setBoqData([]);
    setCompletedModules([]);
    setActiveModuleId(null);

    try {
      await analyzeProjectDocs(
        files, 
        selectedModel,
        (log) => setLogs(prev => [...prev, log]),
        (moduleId, newItems) => {
          setCompletedModules(prev => [...prev, moduleId]);
          setActiveModuleId(moduleId);
          // Append new items to the existing data
          setBoqData(prev => [...prev, ...newItems]);
        }
      );
      
      setStatus(AnalysisStatus.COMPLETE);
      setActiveModuleId(null);

    } catch (error) {
      console.error(error);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AnalysisStatus.IDLE);
    setBoqData([]);
    setCurrentFiles([]);
    setLogs([]);
    setCompletedModules([]);
    setActiveModuleId(null);
  };

  return (
    <div className="flex h-screen bg-white font-arabic overflow-hidden text-slate-900" dir="rtl">
      
      {/* PROFESSIONAL SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-slate-950 flex-shrink-0 flex flex-col text-white border-l border-slate-900 relative z-20 shadow-2xl">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-900 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              QS
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-white leading-none mb-1">Auto-BOQ</h1>
              <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest">Architect Engine</span>
            </div>
          </div>
        </div>

        {/* Navigation / Progress Steps */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">مراحل التحليل (Analysis Phase)</div>
          
          {MODULES.map((module) => {
             const isComplete = completedModules.includes(module.id);
             // It's active if it's the current one being processed (completedModules.length + 1)
             const isActive = status === AnalysisStatus.PROCESSING && !isComplete && completedModules.length === module.id - 1;
             
             return (
               <div 
                 key={module.id}
                 className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-300 border border-transparent select-none
                   ${isActive ? 'bg-blue-900/20 border-blue-900/50' : 'hover:bg-slate-900'}
                 `}
               >
                 <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border shrink-0 transition-all
                   ${isComplete 
                      ? 'bg-green-500 border-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                      : isActive 
                        ? 'bg-transparent border-blue-400 text-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.2)]' 
                        : 'bg-transparent border-slate-700 text-slate-600'}
                 `}>
                   {isComplete ? (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                       <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                     </svg>
                   ) : module.id}
                 </div>
                 <div className="flex-1">
                   <div className={`text-sm font-medium transition-colors ${isComplete ? 'text-slate-200' : isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                     {module.arabicTitle}
                   </div>
                   {isActive && (
                     <div className="text-[9px] text-blue-400 mt-0.5 flex items-center gap-1">
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></span>
                        جاري المعالجة...
                     </div>
                   )}
                 </div>
               </div>
             )
          })}
        </div>

        {/* Footer Stats */}
        <div className="p-4 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
           <div className="flex justify-between mb-2">
             <span>البنود المكتشفة:</span>
             <span className="text-white font-mono">{boqData.length}</span>
           </div>
           <div className="flex justify-between">
             <span>حالة النظام:</span>
             <span className={`font-bold flex items-center gap-1.5 ${status === AnalysisStatus.PROCESSING ? 'text-yellow-500' : 'text-green-500'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${status === AnalysisStatus.PROCESSING ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
               {status === AnalysisStatus.PROCESSING ? 'يعمل' : status === AnalysisStatus.IDLE ? 'جاهز' : 'مكتمل'}
             </span>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 relative">
        
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0 z-10">
           <div className="flex items-center gap-4">
             {status !== AnalysisStatus.IDLE && (
               <button 
                 onClick={handleReset}
                 className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                 </svg>
                 مشروع جديد
               </button>
             )}
           </div>
           
           <div className="flex items-center gap-4">
             <ModelSelector 
               selectedModel={selectedModel}
               onSelect={setSelectedModel}
               disabled={status === AnalysisStatus.PROCESSING}
             />
           </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8">
          
          {/* VIEW: UPLOAD (Empty State) */}
          {status === AnalysisStatus.IDLE && (
            <div className="max-w-4xl mx-auto h-full flex flex-col justify-center animate-fade-in-up -mt-10">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">منصة التحليل الهندسي</h2>
                <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
                  نظام ذكي لتحويل المخططات المعمارية والإنشائية إلى جداول كميات دقيقة.
                  <br />
                  يعتمد على <span className="text-blue-600 font-semibold">بروتوكول التحليل التسلسلي (Sequential Analysis)</span>.
                </p>
              </div>
              <FileUpload onUpload={handleFileUpload} />
            </div>
          )}

          {/* VIEW: PROCESSING & RESULTS */}
          {(status === AnalysisStatus.PROCESSING || status === AnalysisStatus.COMPLETE) && (
            <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in">
              
              {/* Progress Logs Panel */}
              {status === AnalysisStatus.PROCESSING && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      سجل العمليات الحية (System Live Log)
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400">gemini-engine-v3.0</span>
                  </div>
                  <div className="bg-slate-950 p-4 font-mono text-xs text-slate-300 h-48 overflow-y-auto custom-scrollbar shadow-inner" dir="ltr">
                    {logs.map((log, i) => (
                      <div key={i} className={`mb-1.5 flex gap-3 ${log.type === 'thought' ? 'text-slate-500 italic' : log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : 'text-blue-200'}`}>
                        <span className="opacity-40 min-w-[60px] text-right">[{log.timestamp.toLocaleTimeString([],{hour12:false, minute:'2-digit', second:'2-digit'})}]</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                    ))}
                    <div id="log-bottom"></div>
                  </div>
                </div>
              )}

              {/* Final Results Table */}
              {boqData.length > 0 && (
                <ResultsView data={boqData} onUpdate={setBoqData} />
              )}
            </div>
          )}

        </div>

        {/* ChatBot Overlay */}
        <ChatBot 
          currentBOQ={boqData} 
          onUpdateBOQ={setBoqData} 
          selectedModel={selectedModel}
        />
      </main>
    </div>
  );
};

export default App;
