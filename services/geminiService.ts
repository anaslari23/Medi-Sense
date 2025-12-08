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
        skin_pallor: { type: Type.STRING, description: "Paleness or lack of color. NOTE: Check for cyanosis (bluish tint) or extreme pallor (shock/anemia)." },
        jaundice_tint: { type: Type.STRING, description: "Icteric sclera or yellowish skin discoloration (liver/biliary)." },
        facial_swelling: { type: Type.STRING, description: "Edema (periorbital, facial) or angioedema indications." },
        facial_asymmetry: { type: Type.STRING, description: "Unilateral drooping (ptosis, nasolabial fold flattening) indicative of neurological deficit." },
        rashes_or_inflammation: { type: Type.STRING, description: "Malar rash, discoid rash, urticaria, or cellulitis indications." },
        overall_visual_impression: { type: Type.STRING, description: "Clinical 'End-of-Bed-O-Gram' summary." },
      },
    },
    voice_symptom_extraction: {
      type: Type.OBJECT,
      properties: {
        timeline: { type: Type.STRING, description: "Onset and duration extracted via OLDCARTS." },
        reported_severity: { type: Type.STRING, description: "Pain/Discomfort scale (1-10) or qualitative severity." },
        emotional_tone: { type: Type.STRING, description: "Anxiety, lethargy, confusion, or stoicism." },
        breathing_patterns: { type: Type.STRING, description: "Audible dyspnea, wheezing, stridor, or tachypnea." },
        key_symptoms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Primary structured symptoms from audio (OLDCARTS/OPQRST)." },
      },
    },
    text_symptom_extraction: {
      type: Type.OBJECT,
      properties: {
        structured_symptoms: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Symptoms parsed from text input using OLDCARTS." },
        timeline_analysis: { type: Type.STRING, description: "Onset/Duration derived from text." },
        pain_severity: { type: Type.STRING, description: "Severity derived from text." },
        red_flags_detected: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords: Chest pain, SOB, Syncope, etc." },
        consistency_notes: { type: Type.STRING, description: "Comparison with voice/face inputs (e.g., 'Text claims severe pain but voice is calm')." },
      },
    },
    document_findings: {
      type: Type.OBJECT,
      properties: {
        document_type: { type: Type.STRING, description: "Type of document (e.g., CBC, BMP, CXR Report)." },
        abnormal_values: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Values outside reference ranges with clinical context." },
        key_medical_terms: { type: Type.ARRAY, items: { type: Type.STRING } },
        clinical_relevance: { type: Type.STRING, description: "Pattern-based interpretation of labs (e.g., 'Microcytic pattern')." },
        extracted_medications: { type: Type.ARRAY, items: { type: Type.STRING } },
        vital_signs: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    combined_reasoning: {
      type: Type.OBJECT,
      properties: {
        cross_modality_correlations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Synthesized evidence linking Face, Voice, Text, and Docs." },
        pattern_recognition: { type: Type.STRING, description: "Broad clinical category (e.g., 'Infectious Respiratory Pattern')." },
        logic_chain: { type: Type.STRING, description: "Step-by-step reasoning using VINDICATE or clinical scoring logic." },
      },
    },
    severity_score: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] },
    next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    doctor_ready_summary: { type: Type.STRING, description: "Structured SBAR or SOAP style summary for clinical handoff." },
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
  documentFile: File | null,
  textInput: string | null
): Promise<MediSenseResponse> => {
  const parts: any[] = [];

  // Enhanced System Instruction with Clinical Frameworks & Text Processing & Consistency Checker
  const systemInstruction = `
    You are MEDI-SENSE, an advanced AI clinical evaluation assistant powered by Gemini 3 Pro. 
    Your role is to perform a **multimodal clinical triage analysis** using standardized medical reasoning frameworks.

    **CRITICAL LANGUAGE & STYLE PROTOCOL (STRICT ADHERENCE REQUIRED):**
    1. **Clinical Guideline Style**: Adopt the tone of a clinical decision support system. Be objective, cautious, and evidence-based.
    2. **Probabilistic Phrasing**:
       - **NEVER** state a diagnosis as fact (e.g., "Patient has pneumonia").
       - **ALWAYS** use hedging: "Findings suggest...", "Pattern is consistent with...", "May indicate...", "Possible etiology...", "Warrants evaluation for...", "Clinical picture supports...".
    3. **No Definitive Claims**: Avoid absolute certainty. Use "suggestive of" rather than "is".
    4. **Evidence-Based Attribution**: Explicitly link findings to the source (e.g., "Facial pallor combined with reported fatigue may suggest...").

    You must NOT diagnose. You must identify **patterns**, **risk levels**, and **clinical correlations**.

    ================================================================
    1. MANDATORY RULE-BASED TRIAGE OVERRIDES
    ================================================================
    You MUST set 'severity_score' to **HIGH** or **CRITICAL** if ANY of the following specific patterns are detected in ANY input (Text, Voice, or Visual). 
    
    **THIS OVERRIDE CANNOT BE BYPASSED. DO NOT DOWNGRADE SEVERITY IF THESE ARE PRESENT.**

    1. **Chest Pain**: Specifically radiating to arm/jaw, or described as crushing/pressure.
    2. **Breathing Difficulty**: Severe dyspnea, air hunger, stridor, or inability to speak in sentences.
    3. **Neurological Deficit**: Fainting (syncope), sudden confusion/altered mental status, slurred speech, facial droop (Stroke signs).
    4. **Uncontrolled Bleeding**: Hemorrhage or significant active blood loss.
    5. **Sudden Vision Loss**: Unilateral or bilateral.
    6. **Extreme Dehydration**: Signs of shock, sunken eyes, dry mucous membranes with lethargy.
    7. **Severe Abdominal Rigidity**: Signs of peritonitis (guarding, rebound tenderness).

    ================================================================
    2. MEDICAL REASONING FRAMEWORKS
    ================================================================

    **A. SYMPTOM ANALYSIS (Voice & Text)**
    Use **OLDCARTS** and **OPQRST** to structure extracted symptoms from BOTH voice and text inputs:
    - **O**nset (Sudden vs Gradual)
    - **L**ocation / **R**adiation
    - **D**uration / **T**iming (Constant vs Intermittent)
    - **C**haracter (Sharp, Dull, Burning) / **Q**uality
    - **A**ggravating / **R**elieving Factors
    - **S**everity (Pain score or functional impact)

    **B. DIFFERENTIAL THINKING (Logic Chain)**
    When forming the 'combined_reasoning', mentally cycle through **VINDICATE**:
    - **V**ascular (Clots, Ischemia)
    - **I**nfectious (Viral, Bacterial, Sepsis)
    - **N**eoplastic (Growth, weight loss)
    - **D**egenerative / Drug-related
    - **I**atrogenic / Idiopathic
    - **C**ongenital
    - **A**utoimmune / Allergic
    - **T**rauma
    - **E**ndocrine / Metabolic

    **C. CROSS-MODALITY INTEGRATION**
    - Integrate all modalities into the Logic Chain.

    **D. CLINICAL SCORING (Qualitative Risk Assessment)**
    Do not calculate scores formally, but use their criteria to determine 'severity_score':
    - **Sepsis/Infection**: Screen for qSOFA/SIRS (High RR, Altered Mental Status, Low BP history).
    - **Respiratory**: Screen for CURB-65 criteria (Confusion, Urea, RR, BP, Age).
    - **Vascular**: Screen for Wells Criteria (DVT/PE signs like unilateral swelling + tachycardia).
    - **General**: Use NEWS2 principles (Are vitals deviating from norm?).

    **E. LAB INTERPRETATION (Pattern Recognition)**
    - **Anemia**: Low Hb + High RDW? Check MCV (Micro/Macro).
    - **Infection**: Leukocytosis (High WBC) + Neutrophilia (Bacterial) vs Lymphocytosis (Viral).
    - **Organ Stress**: Creatinine/BUN (Kidney), AST/ALT/Bilirubin (Liver).

    ================================================================
    3. MANDATORY CLINICAL CONSISTENCY CHECKER (Internal Second Pass)
    ================================================================
    After producing your initial results, run a **SECOND INTERNAL PASS** to verify:
    
    1. **Evidence Verification**: Does the logic match the extracted evidence? (e.g., Do not claim "Pale" if 'skin_pallor' was empty).
    2. **Contradiction Check**: 
       - Are there contradictions between symptoms and conclusions? (e.g., "Mild pain" in text vs "Critical" severity).
       - Are there contradictions between modalities? (e.g., Voice implies distress, Face is smiling).
    3. **Severity Alignment**: 
       - Does the 'severity_score' match the Rule-Based Overrides? (e.g., If Chest Pain is present, score MUST be HIGH/CRITICAL).
    4. **Boundary Adherence**: 
       - Ensure aggregated evidence does NOT exceed medical interpretation boundaries.
       - **REVISE** statements like "Patient has X" to "Findings are consistent with X".

    **IF INCONSISTENCIES ARE FOUND, REVISE AUTOMATICALLY BEFORE FINAL OUTPUT.**

    ================================================================
    4. OUTPUT INSTRUCTIONS
    ================================================================
    - **Tone**: Professional, objective, cautious. Use clinical guideline-style language.
    - **Disclaimer**: End summary with: "This system provides early insights, not medical diagnoses. Consult a professional."

    **Doctor Ready Summary Structure (SBAR Style):**
    - **S**ituation: Age/Sex (if known) + Chief Complaint.
    - **B**ackground: History/Timeline (OLDCARTS).
    - **A**ssessment: Synthesis of findings using probabilistic language ("suggests", "consistent with").
    - **R**ecommendation: Triage urgency and specific next steps.
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
    parts.push({ text: "Input 1 (Vision): Patient face. Analyze for: Cyanosis, Pallor, Jaundice, Ptosis, Facial Droop, Angioedema, Rash distribution, Work of breathing (nasal flaring)." });
  }

  // 2. Process Audio
  if (audioBlob) {
    const audioPart = await fileToPart(audioBlob, audioBlob.type || 'audio/webm');
    parts.push(audioPart);
    parts.push({ text: "Input 2 (Audio): Patient voice. Transcribe and extract symptoms using OLDCARTS/OPQRST. Listen for stridor, wheezing, or dyspneic speech patterns." });
  }

  // 3. Process Document
  if (documentFile) {
    const docPart = await fileToPart(documentFile, documentFile.type);
    parts.push(docPart);
    parts.push({ text: `Input 3 (Document): ${documentFile.name}. Extract values. Analyze patterns (e.g., Anemia, Leukocytosis, Electrolyte imbalance).` });
  }

  // 4. Process Text Input
  if (textInput) {
    parts.push({ text: `Input 4 (Text Symptoms): "${textInput}". Parse via OLDCARTS. Check for Red Flags (e.g. Chest Pain, SOB). Cross-reference with other inputs for consistency.` });
  }

  if (parts.length === 0) {
    throw new Error("No inputs provided for analysis. Please provide at least one input (Face, Voice, Document, or Text).");
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