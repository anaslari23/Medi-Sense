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

export interface DocumentFindings {
  document_type?: string;
  abnormal_values?: string[];
  key_medical_terms?: string[];
  clinical_relevance?: string;
  extracted_medications?: string[];
  vital_signs?: string[];
}

export interface CombinedReasoning {
  cross_modality_correlations?: string[];
  pattern_recognition?: string;
  logic_chain?: string;
}

export interface MediSenseResponse {
  face_analysis: FaceAnalysis;
  voice_symptom_extraction: VoiceSymptomExtraction;
  document_findings: DocumentFindings;
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