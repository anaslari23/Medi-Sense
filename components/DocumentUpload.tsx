import React, { useRef } from 'react';
import { FileText, Upload, X, Check, Files } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  files: File[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, onRemove, files }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Append new files to existing ones
      const newFiles = Array.from(e.target.files);
      onUpload(newFiles);
    }
    // Reset input so same files can be selected again if needed
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Files className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">Medical Reports</span>
        </div>
        {files.length > 0 && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-4 min-h-[120px] flex flex-col">
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          accept="image/*,application/pdf" 
          multiple
          onChange={handleFileChange}
        />
        
        <div className="flex-1 flex flex-col gap-2">
           {files.length === 0 ? (
             <div className="flex-1 flex items-center justify-center">
               <button 
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors py-4"
               >
                 <Upload className="w-6 h-6 opacity-50" />
                 <span className="text-xs font-medium text-center">Upload Reports<br/>(PDFs, Images)</span>
               </button>
             </div>
           ) : (
             <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
               {files.map((file, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-lg group/item">
                    <div className="flex items-center gap-2 overflow-hidden">
                       <div className="w-8 h-8 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
                         <FileText className="w-4 h-4 text-blue-600" />
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-xs font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => onRemove(idx)}
                      className="text-slate-300 hover:text-red-500 p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                 </div>
               ))}
               
               <button 
                 onClick={() => inputRef.current?.click()}
                 className="w-full py-2 text-xs text-blue-600 hover:bg-blue-50 border border-dashed border-blue-200 rounded-lg flex items-center justify-center gap-1 mt-2"
               >
                 <Upload className="w-3 h-3" /> Add more files
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};