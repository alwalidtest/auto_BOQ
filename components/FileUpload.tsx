import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`relative w-full rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 mb-6
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400"}
          ${selectedFiles.length > 0 ? "h-64" : "h-96"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          multiple={true} 
          onChange={handleChange}
          accept=".pdf"
        />
        
        <div className="bg-blue-100 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>

        <h3 className="text-xl font-semibold text-slate-800 mb-2">رفع المخططات الهندسية</h3>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          اسحب وأفلت ملفات PDF (المعماري A والإنشائي S) هنا.
          <br/>
          <span className="text-xs text-blue-600 font-medium">يدعم الرفع المتعدد للربط بين المخططات.</span>
        </p>

        <button 
          onClick={onButtonClick}
          className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          اختر ملفات PDF
        </button>
      </div>

      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 animate-fade-in-up">
          <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">الملفات المختارة ({selectedFiles.length})</h4>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800 truncate max-w-[200px] sm:max-w-xs">{file.name}</div>
                    <div className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all active:scale-[0.99]"
          >
            ابدأ التحليل
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;