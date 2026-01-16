import { Message } from '@/src/constants/types/ai_chat';
import { buildPrompt } from './buildPrompt';
import { getCompanyById } from '@/src/services/company';
import { jsonrepair } from 'jsonrepair';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface GeminiResponse {
  content?: string;
  rating: {
    overall_score: number;
    criteriaScores: Record<string, number>;
    comment: string;
  } | null;
  criterias: string;
  model?: string; 
  usage?: {
    totalTokens?: number;
  }; 
}

interface AskGeminiContext {
  messages: Message[];
  slidePrompt: string; // The "system instruction" content
  isFirstMessage: boolean;
  criteriasText: string;
  companyId?: string;
  model?: string;
}

export async function askGemini(context: AskGeminiContext): Promise<GeminiResponse> {
  const { 
    messages, 
    slidePrompt, 
    isFirstMessage, 
    criteriasText, 
    companyId, 
    model = 'gemini-2.0-flash' 
  } = context;

  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY не налаштований');
    return {
      content: '⚠️ Помилка: відсутній API ключ.',
      rating: null,
      criterias: criteriasText,
      model,
      usage: { totalTokens: 0 },
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0];

  let companyStandards: any = undefined;
  // Note: Optimally this should be passed in ready-to-use, but keeping here for now if not refactored in caller
  if (companyId) {
    try {
      const { data: companyData, error: companyError } = await getCompanyById(companyId);
      if (!companyError && companyData?.service_standards) {
        const raw = companyData.service_standards;
        try {
          companyStandards = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
             // fallback
             companyStandards = raw;
        }
      }
    } catch(e) {
      console.warn('Failed to fetch company standards', e);
    }
  }

  const textPrompt = buildPrompt(
      slidePrompt,
      isFirstMessage,
      lastUserMessage,
      criteriasText,
      companyStandards,
  );

  const body: any = {
    contents: [
      {
        role: 'user',
        parts: [{ text: textPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 10000,
    },
  };

  // If it's NOT the first message (meaning we are grading), enforce JSON schema
  if (!isFirstMessage) {
    body.generationConfig.responseMimeType = "application/json";
    body.generationConfig.responseSchema = {
      type: "OBJECT",
      properties: {
        text: { type: "STRING", description: "Repeat of the student's answer or brief acknowledgement" },
        rating: {
          type: "OBJECT",
          properties: {
            overall_score: { type: "NUMBER", description: "Score from 0 to 5" },
            criteriaScores: { 
              type: "OBJECT", 
              description: "Map of criteria ID to score",
              // Note: Gemini schema for dynamic keys is effectively just OBJECT, 
              // specific property validation might be loose or require specific 'additionalProperties' if supported in this version.
              // For flash-2.0 we can often just leave it as OBJECT or list known keys if static. 
              // Since keys are dynamic IDs, we'll trust the model instruction to output key-value pairs.
            },
            comment: { type: "STRING", description: "Detailed feedback formatted with newlines" }
          },
          required: ["overall_score", "criteriaScores", "comment"]
        }
      },
      required: ["rating"]
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Gemini API Error ${response.status}: ${txt}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const totalTokens = data?.usageMetadata?.totalTokenCount || 0;

    let parsed: any = {};
    
    if (isFirstMessage) {
        // Just text response
        parsed = { content: rawText, rating: null };
    } else {
        // Should be JSON
        try {
            parsed = JSON.parse(rawText);
        } catch (e) {
            console.warn("Failed to parse JSON despite schema", rawText);
            // Fallback for safety, though schema should prevent this
            parsed = { content: rawText, rating: null };
        }
    }

    return {
      content: parsed.text || parsed.content, // 'text' from schema, 'content' from fallback
      rating: parsed.rating || null,
      criterias: criteriasText,
      model,
      usage: { totalTokens },
    };

  } catch (err) {
    console.error('Gemini API error', err);
    return {
      content: '⚠️ Сталася помилка при отриманні відповіді від AI.',
      rating: null,
      criterias: criteriasText,
      model,
      usage: { totalTokens: 0 },
    };
  }
}
