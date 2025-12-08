import React, { useState } from 'react';
import { Activity, LayoutDashboard, AlertCircle, FileText, Stethoscope, Menu, ChevronRight } from 'lucide-react';
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
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState<string>("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MediSenseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDocumentUpload = (files: File[]) => {
    setDocumentFiles(prev => [...prev, ...files]);
  };

  const handleRemoveDocument = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!faceImage && !audioBlob && documentFiles.length === 0 && !textInput) {
      setError("Please provide at least one input.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeMedicalInputs(faceImage, audioBlob, documentFiles, textInput || null);
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
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 justify-between flex-shrink-0 z-30 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-lg shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 leading-none">
              MEDI-SENSE
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Multimodal Clinical Triage
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-600">System Online</span>
          </div>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-xs font-medium">Gemini 3 Pro</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: Inputs */}
        <aside className="w-[380px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-y-auto custom-scrollbar z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          <div className="p-5 space-y-6">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Case Context Inputs</h2>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Required</span>
            </div>
            
            <div className="space-y-4">
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
                onUpload={handleDocumentUpload} 
                onRemove={handleRemoveDocument}
                files={documentFiles}
              />
            </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50 backdrop-blur-sm">
             <div className="flex gap-3 items-start">
               <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
               <p className="text-[10px] text-slate-500 leading-relaxed">
                 Data is processed in real-time for triage evaluation only. No generated data is persisted on server.
               </p>
             </div>
          </div>
        </aside>

        {/* Right Pane: Analysis & Results */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden relative">
          {/* Action Bar */}
          <div className="px-8 py-6 flex-shrink-0 bg-white/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200/50">
             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
               <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Clinical Evaluation Board</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-500">Session ID:</span>
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                      {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </code>
                  </div>
               </div>
               
               <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg shadow-teal-900/10 transition-all border border-transparent
                  ${isAnalyzing 
                    ? 'bg-slate-100 text-slate-400 cursor-wait border-slate-200 shadow-none' 
                    : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm'
                  }
                `}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Final Report</span>
                    <Stethoscope className="w-4 h-4" />
                  </>
                )}
              </button>
             </div>
             
             {error && (
              <div className="mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 border border-red-200 animate-fade-in shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
             {!result && !isAnalyzing ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                 <div className="max-w-md w-full text-center space-y-6">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                     <Activity className="w-10 h-10 text-slate-200" />
                   </div>
                   <div>
                     <h3 className="text-lg font-semibold text-slate-700">Ready for Evaluation</h3>
                     <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                       Input patient data via the sidebar to begin multimodal triage analysis. The system supports visual, audio, and textual symptom processing.
                     </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-3 text-xs text-left opacity-70">
                     <div className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-white">
                       <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                       Visual Cues
                     </div>
                     <div className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-white">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                       Voice Patterns
                     </div>
                     <div className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-white">
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                       Text & History
                     </div>
                     <div className="flex items-center gap-2 p-2 rounded border border-slate-200 bg-white">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                       Batch Reports
                     </div>
                   </div>
                 </div>
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