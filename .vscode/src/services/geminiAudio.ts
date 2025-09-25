export interface GeminiResponse {
  text: string;
  response: any;
}

export interface GeminiErrorResponse {
  error: string;
  details?: string;
}

/**
 * Send audio data to Gemini API via the proxy endpoint
 */
export const sendAudioToGemini = async (
  audioBytes: Uint8Array,
  prompt: string = ''
): Promise<string> => {
  try {
    // Convert Uint8Array to base64
    let base64Audio: string;

    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      base64Audio = Buffer.from(audioBytes).toString('base64');
    } else {
      // Browser environment
      base64Audio = uint8ArrayToBase64(audioBytes);
    }

    const response = await fetch('/api/gemini/audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioData: base64Audio,
        prompt,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as GeminiErrorResponse;
      throw new Error(errorData.error || 'Помилка відправки аудіо на Gemini API');
    }

    const data = (await response.json()) as GeminiResponse;
    return data.text;
  } catch (error) {
    console.error('Помилка відправки аудіо на Gemini API:', error);
    throw error;
  }
};

/**
 * Utility: Convert Uint8Array to base64 string in browser environment
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
