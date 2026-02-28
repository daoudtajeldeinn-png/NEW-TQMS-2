

import { GoogleGenAI, Type } from "@google/genai";

export const getMFRTemplate = async (productName: string, dosageForm: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As a Pharmaceutical Manufacturing Expert, generate a Master Formulation Record (MFR) template for:
    Product: ${productName}
    Dosage Form: ${dosageForm}
    
    Include:
    1. Bill of Materials (Ingredients with theoretical quantities for a standard batch).
    2. Detailed Manufacturing Process Steps (Preparation, Granulation/Mixing, Compression/Filling, Coating if applicable).
    3. Critical Process Parameters (CPPs) and In-Process checks.
    
    Ensure the terminology is professional and follows BP/USP/FDA standards.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                materialName: { type: Type.STRING },
                quantity: { type: Type.STRING },
                unit: { type: Type.STRING }
              },
              required: ["materialName", "quantity", "unit"]
            }
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                operation: { type: Type.STRING },
                instruction: { type: Type.STRING },
                limit: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['Preparation', 'Processing', 'QC', 'Packaging'] }
              },
              required: ["operation", "instruction", "category"]
            }
          },
          theoreticalYield: { type: Type.STRING },
          batchSize: { type: Type.STRING }
        },
        required: ["ingredients", "steps", "theoreticalYield", "batchSize"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const getIPQCMonograph = async (productName: string, dosageForm: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As a Pharmaceutical Quality Control Expert, provide the mandatory In-Process Quality Control (IPQC) tests and specification limits for:
    Product: ${productName}
    Dosage Form: ${dosageForm}
    
    Base the requirements on current BP/USP/Ph.Eur General Monographs. 
    Include:
    1. A list of tests with targets, USL, LSL, and units.
    2. The specific Pharmacopoeial reference (e.g., BP 2024, USP 43-NF 38).
    3. Recommended production stage for each test (e.g., Compression, Filling, Mixing).
    4. Sampling plan rationale.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pharmacopoeiaRef: { type: Type.STRING },
          tests: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                testName: { type: Type.STRING },
                target: { type: Type.STRING },
                usl: { type: Type.NUMBER },
                lsl: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                frequency: { type: Type.STRING },
                stage: { type: Type.STRING }
              },
              required: ["testName", "target", "usl", "lsl", "unit", "stage"]
            }
          },
          samplingPlan: { type: Type.STRING }
        },
        required: ["tests", "samplingPlan", "pharmacopoeiaRef"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const getRegulatoryChangeImpact = async (title: string, description: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As a Pharmaceutical Regulatory Affairs and Quality Expert, analyze the following proposed change:
    Title: ${title}
    Description: ${description}
    
    Provide an impact assessment against:
    1. GMP (Manufacturing/Validation)
    2. GDP (Distribution/Storage)
    3. GLP (Lab/Analytical)
    4. GEP (Engineering/Maintenance)
    5. FDA/ICH Guidelines (Regulatory Filings)
    
    Suggest specific implementation tasks and estimate the risk level.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: { type: Type.NUMBER, description: "Risk level from 1 to 10" },
          regulatoryImplications: { type: Type.ARRAY, items: { type: Type.STRING } },
          impactsFound: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedTasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          isValidationRequired: { type: Type.BOOLEAN }
        },
        required: ["riskScore", "regulatoryImplications", "impactsFound", "suggestedTasks", "isValidationRequired"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const getHazardScout = async (processStep: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As a Pharmaceutical Quality Risk Management (QRM) expert, identify 3 critical hazards for the process step: "${processStep}". Focus on GMP compliance, patient safety, and product quality.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hazard: { type: Type.STRING },
            potentialEffect: { type: Type.STRING },
            suggestedMitigation: { type: Type.STRING }
          },
          required: ["hazard", "potentialEffect", "suggestedMitigation"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const getMonographTests = async (product: string, category: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide the official pharmaceutical monograph tests for:
    Product: ${product} (If this is a brand name like Paramol, use Paracetamol BP).
    Category: ${category} (Finished Product, Raw Material, Water Analysis, Utilities, API, Microbiology).
    
    Base requirements strictly on BP 2024 / USP 43-NF 38 / Ph.Eur 11.0.
    
    Include mandatory sections based on category: 
    1. For Finished Products/APIs: Physical (Appearance, Hardness, Disintegration, Average Weight, Uniformity of Dosage Units), Chemical (Identification IR/TLC, Assay, Related Substances, pH), and Microbiological (TAMC, TYMC, Specific Pathogens).
    2. For Raw Materials: Characters, Identification, Solubility, Loss on Drying, Heavy Metals, Sulfated Ash, Assay.
    3. For Water Analysis (Purified Water/WFI): Conductivity (Stage 1/2/3), TOC, Nitrates, Heavy Metals, TAMC (NMT 100 CFU/mL for Purified, NMT 10 CFU/100mL for WFI).
    4. For Utilities (Compressed Air/Nitrogen): Oil Content, Dew Point, Particulate Matter, Viable Count.
    
    Format as a professional pharmaceutical laboratory record compliant with BP 2024 standards.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            t: { type: Type.STRING, description: "Test Name" },
            s: { type: Type.STRING, description: "Official Specification" },
            category: { type: Type.STRING, enum: ['Descriptive', 'Physical', 'Chemical', 'Microbiological'] }
          },
          required: ["t", "s", "category"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};

// @google/genai compliance: Extract grounding chunks for search tool
export const getDeveloperInfo = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: "Research and provide professional information/CV details for 'Dr. Daoud Tajeldeinn Ahmed Abdel kareim'. Focus on his contributions as a pharmaceutical expert and software developer for TQM systems. Provide a professional executive summary.",
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  // Extract grounding chunks for search compliance
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      uri: chunk.web.uri,
      title: chunk.web.title
    }));

  return {
    text: response.text || '',
    sources: sources
  };
};

export const getOOSInvestigationPlan = async (test: string, result: string, spec: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As a QC Laboratory Lead, provide a Phase I investigation plan for an OOS result.
    Test: ${test}
    Result: ${result}
    Specification: ${spec}
    Include specific checks for instrument, reagents, and analyst technique.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          immediateActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          analystChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
          probableRootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
          retestStrategy: { type: Type.STRING }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const getCAPASuggestions = async (deviationDescription: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this pharmaceutical deviation and suggest RCA/CAPA: "${deviationDescription}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rootCause: { type: Type.STRING },
          correctiveAction: { type: Type.STRING },
          preventiveAction: { type: Type.STRING },
          severityEstimate: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] }
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const getAuditChecklist = async (department: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a GMP audit checklist for: ${department}. Include references to EU GMP/FDA.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            checkItem: { type: Type.STRING },
            regulatoryRef: { type: Type.STRING }
          },
          required: ["checkItem", "regulatoryRef"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const analyzeRiskFMEA = async (processStep: string, hazard: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Perform FMEA as per ICH Q9 for: Process: ${processStep}, Hazard: ${hazard}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.NUMBER },
          occurrence: { type: Type.NUMBER },
          detection: { type: Type.NUMBER },
          potentialEffect: { type: Type.STRING },
          recommendedMitigation: { type: Type.STRING }
        },
        required: ["severity", "occurrence", "detection", "potentialEffect", "recommendedMitigation"]
      }
    }
  });
  return JSON.parse(response.text);
};
