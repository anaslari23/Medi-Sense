import React from 'react';
import { MediSenseResponse } from '../types';
import { Activity, Brain, FileSearch, Mic, Eye, ArrowRight, ShieldAlert, Loader2, Pill, HeartPulse } from 'lucide-react';

interface AnalysisResultProps {
  data: MediSenseResponse | null;
  isLoading: boolean;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Severity Loading */}
        <div className="h-24 bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
           <div className="h-12 w-12 bg-slate-100 rounded-full"></div>
           <div className="space-y-2 flex-1">
             <div className="h-4 w-1/4 bg-slate-100 rounded"></div>
             <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
           </div>
        </div>

        {/* Grid Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="h-64 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
             <div className="h-5 w-1/3 bg-slate-100 rounded mb-4"></div>
             <div className="h-3 w-full bg-slate-100 rounded"></div>
             <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
             <div className="h-3 w-4/6 bg-slate-100 rounded"></div>
           </div>
           <div className="h-64 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
             <div className="h-5 w-1/3 bg-slate-100 rounded mb-4"></div>
             <div className="h-3 w-full bg-slate-100 rounded"></div>
             <div className="h-3 w-5/6 bg-slate-100 rounded"></div>
           </div>
           <div className="h-64 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
             <div className="h-5 w-1/3 bg-slate-100 rounded mb-4"></div>
             <div className="h-3 w-full bg-slate-100 rounded"></div>
           </div>
        </div>
        
        {/* Reasoning Loading */}
        <div className="h-40 bg-slate-900/5 rounded-xl border border-slate-200"></div>

        <div className="text-center text-slate-500 text-sm flex items-center justify-center gap-2 mt-4">
           <Loader2 className="w-4 h-4 animate-spin" />
           Synthesizing multimodal inputs with Gemini 3 Pro...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-green-50 text-green-700 border-green-200 ring-green-100';
      case 'moderate': return 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-100';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-100';
      case 'critical': return 'bg-red-50 text-red-700 border-red-200 ring-red-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

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
    <div className="space-y-6 animate-fade-in-up pb-10">
      
      {/* Top Banner: Severity & Summary */}
      <div className={`rounded-xl border p-6 flex flex-col md:flex-row gap-6 items-start ring-4 ring-offset-0 ${getSeverityColor(data.severity_score)}`}>
         <div className="flex-shrink-0">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 bg-white/50 ${data.severity_score === 'Critical' ? 'animate-pulse' : ''}`}>
               <Activity className="w-8 h-8 opacity-80" />
            </div>
         </div>
         <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-xl font-bold uppercase tracking-tight">{data.severity_score} Severity</h3>
               <span className="text-[10px] uppercase font-bold px-2 py-1 bg-white/50 rounded border border-black/5">AI Triage</span>
            </div>
            <p className="text-sm font-medium opacity-90 leading-relaxed whitespace-pre-wrap">{data.doctor_ready_summary}</p>
         </div>
      </div>

      {/* Main Grid: Face, Voice, Docs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Face Analysis Stream */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-t-xl">
             <Eye className="w-4 h-4 text-teal-600" />
             <h4 className="text-sm font-semibold text-slate-800">Face Analysis Stream</h4>
          </div>
          <div className="p-4 space-y-4 flex-1">
             <div className="space-y-3 font-mono text-xs">
               {faceMetrics.map((metric) => (
                 <div key={metric.label} className="flex gap-2">
                   <div className="flex flex-col w-full">
                     <span className="text-teal-700 font-semibold mb-0.5">{metric.label}:</span>
                     <span className="text-slate-600 border-l-2 border-slate-100 pl-2">
                       {metric.value || "Not evaluated"}
                     </span>
                   </div>
                 </div>
               ))}
               <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
                  <span className="text-slate-400 text-[10px] uppercase">Overall Impression</span>
                  <p className="text-slate-700 mt-1 italic leading-tight">{data.face_analysis.overall_visual_impression}</p>
               </div>
             </div>
          </div>
        </div>

        {/* Voice Symptoms */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-t-xl">
             <Mic className="w-4 h-4 text-indigo-600" />
             <h4 className="text-sm font-semibold text-slate-800">Voice Symptom Extraction</h4>
          </div>
          <div className="p-4 flex-1 space-y-4">
             <div className="flex flex-wrap gap-2">
                {data.voice_symptom_extraction.key_symptoms?.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md border border-indigo-100 font-medium">
                    {s}
                  </span>
                ))}
             </div>
             <div className="space-y-3 text-sm text-slate-600">
               <div className="flex justify-between border-b border-dashed border-slate-100 pb-2">
                 <span className="text-slate-400 text-xs uppercase">Timeline</span>
                 <span className="font-medium text-right">{data.voice_symptom_extraction.timeline}</span>
               </div>
               <div className="flex justify-between border-b border-dashed border-slate-100 pb-2">
                 <span className="text-slate-400 text-xs uppercase">Tone</span>
                 <span className="font-medium text-right">{data.voice_symptom_extraction.emotional_tone}</span>
               </div>
                <div className="flex justify-between">
                 <span className="text-slate-400 text-xs uppercase">Severity</span>
                 <span className="font-medium text-right">{data.voice_symptom_extraction.reported_severity}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Doc Findings */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50 rounded-t-xl">
             <FileSearch className="w-4 h-4 text-blue-600" />
             <h4 className="text-sm font-semibold text-slate-800">Medical Data Extraction</h4>
          </div>
          <div className="p-4 flex-1 space-y-4 text-sm">
            <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
               Type: <span className="font-semibold text-slate-700">{data.document_findings.document_type || "No Document"}</span>
            </div>
            
            {/* Medications */}
            {data.document_findings.extracted_medications && data.document_findings.extracted_medications.length > 0 && (
               <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    <Pill className="w-3 h-3" /> Medications
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.document_findings.extracted_medications.map((med, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                        {med}
                      </span>
                    ))}
                  </div>
               </div>
            )}

            {/* Vitals */}
            {data.document_findings.vital_signs && data.document_findings.vital_signs.length > 0 && (
               <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    <HeartPulse className="w-3 h-3" /> Vital Signs
                  </div>
                  <ul className="grid grid-cols-2 gap-2">
                    {data.document_findings.vital_signs.map((vital, i) => (
                      <li key={i} className="bg-slate-50 px-2 py-1 rounded text-xs text-slate-700 border border-slate-100">
                        {vital}
                      </li>
                    ))}
                  </ul>
               </div>
            )}

            {/* Abnormal Values */}
            {data.document_findings.abnormal_values && data.document_findings.abnormal_values.length > 0 ? (
               <div>
                 <span className="text-xs font-bold text-red-500 uppercase tracking-wide block mb-1">Abnormalities</span>
                 <ul className="space-y-1">
                   {data.document_findings.abnormal_values.map((val, i) => (
                     <li key={i} className="text-slate-700 flex items-start gap-2">
                       <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></span>
                       {val}
                     </li>
                   ))}
                 </ul>
               </div>
            ) : (
                (!data.document_findings.extracted_medications?.length && !data.document_findings.vital_signs?.length) && (
                   <p className="text-slate-400 italic">No specific abnormal values or medications detected.</p>
                )
            )}
            
            {data.document_findings.clinical_relevance && (
                <div className="bg-blue-50/50 p-2 rounded border border-blue-100 text-xs text-slate-700 leading-snug">
                    <span className="font-semibold text-blue-800">Note:</span> {data.document_findings.clinical_relevance}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Reasoning & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Logic Chain & Correlations */}
        <div className="bg-slate-800 text-slate-200 rounded-xl p-6 shadow-md border border-slate-700">
           <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
             <Brain className="w-4 h-4" /> Multimodal Reasoning
           </h4>
           
           {/* Correlations Section */}
           {data.combined_reasoning.cross_modality_correlations && data.combined_reasoning.cross_modality_correlations.length > 0 && (
             <div className="mb-5 pb-4 border-b border-slate-700">
               <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide block mb-3">Key Correlations</span>
               <ul className="space-y-2">
                 {data.combined_reasoning.cross_modality_correlations.map((corr, i) => (
                   <li key={i} className="flex items-start gap-2.5 text-sm text-teal-200">
                     <span className="mt-1.5 w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0"></span>
                     <span>{corr}</span>
                   </li>
                 ))}
               </ul>
             </div>
           )}

           <div className="space-y-4 text-sm leading-relaxed">
              <p><strong className="text-white">Pattern Recognition:</strong> {data.combined_reasoning.pattern_recognition}</p>
              <div>
                <strong className="text-white block mb-1">Logic Chain:</strong>
                <p className="text-slate-400 pl-3 border-l-2 border-slate-600 italic">
                  "{data.combined_reasoning.logic_chain}"
                </p>
              </div>
           </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
           <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
             <ArrowRight className="w-4 h-4 text-teal-600" /> Recommended Action Plan
           </h4>
           <ul className="space-y-3">
             {data.next_steps.map((step, idx) => (
               <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100">
                 <span className="flex-shrink-0 w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                 <span>{step}</span>
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );
};