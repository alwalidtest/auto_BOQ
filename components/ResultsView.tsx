
import React, { useState, useMemo } from 'react';
import { BOQItem } from '../types';

interface ResultsViewProps {
  data: BOQItem[];
  onUpdate: (data: BOQItem[]) => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'detailed' | 'summary'>('detailed');
  const [selectedAuditItem, setSelectedAuditItem] = useState<BOQItem | null>(null);

  // Group data by Category for Hierarchical View
  const groupedData = useMemo(() => {
    return data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, BOQItem[]>);
  }, [data]);

  const handlePriceChange = (id: number, priceStr: string) => {
    const price = parseFloat(priceStr);
    const newData = data.map(item => {
      if (item.id === id) {
        const quantity = item.total;
        let newBreakdown = item.calculation_breakdown || '';
        
        const splitMarker = ' || Price:';
        if (newBreakdown.includes(splitMarker)) {
            newBreakdown = newBreakdown.split(splitMarker)[0];
        }

        if (!isNaN(price) && price >= 0) {
           const totalCost = quantity * price;
           newBreakdown += `${splitMarker} ${quantity.toFixed(2)} * ${price} = ${totalCost.toLocaleString()}`;
        }

        return { 
          ...item, 
          unitPrice: isNaN(price) ? 0 : price,
          calculation_breakdown: newBreakdown
        };
      }
      return item;
    });
    onUpdate(newData);
  };

  const exportToCSV = () => {
    const BOM = "\uFEFF";
    const headers = ["رقم البند", "الفئة", "الوصف", "الوحدة", "العدد", "الطول", "العرض", "الارتفاع", "الخصم", "الإجمالي", "السعر", "التكلفة", "المعادلة", "المصدر"];
    
    const rows = data.map(item => [
      item.id,
      item.category,
      `"${item.description.replace(/"/g, '""')}"`,
      item.unit,
      item.count,
      item.dimensions.l,
      item.dimensions.w,
      item.dimensions.h,
      item.deduction,
      item.total,
      item.unitPrice || 0,
      (item.unitPrice || 0) * item.total,
      `"${(item.calculation_breakdown || '').replace(/"/g, '""')}"`,
      `"${(item.source_file || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = BOM + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "auto_boq_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    window.print();
  };

  const getConfidenceBadge = (confidence: BOQItem['confidence']) => {
    const score = confidence.overall;
    let colorClass = "";

    if (score >= 0.9) {
      colorClass = "bg-green-100 text-green-700";
    } else if (score >= 0.7) {
      colorClass = "bg-yellow-100 text-yellow-700";
    } else {
      colorClass = "bg-red-100 text-red-700";
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium ${colorClass}`}>
        {(score * 100).toFixed(0)}%
      </span>
    );
  };

  // Hierarchical Table Component
  const HierarchicalTable = () => (
    <div className="w-full space-y-6">
      {Object.entries(groupedData).map(([category, items]: [string, BOQItem[]], idx) => (
        <div key={idx} className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden print:border-black print:shadow-none print:break-inside-avoid">
          {/* Engineering Category Header */}
          <div className="bg-slate-100 border-b border-slate-300 px-4 py-3 flex justify-between items-center print:bg-slate-200">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <span className="w-1 h-4 bg-slate-800 rounded-sm"></span>
              {category}
            </h3>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-600 print:hidden">
              REF-CAT-0{idx+1}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar" dir="rtl">
            <table className="w-full text-sm text-right whitespace-nowrap border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-300 font-semibold text-xs uppercase tracking-tight">
                <tr>
                  <th className="p-3 border-l border-slate-200 w-10 text-center">#</th>
                  <th className="p-3 border-l border-slate-200 min-w-[350px]">وصف البند (Description)</th>
                  <th className="p-3 border-l border-slate-200 w-16 text-center">الوحدة</th>
                  <th className="p-3 border-l border-slate-200 w-16 text-center">العدد</th>
                  <th className="p-3 border-l border-slate-200 text-center bg-slate-50/50">أبعاد (L/W/H)</th>
                  <th className="p-3 border-l border-slate-200 text-center text-red-600">خصم</th>
                  <th className="p-3 border-l border-slate-200 text-center w-24">السعر</th>
                  <th className="p-3 border-l border-slate-200 w-32 font-bold text-slate-900">الإجمالي</th>
                  <th className="p-3 w-16 text-center print:hidden">تدقيق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, i) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-3 border-l border-slate-200 text-center font-mono text-slate-500 text-xs">{item.id}</td>
                    <td className="p-3 border-l border-slate-200">
                      <div className="font-medium text-slate-900 mb-0.5 whitespace-normal leading-snug">{item.description}</div>
                      {item.source_file && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded print:hidden">{item.source_file}</span>
                          {item.remarks && <span className="text-[10px] text-yellow-700 bg-yellow-50 px-1 rounded">{item.remarks}</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-3 border-l border-slate-200 text-center font-medium text-slate-700">{item.unit}</td>
                    <td className="p-3 border-l border-slate-200 text-center font-mono">{item.count}</td>
                    <td className="p-3 border-l border-slate-200 text-center font-mono text-xs text-slate-600 bg-slate-50/30">
                       <div className="grid grid-cols-3 gap-1 text-[10px]">
                         <span>{item.dimensions.l > 0 ? item.dimensions.l : '-'}</span>
                         <span>{item.dimensions.w > 0 ? item.dimensions.w : '-'}</span>
                         <span>{item.dimensions.h > 0 ? item.dimensions.h : '-'}</span>
                       </div>
                    </td>
                    <td className="p-3 border-l border-slate-200 text-center font-mono text-xs text-red-500">{item.deduction > 0 ? `-${item.deduction}` : '-'}</td>
                    
                    {/* Input for Price */}
                    <td className="p-3 border-l border-slate-200 text-center print:hidden">
                       <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="-"
                        value={item.unitPrice || ''}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="w-full px-1 py-1 text-sm bg-transparent border-b border-slate-200 hover:border-blue-400 focus:border-blue-600 outline-none font-mono text-center transition-colors"
                      />
                    </td>

                    <td className="p-3 border-l border-slate-200 text-right">
                       <div className="font-bold text-slate-900 font-mono text-sm">
                         {(item.unitPrice ? (item.total * item.unitPrice) : item.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                         <span className="text-[10px] font-normal text-slate-400 mr-1">{item.unitPrice ? 'SAR' : ''}</span>
                       </div>
                    </td>

                    <td className="p-3 text-center print:hidden">
                      <button 
                        onClick={() => setSelectedAuditItem(item)} 
                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-all"
                        title="Audit Calculation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Category Footer Summary */}
              <tfoot className="bg-slate-50 border-t border-slate-300 print:bg-slate-100">
                 <tr>
                   <td colSpan={7} className="p-3 text-left font-bold text-slate-700 pl-8 text-xs uppercase tracking-wide">
                     SUBTOTAL ({category})
                   </td>
                   <td className="p-3 font-bold text-slate-900 font-mono text-sm border-l border-slate-200">
                     {items.reduce((sum, item) => sum + (item.unitPrice ? (item.total * item.unitPrice) : 0), 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-500">SAR</span>
                   </td>
                   <td className="print:hidden"></td>
                 </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}
    </div>
  );

  const SummaryTable = () => {
    // Recalculate summary dynamically
    const summary = data.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { category: item.category, total: 0, cost: 0, unit: item.unit };
      }
      acc[item.category].total += item.total;
      acc[item.category].cost += (item.total * (item.unitPrice || 0));
      return acc;
    }, {} as Record<string, { category: string, total: number, cost: number, unit: string }>);

    return (
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white max-w-4xl mx-auto shadow-sm" dir="rtl">
        <table className="w-full text-right">
          <thead className="bg-slate-100 font-arabic text-slate-800 border-b border-slate-300 print:bg-slate-200">
            <tr>
              <th className="p-4 border-b">بيان الأعمال (Category)</th>
              <th className="p-4 border-b">إجمالي التكلفة المقدرة (Estimated Cost)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.values(summary).map((row: { category: string, total: number, cost: number, unit: string }, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{row.category}</td>
                <td className="p-4 font-bold text-lg font-mono text-slate-900">
                   {row.cost > 0 ? row.cost.toLocaleString() : '-'} <span className="text-xs font-normal text-slate-500">SAR</span>
                </td>
              </tr>
            ))}
            <tr className="bg-slate-900 text-white font-bold">
               <td className="p-4">الإجمالي العام للمشروع (GRAND TOTAL)</td>
               <td className="p-4 text-xl font-mono text-green-400">
                 {Object.values(summary).reduce((a: number, b: { category: string, total: number, cost: number, unit: string }) => a + b.cost, 0).toLocaleString()} SAR
               </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6 relative">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 font-arabic justify-start print:hidden" dir="rtl">
        <button
          onClick={() => setActiveTab('detailed')}
          className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-medium transition-colors rounded-t-lg ${
            activeTab === 'detailed' 
              ? 'bg-white border border-b-0 border-slate-200 text-blue-600 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          دفتر الحصر (Detailed BOQ)
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-medium transition-colors rounded-t-lg ${
            activeTab === 'summary' 
              ? 'bg-white border border-b-0 border-slate-200 text-blue-600 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          الخلاصة (Cost Summary)
        </button>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        
        {/* Print Header (Visible only in Print) */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
           <h1 className="text-3xl font-bold mb-2 uppercase tracking-widest">Bill of Quantities</h1>
           <p className="text-sm font-mono text-slate-600">Generated by Auto-BOQ Architect Engine</p>
           <p className="text-sm font-mono text-slate-600">Date: {new Date().toLocaleDateString()}</p>
        </div>

        {activeTab === 'detailed' && <HierarchicalTable />}
        {activeTab === 'summary' && <SummaryTable />}
      </div>

      {/* Floating Actions */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-3 print:hidden z-30">
        <button 
          onClick={printPDF}
          className="bg-slate-800 text-white w-12 h-12 rounded-full shadow-lg hover:bg-slate-700 hover:scale-110 transition-all flex items-center justify-center tooltip-trigger border border-slate-700"
          title="Print / PDF"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
             <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.198-.54-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
           </svg>
        </button>
        <button 
          onClick={exportToCSV}
          className="bg-green-600 text-white w-12 h-12 rounded-full shadow-lg hover:bg-green-500 hover:scale-110 transition-all flex items-center justify-center border border-green-500"
          title="Export CSV"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
           </svg>
        </button>
      </div>

      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${selectedAuditItem ? 'translate-x-0' : 'translate-x-full'} print:hidden`}
        dir="rtl"
        style={{ overscrollBehavior: 'contain' }}
      >
        {selectedAuditItem && (
          <>
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/80 shrink-0">
               <div>
                  <h3 className="font-bold text-xl text-slate-800">مدقق الحسابات (Inspector)</h3>
                  <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">ITEM #{selectedAuditItem.id}</span>
                      {selectedAuditItem.source_file && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 truncate max-w-[200px]">{selectedAuditItem.source_file}</span>
                      )}
                  </div>
               </div>
               <button onClick={() => setSelectedAuditItem(null)} className="text-slate-400 hover:text-slate-600 p-1">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              {/* Description Panel */}
              <div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">وصف البند</span>
                 <div className="text-sm font-medium text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed shadow-sm">
                    {selectedAuditItem.description}
                 </div>
              </div>

              {/* Dimensions Grid */}
              <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">الأبعاد المكتشفة</span>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Length</div>
                        <div className="text-xl font-mono font-bold text-slate-800">{selectedAuditItem.dimensions.l || '-'}</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Width</div>
                        <div className="text-xl font-mono font-bold text-slate-800">{selectedAuditItem.dimensions.w || '-'}</div>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Height</div>
                        <div className="text-xl font-mono font-bold text-slate-800">{selectedAuditItem.dimensions.h || '-'}</div>
                    </div>
                  </div>
              </div>

              {/* Traceability Console */}
              <div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">مسار المعادلة (Traceability Path)</span>
                 <div className="bg-slate-900 text-green-400 p-5 rounded-xl font-mono text-sm leading-relaxed shadow-inner text-left overflow-hidden relative group" dir="ltr">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[9px] text-slate-500 uppercase border border-slate-700 px-1 rounded">LOG</span>
                    </div>
                    <p className="opacity-50 mb-3 text-xs">// AI Logic Breakdown</p>
                    {selectedAuditItem.calculation_breakdown 
                      ? selectedAuditItem.calculation_breakdown.split(';').map((step, i) => (
                          <div key={i} className="mb-2 pl-3 border-l-2 border-slate-700 hover:border-green-500 transition-colors">{step.trim()}</div>
                        ))
                      : "No explicit formula path recorded."
                    }
                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-white font-bold">
                       <span>Total</span>
                       <span className="text-xl text-green-300">{selectedAuditItem.total.toLocaleString()} {selectedAuditItem.unit}</span>
                    </div>
                 </div>
              </div>

               {selectedAuditItem.deduction > 0 && (
                 <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center">
                    <div>
                      <h5 className="text-xs font-bold text-red-700 uppercase">تم تطبيق خصم (Deduction)</h5>
                      <p className="text-[10px] text-red-500 mt-0.5">voids, openings, or overlaps</p>
                    </div>
                    <span className="text-lg font-mono font-bold text-red-600">-{selectedAuditItem.deduction}</span>
                 </div>
               )}

              {/* Confidence Meter */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold text-slate-700 uppercase">نسبة الثقة (AI Confidence)</span>
                     {getConfidenceBadge(selectedAuditItem.confidence)}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                     <div 
                        className={`h-2 rounded-full ${selectedAuditItem.confidence.overall >= 0.9 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                        style={{ width: `${selectedAuditItem.confidence.overall * 100}%` }}
                     ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 uppercase font-mono">
                      <span>Low</span>
                      <span>High</span>
                  </div>
              </div>

            </div>
          </>
        )}
      </div>
      
      {selectedAuditItem && (
        <div 
          className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-[1px] print:hidden"
          onClick={() => setSelectedAuditItem(null)}
        ></div>
      )}

    </div>
  );
};

export default ResultsView;
