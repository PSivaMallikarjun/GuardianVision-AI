
import { GoogleGenAI, Type } from "@google/genai";

// Using gemini-3-flash-preview for high-performance multimodal analysis
const VISION_MODEL = 'gemini-3-flash-preview';

export class AIService {
  async analyzeCCTVFrame(base64Image: string, userLocation: { lat: number; lng: number }) {
    try {
      // API Key is automatically pulled from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: VISION_MODEL,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            {
              text: `You are a high-level Emergency Response & Insurance Nexus AI. 
              Current Event Coordinates: ${userLocation.lat}, ${userLocation.lng}.
              
              CRITICAL TASK: Analyze this CCTV frame for traffic incidents.
              An accident is defined as:
              - Visible collisions between vehicles.
              - Vehicles at unusual angles or off-road.
              - Deployment of airbags.
              - Vehicles stalled in high-traffic lanes with hazard lights or damage.
              - Debris on the road indicating a recent impact.
              - Pedestrian/cyclist collisions.

              BE VIGILANT: Even if damage appears minor, if it disrupts traffic or poses a safety risk, mark 'accidentDetected' as true.

              MISSION:
              1. Detect traffic accidents and assess severity.
              2. Identify license plates for insurance registration lookup.
              3. Perform medical triage: provide step-by-step first aid for bystanders.
              4. Dispatch Coordination: Identify the nearest hospital for ambulances and the nearest towing station.
              5. MAP DATA: Provide estimated coordinates (lat, lng) for the nearest hospital and towing station based on the event location.
              6. Insurance Assessment: Estimate immediate disbursement ($) based on visible vehicle damage.
              7. Driveability: Determine if the vehicle can limp to a service station or if it's immobile.
              
              Respond ONLY in valid JSON format matching the schema provided.`,
            },
          ],
        },
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accidentDetected: { type: Type.BOOLEAN },
              severity: { type: Type.STRING, enum: ["Minor", "Moderate", "Severe", "Critical"] },
              licensePlate: { type: Type.STRING },
              damageDetails: { type: Type.STRING },
              firstAidAdvice: { type: Type.STRING },
              driveability: { type: Type.STRING, enum: ["Driveable", "Restricted", "Immobile"] },
              estimatedPayout: { type: Type.NUMBER },
              nearestHospital: { type: Type.STRING },
              nearestHospitalCoords: {
                type: Type.OBJECT,
                properties: {
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                }
              },
              nearestTowing: { type: Type.STRING },
              nearestTowingCoords: {
                type: Type.OBJECT,
                properties: {
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                }
              },
              stakeholderNotifications: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["accidentDetected", "severity", "firstAidAdvice"]
          }
        }
      });

      if (!response.text) return null;
      
      const data = JSON.parse(response.text.trim());
      
      // Extract grounding links if available
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        data.groundingLinks = groundingChunks
          .filter((c: any) => c.web)
          .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
      }
      
      return data;
    } catch (error) {
      console.error("Gemini API Call Failed:", error);
      return null;
    }
  }
}

export const aiService = new AIService();
