import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, BOQItem, GeminiModel } from '../types';
import { createChatSession, handleChatMessage } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ChatBotProps {
  currentBOQ: BOQItem[];
  onUpdateBOQ: (newData: BOQItem[]) => void;
  selectedModel: GeminiModel;
}

const ChatBot: React.FC<ChatBotProps> = ({ currentBOQ, onUpdateBOQ, selectedModel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'أنا جاهز لتدقيق جدول الكميات. يمكنك أن تطلب مني إعادة حساب الإجماليات، أو تطبيق عوامل الهدر، أو التحقق من الخصومات.', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Re-initialize chat if model changes
  useEffect(() => {
    chatSession.current = createChatSession(selectedModel);
  }, [selectedModel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isExpanded]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatSession.current) return;

    const userMsg: ChatMessage = { role: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);
    setIsExpanded(true); // Auto expand on interaction

    try {
      const { responseText, updatedData } = await handleChatMessage(chatSession.current, userMsg.text, currentBOQ);
      
      const botMsg: ChatMessage = { 
        role: 'model', 
        text: responseText, 
        timestamp: new Date(),
        isAction: !!updatedData 
      };
      
      setMessages(prev => [...prev, botMsg]);

      if (updatedData) {
        onUpdateBOQ(updatedData);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "عذراً، حدث خطأ أثناء معالجة طلبك.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex flex-col items-center pointer-events-none" dir="rtl">
      
      {/* Messages Drawer (Expands Upwards) */}
      <div 
        className={`w-full max-w-4xl bg-white border-x border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] rounded-t-xl overflow-hidden transition-all duration-300 pointer-events-auto flex flex-col ${
          isExpanded ? 'h-96' : 'h-0 opacity-0'
        }`}
      >
        <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            سجل المحادثة (QS Copilot)
          </span>
          <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
           {messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : msg.isAction 
                    ? 'bg-green-50 border border-green-200 text-green-900 rounded-bl-none'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
              }`}>
                {msg.isAction && (
                  <div className="flex items-center gap-1.5 mb-2 text-green-700 font-bold text-[10px] uppercase tracking-wide border-b border-green-200 pb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    تم تحديث جدول الكميات
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start mb-3">
               <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                 <div className="flex space-x-1">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                 </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Command Bar */}
      <div className="w-full bg-white border-t border-slate-200 p-3 sm:p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pointer-events-auto">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
            title="Toggle History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اطلب من الذكاء الاصطناعي تعديل الكميات أو شرح بند معين..." 
              className="w-full bg-slate-100 border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-3 pr-11 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all shadow-inner"
            />
            <div className="absolute right-3 top-3 text-slate-400">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
               </svg>
            </div>
          </div>

          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;