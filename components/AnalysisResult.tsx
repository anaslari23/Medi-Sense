import React, { useRef, useState } from 'react';
import { MediSenseResponse } from '../types';
import { Activity, Brain, FileSearch, Mic, Eye, ArrowRight, Loader2, Pill, ClipboardCheck, Keyboard, AlertTriangle, Syringe, Thermometer, Layers, AlertCircle, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AnalysisResultProps {
  data: MediSenseResponse | null;
  isLoading: boolean;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, isLoading }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const pdfCanvasHeight = pdfWidth / ratio;
      
      let position = 0;
      let heightLeft = canvasHeight;
      
      const addImageToPdf = (yPosition: number) => {
        const sourceY = yPosition * (canvasWidth / pdfWidth);
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfCanvasHeight, undefined, 'FAST');
      };

      // Create a full-height image in memory first
      const fullHeightPdf = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [pdfWidth, pdfCanvasHeight]
      });
      fullHeightPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfCanvasHeight);

      // Then split it into A4 pages
      const totalPages = Math.ceil(pdfCanvasHeight / pdf.internal.pageSize.getHeight());
      
      for (let i = 1; i <= totalPages; i++) {
          if (i > 1) pdf.addPage();
          const sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = canvas.width;
          sourceCanvas.height = (canvas.height / totalPages);

          const pageCanvas = await html2canvas(reportRef.current, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#f8fafc',
              y: (i - 1) * (reportRef.current.offsetHeight / totalPages),
              height: reportRef.current.offsetHeight / totalPages
          });
          
          pdf.addImage(
              pageCanvas.toDataURL('image/png'), 'PNG',
              0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), undefined, 'FAST'
          );
      }
      
      const totalPdfPages = Math.ceil(pdfCanvasHeight / pdf.internal.pageSize.getHeight());
      pdf.deletePage(totalPdfPages + 1);

      pdf.save(`MEDI-SENSE-Report-${Date.now()}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
        {/* Severity Loading */}
        <div className="h-28 bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-6 shadow-sm">
           <div className="h-16 w-16 bg-slate-100 rounded-full"></div>
           <div className="space-y-3 flex-1">
             <div className="h-5 w-48 bg-slate-100 rounded"></div>
             <div className="h-4 w-full bg-slate-100 rounded"></div>
             <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
           </div>
        </div>

        {/* Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           {[...Array(4)].map((_, i) => (
             <div key={i} className="h-72 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
               <div className="h-6 w-1/2 bg-slate-100 rounded"></div>
               <div className="space-y-2">
                 <div className="h-3 w-full bg-slate-100 rounded"></div>
                 <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
                 <div className="h-3 w-4/6 bg-slate-100 rounded"></div>
               </div>
             </div>
           ))}
        </div>
        
        {/* Reasoning Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="col-span-2 h-48 bg-slate-900/5 rounded-xl border border-slate-200"></div>
           <div className="h-48 bg-white rounded-xl border border-slate-200 shadow-sm"></div>
        </div>

        <div className="text-center text-slate-500 text-sm flex items-center justify-center gap-2 mt-8">
           <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
           <span className="font-medium">Synthesizing clinical evidence with Gemini 3 Pro...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getSeverityStyles = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': 
        return {
          bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-100'
        };
      case 'moderate': 
        return {
          bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', ring: 'ring-amber-100'
        };
      case 'high': 
        return {
          bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', icon: 'bg-orange-100 text-orange-600', ring: 'ring-orange-100'
        };
      case 'critical': 
        return {
          bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200', icon: 'bg-red-100 text-red-600', ring: 'ring-red-100'
        };
      default: 
        return {
          bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: 'bg-slate-100 text-slate-500', ring: 'ring-slate-100'
        };
    }
  };

  const styles = getSeverityStyles(data.severity_score);

  const faceMetrics = [
    { label: "Fatigue", value: data.face_analysis.fatigue_indicators },
    { label: "Pallor", value: data.face_analysis.skin_pallor },
    { label: "Jaundice", value: data.face_analysis.jaundice_tint },
    { label: "Eye Redness", value: data.face_analysis.eye_redness },
    { label: "Swelling", value: data.face_analysis.facial_swelling },
    { label: "Asymmetry", value: data.face_analysis.facial_asymmetry },
    { label: "Rashes", value: data.face_analysis.rashes_or_inflammation },
  ];

  return (
    <div ref={reportRef} className="space-y-6 animate-fade-in-up pb-10 max-w-7xl mx-auto">
      
      {/* Top Banner: Severity & Summary */}
      <div className={`rounded-xl border p-6 flex flex-col md:flex-row gap-6 items-start shadow-sm ring-4 ring-offset-0 transition-colors ${styles.bg} ${styles.border} ${styles.ring} ${styles.text}`}>
         <div className="flex-shrink-0 pt-1">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${styles.icon} border-white/50 shadow-sm ${data.severity_score === 'Critical' ? 'animate-pulse' : ''}`}>
               <Activity className="w-8 h-8" />
            </div>
         </div>
         <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
               <div>
                 <h3 className="text-2xl font-bold tracking-tight uppercase">{data.severity_score} Severity</h3>
                 <span className="text-xs font-bold opacity-70 uppercase tracking-widest mt-1 block">Triage Classification</span>
               </div>
               <button
                 onClick={handleDownloadPDF}
                 disabled={isDownloading}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/60 hover:bg-white/90 border border-black/10 shadow-sm text-xs font-semibold text-slate-700 transition-all disabled:opacity-50 disabled:cursor-wait"
               >
                 {isDownloading ? (
                   <>
                     <Loader2 className="w-3 h-3 animate-spin" />
                     <span>Generating...</span>
                   </>
                 ) : (
                   <>
                     <FileDown className="w-3 h-3" />
                     <span>Download Report</span>
                   </>
                 )}
               </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="font-medium opacity-90 leading-relaxed whitespace-pre-wrap text-base border-t border-black/5 pt-3 mt-1">
                {data.doctor_ready_summary}
              </p>
            </div>
         </div>
      </div>

      {/* Main Grid: Face, Voice, Text, Docs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Face Analysis Stream */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
             <Eye className="w-4 h-4 text-teal-600" />
             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Visual Cues</h4>
          </div>
          <div className="p-5 space-y-4 flex-1">
             <div className="space-y-3 font-mono text-xs">
               {faceMetrics.map((metric) => (
                 <div key={metric.label} className="grid grid-cols-[80px_1fr] gap-2 items-start group">
                    <span className="text-slate-400 font-semibold group-hover:text-teal-600 transition-colors">{metric.label}</span>
                    <span className={`text-slate-700 break-words ${!metric.value ? 'italic opacity-50' : ''}`}>
                       {metric.value || "None detected"}
                    </span>
                 </div>
               ))}
             </div>
             <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Clinical Impression</span>
                <p className="text-sm text-slate-700 italic leading-snug bg-slate-50 p-3 rounded-lg border border-slate-100">
                  "{data.face_analysis.overall_visual_impression}"
                </p>
             </div>
          </div>
        </div>

        {/* Voice Symptoms */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
             <Mic className="w-4 h-4 text-indigo-600" />
             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Voice Analysis</h4>
          </div>
          <div className="p-5 flex-1 space-y-5">
             <div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Extracted Symptoms</span>
               <div className="flex flex-wrap gap-2">
                  {data.voice_symptom_extraction.key_symptoms?.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100 font-medium">
                      {s}
                    </span>
                  ))}
               </div>
             </div>
             
             <div className="space-y-3">
               <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                 <span className="text-slate-500 text-xs font-semibold">Timeline</span>
                 <span className="font-mono text-xs text-indigo-900 font-medium">{data.voice_symptom_extraction.timeline || "N/A"}</span>
               </div>
               <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                 <span className="text-slate-500 text-xs font-semibold">Tone</span>
                 <span className="font-mono text-xs text-indigo-900 font-medium">{data.voice_symptom_extraction.emotional_tone || "N/A"}</span>
               </div>
               <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                 <span className="text-slate-500 text-xs font-semibold">Severity</span>
                 <span className="font-mono text-xs text-indigo-900 font-medium">{data.voice_symptom_extraction.reported_severity || "N/A"}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Text Symptoms */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
             <Keyboard className="w-4 h-4 text-violet-600" />
             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Reported Symptoms</h4>
          </div>
          <div className="p-5 flex-1 space-y-4">
             {/* Red Flags from Text */}
             {data.text_symptom_extraction?.red_flags_detected && data.text_symptom_extraction.red_flags_detected.length > 0 ? (
                <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex gap-3 items-start">
                   <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                   <div>
                      <span className="text-xs font-bold text-red-800 uppercase block mb-1">Red Flags Detected</span>
                      <p className="text-xs text-red-700 font-medium">
                        {data.text_symptom_extraction.red_flags_detected.join(", ")}
                      </p>
                   </div>
                </div>
             ) : (
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex gap-2 items-center">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div>
                   <span className="text-xs font-medium text-green-700">No red flags in text</span>
                </div>
             )}

             <div className="flex flex-wrap gap-2">
                {data.text_symptom_extraction?.structured_symptoms?.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs rounded-full border border-violet-100 font-medium">
                    {s}
                  </span>
                ))}
             </div>
             
             {data.text_symptom_extraction?.consistency_notes && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="font-bold text-slate-500 block mb-1 text-[10px] uppercase tracking-wider">Consistency Check</span>
                  <p className="italic">"{data.text_symptom_extraction.consistency_notes}"</p>
                </div>
             )}
          </div>
        </div>

        {/* Multi-File Analysis (Consolidated) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
             <Layers className="w-4 h-4 text-blue-600" />
             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">File Analysis</h4>
          </div>
          <div className="p-5 flex-1 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
            
            {/* Parsed Files List */}
            {data.multi_file_analysis?.parsed_files && data.multi_file_analysis.parsed_files.length > 0 ? (
               <div className="flex flex-col gap-2">
                 {data.multi_file_analysis.parsed_files.map((file, idx) => (
                    <div key={idx} className="flex flex-col bg-slate-50 border border-slate-100 p-2 rounded text-xs">
                       <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-700 truncate max-w-[120px]">{file.file_name}</span>
                          <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-500">{file.doc_type}</span>
                       </div>
                       {file.key_findings && file.key_findings.length > 0 && (
                          <div className="text-slate-600 text-[10px] italic">
                             • {file.key_findings[0]}
                          </div>
                       )}
                    </div>
                 ))}
               </div>
            ) : (
                <div className="text-xs text-slate-400 italic">No files processed</div>
            )}

            {/* Cross-Correlations */}
            {data.multi_file_analysis?.cross_correlations && data.multi_file_analysis.cross_correlations.length > 0 && (
               <div className="bg-blue-50/50 border border-blue-100 rounded p-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Doc Correlations</span>
                  <ul className="list-disc pl-3 text-xs text-slate-700 space-y-0.5">
                     {data.multi_file_analysis.cross_correlations.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
               </div>
            )}
            
            {/* Medications */}
            {data.multi_file_analysis?.medications_identified && data.multi_file_analysis.medications_identified.length > 0 && (
               <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <Pill className="w-3 h-3" /> Med Review
                  </div>
                  <div className="space-y-2">
                    {data.multi_file_analysis.medications_identified.map((med, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-100 rounded p-2 text-xs">
                         <div className="flex justify-between font-semibold text-slate-700">
                           <span>{med.name}</span>
                           <span className="text-slate-500 font-normal">{med.dose || 'N/A'}</span>
                         </div>
                         {med.potential_interactions && (
                            <div className="mt-1 flex gap-1 items-start text-amber-600">
                               <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                               <span className="text-[10px] italic">{med.potential_interactions}</span>
                            </div>
                         )}
                      </div>
                    ))}
                  </div>
               </div>
            )}

            {/* Abnormal Values */}
            {data.multi_file_analysis?.abnormalities_detected && data.multi_file_analysis.abnormalities_detected.length > 0 ? (
               <div>
                 <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-2">Aggregated Abnormalities</span>
                 <ul className="space-y-1.5">
                   {data.multi_file_analysis.abnormalities_detected.slice(0, 5).map((val, i) => (
                     <li key={i} className="text-slate-700 flex items-start gap-2 text-xs bg-red-50/50 p-1.5 rounded border border-red-50">
                       <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                       {val}
                     </li>
                   ))}
                 </ul>
               </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Reasoning & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Logic Chain & Correlations */}
        <div className="col-span-2 bg-slate-900 text-slate-300 rounded-xl p-6 shadow-md border border-slate-800 flex flex-col">
           <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
              <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <Brain className="w-4 h-4" /> 
                Internal Reasoning Engine
              </h4>
              <span className="text-[10px] font-mono text-slate-500">v3.0-PRO // LOGIC_TRACE</span>
           </div>
           
           <div className="space-y-6 flex-1 font-mono text-sm">
             {/* Pattern Recognition */}
             <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Clinical Pattern Match</span>
                <p className="text-white bg-slate-800/50 p-3 rounded border border-slate-700/50 shadow-inner">
                  {data.combined_reasoning.pattern_recognition}
                </p>
             </div>

             {/* Logic Chain */}
             <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">Deductive Logic Chain</span>
                <div className="text-slate-300 bg-slate-800/50 p-3 rounded border border-slate-700/50 shadow-inner leading-relaxed text-xs">
                  <span className="text-teal-500/50 select-none mr-2">$</span>
                  {data.combined_reasoning.logic_chain}
                </div>
             </div>

             {/* Correlations */}
             {data.combined_reasoning.cross_modality_correlations && (
               <div className="pt-2">
                 <span className="text-xs text-slate-500 uppercase tracking-wider block mb-2">Cross-Modality Evidence</span>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.combined_reasoning.cross_modality_correlations.map((corr, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-teal-200/80">
                        <span className="mt-1 w-1 h-1 bg-teal-500 rounded-full"></span>
                        {corr}
                      </div>
                    ))}
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl p-0 shadow-sm border border-slate-200 overflow-hidden flex flex-col">
           <div className="p-4 bg-teal-50/50 border-b border-teal-100 flex items-center gap-2">
             <ArrowRight className="w-4 h-4 text-teal-700" />
             <h4 className="text-sm font-bold text-teal-900 uppercase tracking-wide">Action Plan</h4>
           </div>
           
           <div className="p-5 flex-1 bg-white">
             <ul className="space-y-3">
               {data.next_steps.map((step, idx) => (
                 <li key={idx} className="flex gap-3 text-sm text-slate-700 group">
                   <span className="flex-shrink-0 w-6 h-6 bg-slate-100 text-slate-500 group-hover:bg-teal-100 group-hover:text-teal-700 rounded-full flex items-center justify-center text-xs font-bold transition-colors">
                     {idx + 1}
                   </span>
                   <span className="pt-0.5 leading-snug">{step}</span>
                 </li>
               ))}
             </ul>
             
             <div className="mt-6 pt-4 border-t border-slate-100">
               <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                 Monitoring
               </div>
               <div className="flex gap-2">
                 <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600 flex items-center gap-1">
                   <Thermometer className="w-3 h-3" /> Vitals
                 </span>
                 <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600 flex items-center gap-1">
                   <Syringe className="w-3 h-3" /> Labs
                 </span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};