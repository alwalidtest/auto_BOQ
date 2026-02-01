
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface AnalysisProgressProps {
  logs: LogEntry[];
  isAnalyzing: boolean;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ logs, isAnalyzing }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Robust scrolling logic
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [logs]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-2 sm:px-0">
      
      {/* Terminal / Log View */}
      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 font-mono text-sm relative flex flex-col h-[500px]" dir="ltr">
        {/* Terminal Header */}
        <div className="bg-slate-800 px-4 py-2 flex items-center space-x-2 border-b border-slate-700 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div className="flex-1 text-center text-xs text-slate-400">gemini-engine-v3.0.log</div>
        </div>

        {/* Scrollable Logs */}
        <div 
          className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-3 bg-slate-900/95 backdrop-blur text-left"
        >
          {logs.length === 0 && (
            <div className="text-slate-600 italic text-center mt-32">جاري تهيئة المسارات العصبية...</div>
          )}

          {logs.map((log, idx) => (
            <div 
              key={idx} 
              className={`flex items-start space-x-3 animate-fade-in ${
                log.type === 'thought' ? 'opacity-80' : 'opacity-100'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {log.type === 'thought' && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-purple-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 2.625l-.857-3.973c-.066-.309-.344-.523-.66-.523h-4.466c-.316 0-.594.214-.66.523l-.857 3.973m11.25-6.75a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                )}
                {log.type === 'process' && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                )}
                {log.type === 'success' && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                 {log.type === 'error' && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className={`text-xs ${
                  log.type === 'thought' ? 'text-purple-300' :
                  log.type === 'success' ? 'text-green-300' :
                  log.type === 'error' ? 'text-red-300' :
                  'text-blue-200'
                }`}>
                  {log.message}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}
                </div>
              </div>
            </div>
          ))}
          
          {isAnalyzing && (
            <div className="flex items-center space-x-2 mt-4 pl-7">
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></span>
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></span>
            </div>
          )}
          {/* Invisible element to scroll to */}
          <div ref={bottomRef} className="h-1"></div>
        </div>
      </div>
      
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AnalysisProgress;
