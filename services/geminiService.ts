
import { GoogleGenAI, Chat, Tool } from "@google/genai";
import { BOQItem, GeminiModel, LogEntry, AnalysisModule } from "../types";
import { MODULES, SAMPLE_BOQ_DATA } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Map of specific instructions for each module based on the Dynamic Intelligence Protocol
const MODULE_INSTRUCTIONS: Record<string, string> = {
  'Preliminary Works': `
    PHASE: PRELIMINARY WORKS (The Setup)
    1. **Site Fencing**: Search for "Site Plan". Find "PLOT LIMIT" or Boundary Line. Calculate Perimeter. Unit: m.l.
    2. **Mobilization**: Search "General Notes" for "Site Office". Unit: LS (Lump Sum).
    3. **Utilities**: Look for "Temporary Electricity/Water" notes.
  `,
  'Substructure': `
    PHASE: EARTHWORKS & SUBSTRUCTURE (The Underground)
    1. **Footings**: Cross-reference "Foundation Layout" with "Foundation Schedule".
    2. **PCC/Blinding**: Detect thickness (usually 10cm). Formula: (L+0.2)*(W+0.2)*Thickness.
    3. **Excavation**: (Footing Area + 1.0m offset) * (Depth from Ground to Bottom of PCC).
    4. **Neck Columns**: Height = Top of Footing to Ground Beam.
  `,
  'Superstructure': `
    PHASE: SUPERSTRUCTURE (The Skeleton)
    1. **The Truth Rule (CRITICAL)**: If dimensions differ between Arch (A) and Struct (S), prioritize STRUCTURAL for concrete.
    2. **Slabs**: Search "Slab Layout". Identify labels (S=150, T=200). Area * Thickness.
    3. **Beam Deduction**: If Beam Depth (60cm) > Slab (20cm), only calculate the "Drop" (40cm).
    4. **Columns**: Scan "Column Schedule" and count on plan.
  `,
  'Masonry Works': `
    PHASE: MASONRY & OPENINGS (The Shell)
    1. **Wall Trace**: Trace wall lines. Distinguish 20cm (Ext) vs 10cm (Int).
    2. **Deductions**: Search tags (W1, D1). Go to Door Schedule. Deduct (W*H) from Wall Area.
    3. **Lintels**: For every opening, add Lintel Concrete (Width + 0.4m).
  `,
  'Waterproofing': `
    PHASE: WATERPROOFING
    1. **Roof**: Calculate Roof Area (Flat). Add skirting (upturn 30cm).
    2. **Wet Areas**: Bathrooms/Kitchens floor area.
    3. **Substructure**: Footing surface area for bituminous coating.
  `,
  'Finishes & Openings': `
    PHASE: FINISHES (Vision & Color)
    1. **Room Mapping**: Read "Room Name" on Plan -> "Finish Schedule".
    2. **Flooring**: Area inside rooms.
    3. **Skirting**: Room Perimeter - Door Widths.
    4. **Walls**: (Perimeter * Height) - Openings.
  `
};

