import { Slide } from '../constants/types/slides';

interface EmailData {
  userEmail: string;
  moduleTitle: string;
  slide: Slide;
  courseTitle?: string;
  userId?: string;
  moduleId?: string;
}

export const sendLastSlideEmail = async (emailData: EmailData): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/email/send-last-slide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
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
      if (slide.slide_data.tips && slide.slide_data.tips.length > 0) {
        content += `## Поради\n${slide.slide_data.tips.map(tip => `- ${tip}`).join('\n')}\n\n`;
      }
      if (slide.slide_data.example) {
        content += `## Приклад\n${slide.slide_data.example}`;
      }
      break;
      
    case 'quiz':
      content += `## Питання\n${slide.slide_data.question}\n\n`;
      content += `## Варіанти відповідей\n${slide.slide_data.options.map((option, index) => `${index + 1}. ${option}`).join('\n')}`;
      break;
      
    case 'ai':
      content += `## Завдання для AI\n${slide.slide_data.prompt}`;
      break;
      
    case 'completion':
      content += `## ${slide.slide_data.subtitle}\n\n`;
      content += slide.slide_data.message;
      if (slide.slide_data.stats && slide.slide_data.stats.length > 0) {
        content += `\n\n## Статистика\n`;
        slide.slide_data.stats.forEach(stat => {
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
      content += `[Слайд типу: ${slide.slide_type}]`;
  }
  
  return content;
};
