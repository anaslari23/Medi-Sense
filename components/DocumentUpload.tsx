import React, { useRef } from 'react';
import { FileText, Upload, X, Check } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File) => void;
  onClear: () => void;
  file: File | null;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, onClear, file }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">Lab Reports</span>
        </div>
        {file && (
          <button onClick={onClear} className="text-slate-400 hover:text-red-500">
             <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 min-h-[120px] flex items-center justify-center">
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="image/*,application/pdf" 
          onChange={handleFileChange}
        />
        
        {!file ? (
          <button 
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Upload className="w-6 h-6 opacity-50" />
            <span className="text-xs font-medium">Upload PDF/Image</span>
          </button>
        ) : (
          <div className="w-full">
            <div className="flex flex-col items-center text-center gap-2">
               <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                 <Check className="w-5 h-5 text-blue-600" />
               </div>
               <div className="overflow-hidden w-full px-2">
                  <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};