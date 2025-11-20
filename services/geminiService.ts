import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export interface GeminiAnalysisResult {
  foodItems: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes: string;
    confidenceRating: number;
  }[];
  totalCalories: number;
}

export const analyzeFoodImage = async (base64Image: string, promptText?: string): Promise<GeminiAnalysisResult> => {
  const model = "gemini-2.5-flash";
  
  const prompt = `
    Analyze the provided image of food. 
    Identify all distinct food items visible. 
    Estimate the portion sizes and calculate the nutritional content (Calories, Protein, Carbs, Fat) for each item.
    
    ${promptText ? `Additional user context: "${promptText}"` : ''}
    
    Be precise with nutritional estimates. 
    Return a structured JSON response where 'notes' contains a brief description of the item and portion.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG, but works for PNG usually
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the food item" },
                  calories: { type: Type.NUMBER, description: "Estimated calories" },
                  protein: { type: Type.NUMBER, description: "Protein in grams" },
                  carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
                  fat: { type: Type.NUMBER, description: "Fat in grams" },
                  notes: { type: Type.STRING, description: "Brief notes about portion size or ingredients" },
                  confidenceRating: { type: Type.NUMBER, description: "Confidence score 0-1" }
                },
                required: ["name", "calories", "protein", "carbs", "fat", "notes"]
              }
            },
            totalCalories: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GeminiAnalysisResult;
    } else {
      throw new Error("No response text generated");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const analyzeFoodText = async (text: string): Promise<GeminiAnalysisResult> => {
    const model = "gemini-2.5-flash";
    
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: `Analyze this food description: "${text}". Estimate nutrition. Return JSON with notes.` }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    notes: { type: Type.STRING },
                    confidenceRating: { type: Type.NUMBER }
                  },
                  required: ["name", "calories", "protein", "carbs", "fat", "notes"]
                }
              },
              totalCalories: { type: Type.NUMBER }
            }
          }
        }
      });
  
      if (response.text) {
        return JSON.parse(response.text) as GeminiAnalysisResult;
      } else {
        throw new Error("No response text generated");
      }
    } catch (error) {
      console.error("Gemini Text Analysis Error:", error);
      throw error;
    }
  };