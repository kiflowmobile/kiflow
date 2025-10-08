import { Message } from "@/src/constants/types/ai_chat";
import { buildPrompt } from "./buildPrompt";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface GeminiResponse {
  content: string;
  rating: any | null;
  criterias:string
}

export async function askGemini(
  messages: Message[],
  slidePrompt: string,
  isFirstMessage: boolean,
  criteriasText: string,
  model: string = "gemini-2.0-flash"
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY не налаштований");
    return {
      content: "⚠️ Помилка: відсутній API ключ.",
      rating: null,
      criterias: criteriasText, // завжди передаємо
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const lastUserMessage = messages.filter((m) => m.role === "user").slice(-1)[0];

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(slidePrompt, isFirstMessage, lastUserMessage, criteriasText) }],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 800,
    },
  };

  try {
    const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    rawText = rawText.replace(/```json|```/g, "").trim();

    if (!rawText.startsWith("{")) {
      const start = rawText.indexOf("{");
      const end = rawText.lastIndexOf("}");
      if (start !== -1 && end !== -1) rawText = rawText.slice(start, end + 1);
    }

    let parsed: GeminiResponse;
    try {
      parsed = JSON.parse(rawText);

      if (!parsed.criterias) parsed.criterias = criteriasText;
    } catch (err) {
      console.error("❌ JSON parse error:", err, rawText);
      parsed = { content: rawText, rating: null, criterias: criteriasText };
    }

    return parsed;
  } catch (err) {
    console.error("Gemini API error", err);
    return {
      content: "⚠️ Сталася помилка при отриманні відповіді від AI.",
      rating: null,
      criterias: criteriasText, 
    };
  }
}