export const analyzeProjectDocs = async (
  files: File[],
  modelName: GeminiModel,
  onLog: (log: LogEntry) => void,
  onModuleComplete: (moduleId: number, data: BOQItem[]) => void
): Promise<void> => {
  try {
    if (!process.env.API_KEY) {
      onLog({ type: 'process', message: 'SIMULATION MODE: Processing modules sequentially...', timestamp: new Date() });
      let currentId = 1;
      for (const module of MODULES) {
        onLog({ type: 'process', message: `>>> ACTIVATING MODULE: ${module.title}...`, timestamp: new Date() });
        await delay(1500);
        
        // Filter sample data for this module
        const mockItems = SAMPLE_BOQ_DATA.filter(i => i.category === module.arabicTitle).map(item => ({
            ...item,
            id: currentId++
        }));
        
        onModuleComplete(module.id, mockItems);
        onLog({ type: 'success', message: `Completed ${module.title}. Found ${mockItems.length} items.`, timestamp: new Date() });
      }
      return;
    }

    onLog({ type: 'process', message: `INITIALIZING DYNAMIC INTELLIGENCE PROTOCOL (Model: ${modelName})...`, timestamp: new Date() });
    
    // 1. Prepare Files once
    const fileParts = await Promise.all(files.map(file => fileToGenerativePart(file)));
    
    let tools: Tool[] = [];
    let thinkingConfig = undefined;

    // Configure Thinking Budget based on model capability
    if (modelName === 'gemini-3-pro-preview' || modelName.includes('thinking')) {
      tools = [{ googleSearch: {} }];
      thinkingConfig = { thinkingBudget: 4096 }; // Conservative budget to prevent timeouts
    } else if (modelName === 'gemini-3-flash-preview') {
       // Gemini 3 Flash supports thinking too in many contexts, but let's be safe or set 0 if needed.
       // For now, only setting budget for explicitly "Thinking" or "Pro" models to save quota.
       thinkingConfig = { thinkingBudget: 2048 };
    }

    // 2. Loop through each module sequentially
    let cumulativeId = 1;

    for (const module of MODULES) {
      // RATE LIMIT COOLING: Pause between modules to avoid hitting RPM limits
      if (module.id > 1) {
         const coolingTime = 4000;
         onLog({ type: 'thought', message: `Cooling down for rate limits (${coolingTime/1000}s)...`, timestamp: new Date() });
         await delay(coolingTime);
      }

      onLog({ type: 'process', message: `>>> [SEQUENTIAL PROTOCOL] ACTIVATING MODULE: ${module.title}`, timestamp: new Date() });
      
      const specificInstructions = MODULE_INSTRUCTIONS[module.title] || "";

      const modulePrompt = `
        You are the "Auto-BOQ Architect", an advanced Quantity Surveying AI.
        
        ACTIVATE: Sequential Analysis Protocol.
        CURRENT TARGET: Analyze ONLY the category: "${module.title}" (${module.arabicTitle}).
        IGNORE all other categories for this specific step.

        FILES CONTEXT:
        - Structural Drawings (S): Priorities for Concrete, Steel, Foundations.
        - Architectural Drawings (A): Priorities for Finishes, Masonry, Openings.

        SPECIFIC INSTRUCTIONS FOR THIS PHASE:
        ${specificInstructions}

        GLOBAL REQUIREMENTS:
        1. **Mathematical Traceability**: Every item MUST have a "calculation_breakdown" showing the formula (e.g., "Count(5) * L(2) * W(1)").
        2. **Start Item IDs** at: ${cumulativeId}.
        3. **Language**: Internal logic in English, Output Description/Category in ARABIC.

        OUTPUT FORMAT (JSON):
        {
          "items": [
            {
              "id": number,
              "category": "${module.arabicTitle}",
              "description": "Arabic Description including location",
              "unit": "m3/m2/m/No/Item",
              "count": number,
              "dimensions": { "l": number, "w": number, "h": number },
              "deduction": number,
              "total": number,
              "remarks": "Notes on source file or discrepancies (e.g. 'S-01 prioritized')",
              "confidence": { "overall": 0.95, "count_accuracy": 0.95, "dimension_extraction": 0.95 },
              "calculation_breakdown": "Formula string",
              "source_file": "Sheet Name"
            }
          ]
        }
      `;

      let responseText = "";
      
      // EXPONENTIAL BACKOFF RETRY LOGIC
      const maxRetries = 3;
      let attempt = 0;
      let success = false;

      while (attempt < maxRetries && !success) {
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: {
              role: 'user',
              parts: [...fileParts, { text: modulePrompt }]
            },
            config: {
              thinkingConfig,
              tools: tools.length > 0 ? tools : undefined,
              responseMimeType: 'application/json' 
            }
          });
  
          // CORRECT API USAGE: Get text directly from the result object (GenerateContentResponse)
          // Do not call result.response.text() which causes "undefined" errors
          responseText = result.text || "";
          success = true;

        } catch (err: any) {
          attempt++;
          const isRateLimit = err.status === 429 || err.code === 429 || err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
          
          if (isRateLimit && attempt < maxRetries) {
             const waitTime = Math.pow(2, attempt) * 4000; // 4s, 8s, 16s
             onLog({ type: 'error', message: `Rate limit hit (429). Retrying in ${waitTime/1000}s...`, timestamp: new Date() });
             await delay(waitTime);
          } else if (attempt >= maxRetries) {
             console.error(`Error processing module ${module.title} after retries:`, err);
             onLog({ type: 'error', message: `Failed to process ${module.title} after multiple attempts. Skipping...`, timestamp: new Date() });
             break; 
          } else {
             // Non-rate-limit error, log and maybe retry once
             console.warn(`Error on attempt ${attempt}:`, err);
             await delay(2000);
          }
        }
      }

      if (success && responseText) {
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            onLog({ type: 'success', message: `Analysis Complete for ${module.title}: Extracted ${parsed.items.length} items.`, timestamp: new Date() });
            onModuleComplete(module.id, parsed.items);
            cumulativeId += parsed.items.length;
          } else {
             onLog({ type: 'thought', message: `No items found relevant to ${module.title}.`, timestamp: new Date() });
             onModuleComplete(module.id, []);
          }
        } catch (parseErr) {
           console.error("JSON Parse Error", parseErr);
           onLog({ type: 'error', message: `Failed to parse AI response for ${module.title}.`, timestamp: new Date() });
           onModuleComplete(module.id, []);
        }
      } else {
        // Failed completely
        onModuleComplete(module.id, []);
      }
    }
    
    onLog({ type: 'success', message: 'PROTOCOL COMPLETE: All modules processed successfully.', timestamp: new Date() });

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    onLog({ type: 'error', message: 'Critical System Failure.', timestamp: new Date() });
  }
};

