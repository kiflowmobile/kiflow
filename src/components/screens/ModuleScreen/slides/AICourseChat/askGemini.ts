import { Message } from '@/src/constants/types/ai_chat';
import { buildPrompt } from './buildPrompt';
import { getCompanyById } from '@/src/services/company';
import { jsonrepair } from 'jsonrepair';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface GeminiResponse {
  content: string;
  rating: any | null;
  criterias: string;
}

export async function askGemini(
  messages: Message[],
  slidePrompt: string,
  isFirstMessage: boolean,
  criteriasText: string,
  model: string = 'gemini-2.0-flash',
  companyId?: string,
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY не налаштований');
    return {
      content: '⚠️ Помилка: відсутній API ключ.',
      rating: null,
      criterias: criteriasText, // завжди передаємо
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const lastUserMessage = messages.filter((m) => m.role === 'user').slice(-1)[0];

  // Если передан companyId, пробуем загрузить standards и безопасно распарсить их
  let companyStandards: any = undefined;
  if (companyId) {
    try {
      const { data: companyData, error: companyError } = await getCompanyById(companyId);
      if (companyError) console.warn('Warning: getCompanyById error', companyError);
      const raw = companyData?.service_standards;
      if (raw) {
        try {
          companyStandards = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          // Попробуем отремонтировать некорректный JSON
          try {
            const repaired = jsonrepair(typeof raw === 'string' ? raw : JSON.stringify(raw));
            companyStandards = JSON.parse(repaired);
            console.log('askGemini: repaired companyStandards JSON');
          } catch {
            console.warn('askGemini: failed to parse or repair companyStandards');
            // В крайнем случае передадим raw (строку или объект) — buildPrompt обработает
            companyStandards = raw;
          }
        }
      }
    } catch (err) {
      console.warn('Warning: failed to fetch company by id', err);
    }
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: buildPrompt(
              slidePrompt,
              isFirstMessage,
              lastUserMessage,
              criteriasText,
              companyStandards,
            ),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 10000,
    },
  };

  try {
    console.log('askGemini: companyStandards:', companyStandards);
  } catch (err) {
    console.warn('askGemini: failed to log prompt preview', err);
  }

  try {
    const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    rawText = rawText.replace(/```json|```/g, '').trim();

    if (!rawText.startsWith('{')) {
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start !== -1 && end !== -1) rawText = rawText.slice(start, end + 1);
    }

    let parsed: GeminiResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      console.warn('⚠️ JSON parse error, trying to repair:', err);
      try {
        const repairedJson = jsonrepair(rawText);
        parsed = JSON.parse(repairedJson);
        console.log('✅ JSON successfully repaired');
      } catch (repairErr) {
        console.error('❌ JSON repair failed:', repairErr, rawText);
        parsed = { content: rawText, rating: null, criterias: criteriasText };
      }
    }

    if (!parsed.criterias) parsed.criterias = criteriasText;

    return parsed;
  } catch (err) {
    console.error('Gemini API error', err);
    return {
      content: '⚠️ Сталася помилка при отриманні відповіді від AI.',
      rating: null,
      criterias: criteriasText,
    };
  }
}
