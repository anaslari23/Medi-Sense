export interface FaceAnalysis {
  fatigue_indicators?: string;
  eye_redness?: string;
  skin_pallor?: string;
  jaundice_tint?: string;
  facial_swelling?: string;
  facial_asymmetry?: string;
  rashes_or_inflammation?: string;
  overall_visual_impression?: string;
}

export interface VoiceSymptomExtraction {
  timeline?: string;
  reported_severity?: string;
  emotional_tone?: string;
  breathing_patterns?: string;
  key_symptoms?: string[];
}

export interface TextSymptomExtraction {
  structured_symptoms?: string[];
  timeline_analysis?: string;
  pain_severity?: string;
  red_flags_detected?: string[];
  consistency_notes?: string;
}

export interface DocumentFindings {
  // Deprecated in favor of multi_file_analysis, kept for backward compat if needed
  document_type?: string;
  abnormal_values?: string[];
  key_medical_terms?: string[];
  clinical_relevance?: string;
  extracted_medications?: string[];
  vital_signs?: string[];
}

export interface MultiFileAnalysis {
  parsed_files?: { file_name: string; doc_type: string; key_findings: string[] }[];
  abnormalities_detected?: string[];
  cross_correlations?: string[];
  medications_identified?: { name: string; dose?: string; potential_interactions?: string }[];
  timeline_inference?: string;
}

export interface CombinedReasoning {
  cross_modality_correlations?: string[];
  pattern_recognition?: string;
  logic_chain?: string;
}

export interface MediSenseResponse {
  face_analysis: FaceAnalysis;
  voice_symptom_extraction: VoiceSymptomExtraction;
  text_symptom_extraction?: TextSymptomExtraction;
  document_findings?: DocumentFindings; // Optional legacy support
  multi_file_analysis: MultiFileAnalysis;
  combined_reasoning: CombinedReasoning;
  severity_score: "Low" | "Moderate" | "High" | "Critical";
  next_steps: string[];
  doctor_ready_summary: string;
}

export interface FileData {
  file: File;
  previewUrl: string;
  type: 'image' | 'pdf';
}