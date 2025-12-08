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
        skin_pallor: { type: Type.STRING, description: "Paleness or lack of color in the skin. NOTE: Check for bluish tint (cyanosis) which is critical." },
        jaundice_tint: { type: Type.STRING, description: "Yellowish discoloration of skin or eyes." },
        facial_swelling: { type: Type.STRING, description: "Edema or puffiness, localized or generalized." },
        facial_asymmetry: { type: Type.STRING, description: "Drooping or unevenness in facial features (possible stroke indicator)." },
        rashes_or_inflammation: { type: Type.STRING, description: "Visible skin eruptions, redness, or lesions." },
        overall_visual_impression: { type: Type.STRING, description: "Summary of visual findings." },
      },
    },
    voice_symptom_extraction: {
      type: Type.OBJECT,
      properties: {
        timeline: { type: Type.STRING },
        reported_severity: { type: Type.STRING },
        emotional_tone: { type: Type.STRING, description: "Detect distress, pain, anxiety, or calmness." },
        breathing_patterns: { type: Type.STRING, description: "Note gasping, wheezing, or labored breathing." },
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
        cross_modality_correlations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific logical connections found between different inputs." },
        pattern_recognition: { type: Type.STRING, description: "Identification of a broader clinical pattern or syndrome." },
        logic_chain: { type: Type.STRING, description: "Step-by-step deduction path explaining why the inputs point to this pattern." },
      },
    },
    severity_score: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
    next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    doctor_ready_summary: { type: Type.STRING, description: "A comprehensive final report text block. Must include Chief Complaint, Observations, Findings, Assessment, Plan, and Warnings." },
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
  faceImage: string | null,
  audioBlob: Blob | null,
  documentFile: File | null
): Promise<MediSenseResponse> => {
  const parts: any[] = [];

  // Enhanced System Instruction with strict safety protocols
  const systemInstruction = `
    You are MEDI-SENSE, an empathetic and medically aware AI evaluation assistant using Gemini 3 Pro.
    Your goal is to provide **early triage-level insights** by analyzing face cues, voice, and documents.

    ================================================================
    *** CRITICAL SAFETY PROTOCOLS - READ CAREFULLY ***
    ================================================================
    
    1. **IMMEDIATE DANGER TRIGGERS**:
       If ANY of the following are detected in Voice, Face, or Text, you MUST prioritize them:
       - **Symptoms**: Severe chest pain/pressure, difficulty breathing/gasping, sudden confusion, fainting, severe allergic reaction, slurred speech, or uncontrolled bleeding.
       - **Visuals**: Bluish lips/face (Cyanosis), extreme pallor, or visible severe distress/pain.
       
       ACTION: 
       - Set 'severity_score' to "High" or "Critical".
       - The FIRST item in 'next_steps' must be: "SEEK URGENT MEDICAL CARE IMMEDIATELY."
       - Start the 'doctor_ready_summary' with a clear WARNING.

    2. **NO DIAGNOSIS RULE**:
       - NEVER statement: "You have [Disease Name]."
       - ALWAYS state: "Symptoms are consistent with...", "Indicators suggest possible...", "Clinical patterns resemble..."
       - Do not be definitive. You are an analysis tool, not a doctor.

    3. **MISSING/NORMAL SYMPTOMS**:
       - If the user looks healthy, reports no pain, and documents are normal:
         - Do not invent symptoms.
         - Set 'severity_score' to "Low".
         - Output in summary: "No significant clinical indicators were detected based on current inputs."
         - Next step: "Please monitor for any changes or provide more specific details."

    4. **TONE & EMPATHY**:
       - Be professional, calm, and reassuring.
       - Use clear language. Avoid overly complex jargon without explanation.
       - Show care: "It sounds like you're in pain," or "That cough sounds persistent."

    ================================================================
    MODALITY INSTRUCTIONS
    ================================================================

    **1. Visual Analysis (Face)**:
       - Scrutinize for: Fatigue (dark circles), Redness (conjunctivitis/inflammation), Pallor/Cyanosis (anemia/hypoxia), Jaundice (liver), Swelling (edema/allergy), Asymmetry (stroke/palsy), Rashes.
       - Be precise. If normal, state "No abnormalities observed."

    **2. Voice Analysis**:
       - Transcribe the user's description verbatim where possible.
       - Extract: Timeline, Severity (1-10), Pain characteristics.
       - Listen for: Wheezing, coughing, breathless speech, or nasal tone.

    **3. Document Analysis**:
       - **Labs**: Compare values to standard reference ranges. Highlight only REAL abnormalities.
       - **Images**: Summarize text content. Do not interpret X-ray shadows yourself, only read the report text if visible.

    **4. Multimodal Reasoning**:
       - Connect the dots. 
       - *Example*: "User reports dizziness (Voice) + Face is pale (Vision) + Low Iron (Doc) -> Suggests Anemia."
       - *Example*: "Chest pain (Voice) + Sweating/Distress (Vision) -> POTENTIAL CARDIAC EVENT (High Severity)."

    **5. Final Report Construction ('doctor_ready_summary')**:
       - Structure:
         * **Chief Complaint**: What is bothering the user?
         * **Observations**: Visual and Auditory findings.
         * **Key Findings**: Abnormal data points.
         * **Assessment**: logical correlations (Non-diagnostic).
         * **Plan**: Immediate steps.
       - **MANDATORY FOOTER**: You MUST end the string with exactly: 
         "This system provides early insights, not medical diagnoses. Consult a professional."

    If an input is missing, skip that modality and note "Data not provided".
  `;

  // 1. Process Face Image
  if (faceImage) {
    const base64Data = faceImage.split(',')[1];
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    });
    parts.push({ text: "Input 1 (Vision): Patient face image. Check for fatigue, pallor, cyanosis (bluish lips), jaundice, swelling, asymmetry, rashes." });
  }

  // 2. Process Audio
  if (audioBlob) {
    const audioPart = await fileToPart(audioBlob, audioBlob.type || 'audio/webm');
    parts.push(audioPart);
    parts.push({ text: "Input 2 (Audio): Patient describing symptoms. Listen for distress, breathing difficulty, and specific symptom timeline." });
  }

  // 3. Process Document
  if (documentFile) {
    const docPart = await fileToPart(documentFile, documentFile.type);
    parts.push(docPart);
    parts.push({ text: `Input 3 (Document): ${documentFile.name}. Extract abnormal lab values, vitals, or medical report findings.` });
  }

  if (parts.length === 0) {
    throw new Error("No inputs provided for analysis.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
