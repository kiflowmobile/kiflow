import { Platform } from 'react-native';
import { Slide } from '../constants/types/slides';

interface SkillFromClient {
  criterion_id?: string;
  criterion_key?: string;
  criterion_name?: string;
  average_score?: number;
  score?: number;
}

interface EmailData {
  userEmail: string;
  moduleTitle: string;
  slide: Slide;
  courseTitle?: string;
  userId?: string;
  moduleId?: string;

  userName?: string;
  quizScore?: number;

  averageScore?: number;
  skills?: SkillFromClient[];
}

export const sendLastSlideEmail = async (
  emailData: EmailData,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const envBaseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      process.env.APP_API_BASE_URL ||
      '';

    const fallbackBaseUrl =
      Platform.OS === 'web'
        ? ''
        : process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://kiflow.vercel.app';

    const apiBase = envBaseUrl.trim() !== '' ? envBaseUrl : fallbackBaseUrl;

    const url =
      apiBase === ''
        ? '/api/email/send-last-slide'
        : `${apiBase.replace(/\/+$/g, '')}/api/email/send-last-slide`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...emailData, debug: true }),
    });

    if (!response.ok) {
      let errorText = 'Failed to send email';
      try {
        const errorData = await response.json();
        errorText = errorData.error || JSON.stringify(errorData);
      } catch {
        try {
          errorText = await response.text();
        } catch {}
      }
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const formatSlideContent = (slide: Slide): string => {
  let content = `# ${slide.slide_title}\n\n`;

  switch (slide.slide_type) {
    case 'text':
      content += slide.slide_data.content || '';
      break;

    case 'content':
      content += `## Основна ідея\n${slide.slide_data.mainPoint}\n\n`;
      if (slide.slide_data.tips?.length) {
        content += `## Поради\n${slide.slide_data.tips.map((tip) => `- ${tip}`).join('\n')}\n\n`;
      }
      if (slide.slide_data.example) {
        content += `## Приклад\n${slide.slide_data.example}`;
      }
      break;

    case 'quiz':
      content += `## Питання\n${slide.slide_data.question}\n\n`;
      content += `## Варіанти відповідей\n${slide.slide_data.options
        .map((option, index) => `${index + 1}. ${option}`)
        .join('\n')}`;
      break;

    case 'ai':
      content += `## Завдання для AI\n${slide.slide_data.prompt}`;
      break;

    case 'completion':
      content += `## ${slide.slide_data.subtitle}\n\n`;
      content += slide.slide_data.message;
      if (slide.slide_data.stats?.length) {
        content += `\n\n## Статистика\n`;
        slide.slide_data.stats.forEach((stat) => {
          content += `- **${stat.label}**: ${stat.value}\n`;
        });
      }
      break;

    case 'video':
      content += `## Відео\n[Відео контент: ${slide.slide_data.video?.uri || 'Mux video'}]`;
      break;

    case 'dashboard':
      content += `## Дашборд\n[Інтерактивний дашборд]`;
      break;

    default:
      content += `[Слайд типу: ${slide}]`;
  }

  return content;
};
