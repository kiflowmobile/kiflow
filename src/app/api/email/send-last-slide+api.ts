import nodemailer from 'nodemailer';
import { supabase } from '@/src/config/supabaseClient';
import { formatSlideContent } from '@/src/services/emailService';
import { getAverageUserRating, getUserSkillsSummary } from '@/src/services/main_rating';

interface EmailRequest {
  userEmail: string;
  moduleTitle: string;
  slide: any;
  courseTitle?: string;
  userId?: string;
  moduleId?: string;
  extraRecipients?: string[] | string;
}

export async function POST(request: Request) {
  try {
    const {
      userEmail,
      moduleTitle,
      slide,
      courseTitle,
      userId,
      moduleId,
      extraRecipients,
    }: EmailRequest = await request.json();

    if (!userEmail || !moduleTitle || !slide) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userEmail, moduleTitle, slide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    let userStats = {
      totalLearningTime: 12,
      averageScore: 4.2,
      completedCourses: 5,
      skills: [
        { name: 'Фокус на допомозі клієнту', score: 4.5 },
        { name: 'Мова', score: 4.2 },
        { name: 'Мислення експерта', score: 3.8 },
        { name: 'Крок', score: 4.0 },
      ],
    };

    if (userId && moduleId) {
      try {
        const { data: ratingData } = await getAverageUserRating(userId, moduleId);
        if (ratingData?.rating) {
          userStats.averageScore = Math.round(ratingData.rating * 10) / 10;
        }

        const { data: skillsData } = await getUserSkillsSummary(userId, moduleId);
        if (skillsData && skillsData.length > 0) {
          userStats.skills = skillsData.map((skill) => ({
            name: skill.criterion_name,
            score: Math.round(skill.average_score * 10) / 10,
          }));
        }

        const { data: courseSummaries } = await supabase
          .from('user_course_summaries')
          .select('progress')
          .eq('user_id', userId);

        if (courseSummaries) {
          const completedCourses = courseSummaries.filter((cs) => cs.progress >= 100).length;
          userStats.completedCourses = completedCourses;

          // Примерная оценка времени обучения
          const totalProgress = courseSummaries.reduce((sum, cs) => sum + cs.progress, 0);
          const avgProgress = totalProgress / courseSummaries.length;
          userStats.totalLearningTime = Math.round((avgProgress / 20) * 10) / 10; // примерная формула
        }
      } catch (error) {
        console.warn('Failed to fetch user statistics, using defaults:', error);
      }
    }

    // Форматируем контент слайда (пока используем только в логах)
    const slideContent = formatSlideContent(slide);

    // Отправка email через SMTP (требует настройки переменных окружения)
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'natamrshn@gmail.com';

    // Статичный e-mail, куда ВСЕГДА дублируем письмо (ты)
    const STATIC_COMPLETION_EMAIL = 'natamrshn@gmail.com';

    // Дополнительные емейлы из env (через запятую)
    const EXTRA_COMPLETION_EMAILS = (process.env.MODULE_COMPLETION_EXTRA_EMAILS || '')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    // Дополнительные емейлы из payload
    const payloadExtraEmails = Array.isArray(extraRecipients)
      ? extraRecipients
      : extraRecipients
      ? [extraRecipients]
      : [];

    const emailText = `🎉 Вітаємо з завершенням модуля "${moduleTitle}"${
      courseTitle ? ` (курс "${courseTitle}")` : ''
    }!

Твоя статистика:
• Час навчання: ${userStats.totalLearningTime} год
• Середній бал: ${userStats.averageScore}/5
• Курси: ${userStats.completedCourses}

Порівняння навичок:
${userStats.skills.map((skill) => `• ${skill.name}: ${skill.score}/5`).join('\n')}

Продовжуйте навчання в додатку Kiflow для досягнення нових висот!`;

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: parseInt(SMTP_PORT),
          secure: SMTP_PORT === '465', 
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });

        // 1) Письмо пользователю
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: userEmail,
          subject: `🎉 Ваша статистика - Завершення модуля ${moduleTitle}`,
          text: emailText,
        });
        console.log('Email sent successfully to user:', userEmail);

        // 2) Отдельное письмо тебе + доп. адресам
        const adminRecipientsList = [
          STATIC_COMPLETION_EMAIL,
          ...EXTRA_COMPLETION_EMAILS,
          ...payloadExtraEmails,
        ]
          .map((email) => email?.trim())
          .filter(Boolean);

        const uniqueAdminRecipients = Array.from(new Set(adminRecipientsList));

        if (uniqueAdminRecipients.length > 0) {
          const adminRecipientsString = uniqueAdminRecipients.join(', ');

          await transporter.sendMail({
            from: FROM_EMAIL,
            to: adminRecipientsString,
            subject: `📋 Копія статистики користувача - Модуль ${moduleTitle}`,
            text:
              emailText +
              `

---
Це службова копія для адміністратора.
userEmail: ${userEmail}
userId: ${userId ?? 'n/a'}
moduleId: ${moduleId ?? 'n/a'}
`,
          });

          console.log('Admin copy email sent to:', uniqueAdminRecipients);
        }
      } catch (smtpError) {
        console.error('SMTP Error:', smtpError);
        // Fallback: логируем email если SMTP не работает
        console.log('Email would be sent to user:', userEmail);
        console.log('Admin copy would be sent to:', [
          STATIC_COMPLETION_EMAIL,
          ...EXTRA_COMPLETION_EMAILS,
          ...payloadExtraEmails,
        ]);
        console.log('Subject: Останній слайд модуля - ' + moduleTitle);
        console.log('Content:', slideContent);
      }
    } else {
      // Если SMTP не настроен, просто логируем
      console.log('SMTP not configured. Email would be sent to user:', userEmail);
      console.log('Admin copy would be sent to:', [
        STATIC_COMPLETION_EMAIL,
        ...EXTRA_COMPLETION_EMAILS,
        ...payloadExtraEmails,
      ]);
      console.log('Subject: Останній слайд модуля - ' + moduleTitle);
      console.log('Content:', slideContent);
    }

    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
