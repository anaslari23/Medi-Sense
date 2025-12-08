import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MediSenseResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the strict schema for the JSON output
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    face_analysis: {
      type: Type.OBJECT,
      properties: {
        fatigue_indicators: { type: Type.STRING, description: "Observable signs of fatigue (e.g., dark circles, drooping eyelids)." },
        eye_redness: { type: Type.STRING, description: "Presence of scleral injection or conjunctival redness." },
        skin_pallor: { type: Type.STRING, description: "Paleness or lack of color in the skin." },
        jaundice_tint: { type: Type.STRING, description: "Yellowish discoloration of skin or eyes." },
        facial_swelling: { type: Type.STRING, description: "Edema or puffiness, localized or generalized." },
        facial_asymmetry: { type: Type.STRING, description: "Drooping or unevenness in facial features." },
        rashes_or_inflammation: { type: Type.STRING, description: "Visible skin eruptions, redness, or lesions." },
        overall_visual_impression: { type: Type.STRING, description: "Summary of visual findings." },
      },
    },
    voice_symptom_extraction: {
      type: Type.OBJECT,
      properties: {
        timeline: { type: Type.STRING },
        reported_severity: { type: Type.STRING },
        emotional_tone: { type: Type.STRING },
        breathing_patterns: { type: Type.STRING },
        key_symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    document_findings: {
      type: Type.OBJECT,
      properties: {
        document_type: { type: Type.STRING, description: "Type of document (e.g., Blood Test, Prescription, X-Ray Report, Vitals)." },
        abnormal_values: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of lab values that are out of range." },
        key_medical_terms: { type: Type.ARRAY, items: { type: Type.STRING } },
        clinical_relevance: { type: Type.STRING, description: "Human-readable explanation of the findings." },
        extracted_medications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Names of medications found in prescriptions." },
        vital_signs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extracted vital signs like BP, HR, Temp from images." },
      },
    },
    combined_reasoning: {
      type: Type.OBJECT,
      properties: {
        cross_modality_correlations: { type: Type.ARRAY, items: { type: Type.STRING } },
        pattern_recognition: { type: Type.STRING },
        logic_chain: { type: Type.STRING },
      },
    },
    severity_score: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
    next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    doctor_ready_summary: { type: Type.STRING },
  },
  required: [
    "face_analysis",
    "voice_symptom_extraction",
    "document_findings",
    "combined_reasoning",
    "severity_score",
    "next_steps",
    "doctor_ready_summary",
  ],
};

// Helper to convert File/Blob to Base64
const fileToPart = async (file: Blob, mimeType: string) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: mimeType,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeMedicalInputs = async (
  faceImage: string | null, // Base64 data URL
  audioBlob: Blob | null,
  documentFile: File | null
): Promise<MediSenseResponse> => {
  const parts: any[] = [];

  // Add System Instruction
  const systemInstruction = `
    You are MEDI-SENSE, an advanced AI medical evaluation assistant using Gemini 3 Pro multimodal capabilities.
    Analyze the provided inputs:
    1. Visual Face Cues (from camera)
    2. Voice/Audio Symptom Descriptions
    3. Medical Documents (PDFs, Prescriptions, Diagnostic Images, Vital Signs)
    
    GUIDELINES:
    1. **Safety First**: NEVER diagnose a disease. Use descriptive, observational language (e.g., "indicators consistent with," "visual signs of," "potential markers for").
    2. **Visual Analysis (Face)**:
       - Analyze the face image specifically for: Fatigue, Eye Redness, Pallor, Jaundice Tint, Facial Swelling, Asymmetry, and Rashes/Inflammation.
       - Be precise. If a feature is not present, state "None observed".
    3. **Document Analysis**:
       - **Lab Reports (PDFs)**: Extract lab parameters (WBC, RBC, Platelets, Hemoglobin, Creatinine, etc.). Identify values strictly out of range and list them in 'abnormal_values'. Provide a simplified explanation in 'clinical_relevance'.
       - **Prescriptions (Images)**: Read and list medicine names in 'extracted_medications'. Summarize instructions.
       - **Diagnostic Scans (Images/X-rays)**: Summarize key text/labels found on the image. **DO NOT** interpret the medical imagery itself (e.g., do not say "I see a fracture" based on the visual bone structure). Only report what the text on the scan says or general visual observations like "image contains chest x-ray".
       - **Vital Signs (Screenshots)**: Extract values (BP, SpO2, Heart Rate) into 'vital_signs'.
    4. **Voice Analysis**:
       - Transcribe symptoms, severity, timeline, and aggravating factors.
    5. **Multimodal Reasoning**: 
       - Cross-reference findings. Example: If document shows "Anemia" and face shows "Pallor", explicitly link them.
    6. **Triage**: Determine urgency (Severity Score) based on the *combination* of data points.
    
    If an input is missing, perform analysis on the available data and mark missing sections as "No data provided".
  `;

  // 1. Process Face Image
  if (faceImage) {
    // faceImage is expected to be "data:image/jpeg;base64,..."
    const base64Data = faceImage.split(',')[1];
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    });
    parts.push({ text: "Input 1: Image of patient's face. Analyze for: fatigue, eye redness, pallor, jaundice, swelling, asymmetry, and rashes." });
  }

  // 2. Process Audio
  if (audioBlob) {
    const audioPart = await fileToPart(audioBlob, audioBlob.type || 'audio/webm');
    parts.push(audioPart);
    parts.push({ text: "Input 2: Audio recording of patient describing symptoms. Analyze for tone, breathing patterns, and timeline." });
  }

  // 3. Process Document
  if (documentFile) {
    const docPart = await fileToPart(documentFile, documentFile.type);
    parts.push(docPart);
    parts.push({ text: `Input 3: Medical document (${documentFile.name}). Identify type (Lab Report, Prescription, Scan, Vitals). Extract abnormal values, medicines, or key text findings.` });
  }

  if (parts.length === 0) {
    throw new Error("No inputs provided for analysis.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for complex reasoning
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text) as MediSenseResponse;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};