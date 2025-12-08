import React, { useState } from 'react';
import { Activity, LayoutDashboard, AlertCircle, FileText } from 'lucide-react';
import { CameraCapture } from './components/CameraCapture';
import { AudioRecorder } from './components/AudioRecorder';
import { DocumentUpload } from './components/DocumentUpload';
import { TextSymptomInput } from './components/TextSymptomInput';
import { AnalysisResult } from './components/AnalysisResult';
import { analyzeMedicalInputs } from './services/geminiService';
import { MediSenseResponse } from './types';

function App() {
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MediSenseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!faceImage && !audioBlob && !documentFile && !textInput) {
      setError("Please provide at least one input.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeMedicalInputs(faceImage, audioBlob, documentFile, textInput || null);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 justify-between flex-shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-teal-600 p-1 rounded-md">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">
            MEDI-SENSE <span className="font-normal text-slate-400 mx-2">|</span> <span className="text-sm font-medium text-slate-500">Multimodal AI Medical Evaluator</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
            Gemini 3 Pro
          </span>
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Inputs */}
        <aside className="w-[360px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">1</span>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Patient Inputs</h2>
            </div>
            
            <CameraCapture 
              onCapture={setFaceImage} 
              onClear={() => setFaceImage(null)} 
              hasImage={!!faceImage} 
            />
            
            <AudioRecorder 
              onRecordingComplete={setAudioBlob} 
              onClear={() => setAudioBlob(null)}
              hasAudio={!!audioBlob}
            />
            
            <TextSymptomInput 
              text={textInput}
              setText={setTextInput}
              onClear={() => setTextInput("")}
            />

            <DocumentUpload 
              onUpload={setDocumentFile} 
              onClear={() => setDocumentFile(null)}
              file={documentFile}
            />
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50">
             <p className="text-xs text-slate-400 text-center">
               All data is processed ephemerally for triage analysis.
             </p>
          </div>
        </aside>

        {/* Right Pane: Analysis & Results */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden relative">
          {/* Action Bar */}
          <div className="p-6 pb-2 flex-shrink-0">
             <div className="flex justify-between items-end mb-4">
               <div>
                  <h2 className="text-2xl font-bold text-slate-800">Clinical Evaluation Board</h2>
                  <p className="text-slate-500 text-sm mt-1">Real-time multimodal synthesis and reasoning</p>
               </div>
               
               <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all
                  ${isAnalyzing 
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                    : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-md active:transform active:scale-95'
                  }
                `}
              >
                {isAnalyzing ? 'Processing...' : 'Generate Final Report'}
                {!isAnalyzing && <Activity className="w-4 h-4" />}
              </button>
             </div>
             
             {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-red-200 animate-fade-in">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
             {!result && !isAnalyzing ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 m-1">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                   <FileText className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-sm font-medium">Awaiting Data for Analysis</p>
                 <p className="text-xs max-w-xs text-center mt-2 opacity-70">
                   Provide face, voice, text, or document inputs on the left sidebar and generate a report.
                 </p>
               </div>
             ) : (
               <AnalysisResult data={result} isLoading={isAnalyzing} />
             )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;