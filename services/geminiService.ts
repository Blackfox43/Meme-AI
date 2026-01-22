
import { GoogleGenAI, Type } from "@google/genai";
import { HumorStyle, AIResponse } from "../types";
import { HUMOR_STYLES_MAP } from "../constants";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  private async getBase64Data(input: string): Promise<{ data: string; mimeType: string }> {
    if (input.startsWith('data:')) {
      const [header, data] = input.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      return { data, mimeType };
    }

    try {
      const response = await fetch(input);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return { data: base64, mimeType: blob.type || 'image/jpeg' };
    } catch (error) {
      console.error("Failed to fetch image for AI analysis:", error);
      throw new Error("Could not process image data");
    }
  }

  async generateMemeCaption(
    imageBuffer: string,
    style: HumorStyle,
    context?: string
  ): Promise<AIResponse> {
    const ai = this.getClient();
    const styleDescription = HUMOR_STYLES_MAP[style];
    const prompt = `
      Analyze this image and generate a viral-style meme caption.
      Humor Style: ${style}.
      Description: ${styleDescription}.
      ${context ? `User idea/context: ${context}` : ''}
      Generate "topText" and "bottomText". 
      Be concise and funny. 
      Return ONLY valid JSON.
    `;

    try {
      const { data, mimeType } = await this.getBase64Data(imageBuffer);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data, mimeType } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topText: { type: Type.STRING },
              bottomText: { type: Type.STRING }
            },
            required: ["topText", "bottomText"]
          }
        }
      });

      return JSON.parse(response.text || '{"topText": "", "bottomText": ""}');
    } catch (error) {
      console.error("Caption Error:", error);
      return { topText: "AI is silent", bottomText: "Type something!" };
    }
  }

  async generateBaseImage(prompt: string): Promise<string | null> {
    const ai = this.getClient();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `A cinematic meme base image: ${prompt}` }] },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) {
      console.error("Image Generation Error:", error);
      return null;
    }
  }

  async suggestRemix(originalMemeText: string, humorStyle: HumorStyle): Promise<AIResponse> {
    const ai = this.getClient();
    const prompt = `Suggest a funny meme remix for this idea: "${originalMemeText}". Humor Style: ${humorStyle}. Return JSON with topText and bottomText.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topText: { type: Type.STRING },
              bottomText: { type: Type.STRING }
            },
            required: ["topText", "bottomText"]
          }
        }
      });
      return JSON.parse(response.text || '{"topText": "", "bottomText": ""}');
    } catch (error) {
      return { topText: "Remix Failed", bottomText: "Try again!" };
    }
  }
}

export const geminiService = new GeminiService();
