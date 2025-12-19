import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash-001';

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

function stripDataUrl(b64: string) {
  return b64.replace(/^data:.*;base64,/, '');
}

export async function POST(request: Request) {
  try {
    if (!genAI || !API_KEY) {
      return Response.json({ error: 'Gemini API не налаштовано.' }, { status: 500 });
    }

    const body = await request.json();
    const { audioData, mimeType = 'audio/webm', prompt = '', debug = false } = body ?? {};

    if (typeof audioData !== 'string') {
      return Response.json({ error: 'Очікується audioData (base64 string).' }, { status: 400 });
    }

    const base64 = stripDataUrl(audioData);

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const instruction = [
      'Ти сервіс транскрибації.',
      'Поверни ТІЛЬКИ дослівну транскрипцію аудіо.',
      'Не перекладай. Не виправляй. Не додавай пояснень.',
      'Нерозбірливе позначай як [inaudible].',
    ].join('\n');

    const parts: any[] = [{ text: instruction }, { inlineData: { data: base64, mimeType } }];

    if (prompt) parts.push({ text: `Контекст: ${prompt}` });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0, topP: 1 },
    });

    const text = result.response.text() ?? '';

    return Response.json(debug ? { text, mimeType } : { text });
  } catch (error) {
    return Response.json(
      {
        error: 'Помилка при обробці аудіо через Gemini API',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