export const createChatSession = (modelName: string): Chat => {
  return ai.chats.create({
    model: modelName,
    config: {
      systemInstruction: "أنت مساعد ذكي لمهندس الكميات. قم بالرد باللغة العربية. إذا طلب المستخدم تعديل قيمة، قم بإعادة الحساب وإرجاع JSON يحتوي على التعديلات.",
    },
  });
};

export const handleChatMessage = async (
  chat: Chat, 
  userMessage: string, 
  currentData: BOQItem[]
): Promise<{ responseText: string; updatedData?: BOQItem[] }> => {
  try {
    const contextPrompt = `
      Current BOQ Data: ${JSON.stringify(currentData.map(i => ({
        id: i.id, 
        desc: i.description, 
        total: i.total,
        calc: i.calculation_breakdown
      })))}
      
      User Request: "${userMessage}"
      
      Return JSON with 'response' and optional 'modifications' array.
    `;

    const response = await chat.sendMessage({ message: contextPrompt });
    
    // Correct API Usage: response.text is a property, not a method
    let text = response.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      if (text.startsWith('{')) {
        const json = JSON.parse(text);
        if (json.modifications && Array.isArray(json.modifications)) {
          let newData = [...currentData];
          json.modifications.forEach((mod: any) => {
            if (mod.action === 'delete') {
              newData = newData.filter(item => item.id !== mod.id);
            } else if (mod.id && mod.field) {
              const index = newData.findIndex(item => item.id === mod.id);
              if (index !== -1) {
                if (mod.field === 'dimensions' && typeof mod.value === 'object') {
                   newData[index] = { 
                     ...newData[index], 
                     dimensions: { ...newData[index].dimensions, ...mod.value } 
                   };
                } else {
                   newData[index] = { ...newData[index], [mod.field]: mod.value };
                }
              }
            }
          });
          return { responseText: json.response, updatedData: newData };
        }
        return { responseText: json.response || text };
      }
    } catch (e) {
      // Not JSON
    }
    return { responseText: text };
  } catch (error) {
    console.error("Chat Error:", error);
    return { responseText: "Error processing request." };
  }
};
