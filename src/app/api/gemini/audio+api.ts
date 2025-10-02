import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.0-flash-001';

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function POST(request: Request) {
  try {
    // Ensure API is configured
    if (!genAI || !API_KEY) {
      return Response.json(
        { error: 'Gemini API не ініціалізовано. Перевірте налаштування сервера.' },
        { status: 500 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { audioData, prompt = '' } = body;

    if (!audioData) {
      return Response.json(
        { error: 'Неправильний формат запиту. Очікуються аудіо дані.' },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const parts = [
      { text: 'поверни мені наступне повідомлення дослівно' },
      {
        inlineData: {
          data: audioData,
          mimeType: 'audio/webm',
        },
      },
    ];

    if (prompt) {
      parts.push({ text: prompt });
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const response = await result.response;
    const text = response.text();

    return Response.json({
      text: text || '',
      response: result,
    });
  } catch (error) {
    console.error('Помилка відправки аудіо на Gemini API:', error);
    return Response.json(
      {
        error: 'Помилка при обробці аудіо через Gemini API',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
