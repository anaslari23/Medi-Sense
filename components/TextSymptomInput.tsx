import React from 'react';
import { Keyboard, X, SendHorizontal } from 'lucide-react';

interface TextSymptomInputProps {
  text: string;
  setText: (text: string) => void;
  onClear: () => void;
}

export const TextSymptomInput: React.FC<TextSymptomInputProps> = ({ text, setText, onClear }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-violet-200 transition-colors">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-slate-700">Input Symptoms (Text)</span>
        </div>
        {text && (
          <button onClick={onClear} className="text-slate-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe your symptoms, timeline, or concerns here..."
            className="w-full h-32 px-3 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-300 resize-none placeholder:text-slate-400 custom-scrollbar"
          />
          {text && (
            <div className="absolute bottom-2 right-2">
              <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center">
                <SendHorizontal className="w-3 h-3 text-violet-600" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};