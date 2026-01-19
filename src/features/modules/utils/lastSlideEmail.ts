import type { SkillItem } from './dedupeSkills';

export interface LastSlideEmailData {
  userId: string;
  userEmail: string;
  moduleId?: string;
  moduleTitle: string;
  courseTitle?: string;
  slide: Record<string, unknown>;
  averageScore?: number;
  skills?: SkillItem[];
  quizScore?: number;
  userName?: string;
}

export async function sendLastSlideEmail(
  emailData: LastSlideEmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/email/send-last-slide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
