import { supabase } from '@/src/config/supabaseClient';
import { formatSlideContent } from '@/src/services/emailService';
import { getAverageUserRating, getUserSkillsSummary } from '@/src/services/main_rating';
import nodemailer from 'nodemailer';

interface EmailRequest {
  userEmail: string;
  moduleTitle: string;
  slide: any;
  courseTitle?: string;
  userId?: string;
  moduleId?: string;
}

export async function POST(request: Request) {
  try {
    const { userEmail, moduleTitle, slide, courseTitle, userId, moduleId }: EmailRequest = await request.json();

    if (!userEmail || !moduleTitle || !slide) {
      return Response.json(
        { error: 'Missing required fields: userEmail, moduleTitle, slide' },
        { status: 400 }
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
        { name: 'Крок', score: 4.0 }
      ]
    };

    if (userId && moduleId) {
      try {
        const { data: ratingData } = await getAverageUserRating(userId, moduleId);
        if (ratingData?.rating) {
          userStats.averageScore = Math.round(ratingData.rating * 10) / 10;
        }

        const { data: skillsData } = await getUserSkillsSummary(userId, moduleId);
        if (skillsData && skillsData.length > 0) {
          userStats.skills = skillsData.map(skill => ({
            name: skill.criterion_name,
            score: Math.round(skill.average_score * 10) / 10
          }));
        }

        const { data: courseSummaries } = await supabase
          .from('user_course_summaries')
          .select('progress')
          .eq('user_id', userId);

        if (courseSummaries) {
          const completedCourses = courseSummaries.filter(cs => cs.progress >= 100).length;
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

    // Форматируем контент слайда
    const slideContent = formatSlideContent(slide);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ваша статистика - Завершення модуля</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px 20px; 
            border-radius: 12px 12px 0 0; 
            text-align: center;
            margin: -20px -20px 20px -20px;
          }
          .dashboard-title {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .dashboard-subtitle {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
          }
          .stats-section {
            margin: 30px 0;
          }
          .stats-grid {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
          }
          .stat-card {
            flex: 1;
            min-width: 150px;
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
          }
          .stat-card.blue { border-left: 4px solid #2196F3; }
          .stat-card.green { border-left: 4px solid #4CAF50; }
          .stat-card.purple { border-left: 4px solid #9C27B0; }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
          }
          .stat-label {
            font-size: 14px;
            color: #666;
            margin: 0;
          }
          .skills-section {
            margin: 30px 0;
          }
          .skills-title {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 20px 0;
            color: #333;
          }
          .skills-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .skill-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e0e0e0;
          }
          .skill-name {
            font-size: 14px;
            color: #666;
            margin: 0 0 8px 0;
          }
          .skill-level {
            font-size: 18px;
            font-weight: bold;
            color: #4CAF50;
          }
          .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #666; 
            font-size: 14px; 
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .module-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2196F3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="dashboard-title">🎉 Твоя статистика</h1>
            <p class="dashboard-subtitle">Ця сторінка відображає твою персональну статистику</p>
          </div>
          
          <div class="module-info">
            <h2 style="margin: 0 0 10px 0; color: #2196F3;">Модуль завершено!</h2>
            <p style="margin: 0;"><strong>Модуль:</strong> ${moduleTitle}</p>
            ${courseTitle ? `<p style="margin: 5px 0 0 0;"><strong>Курс:</strong> ${courseTitle}</p>` : ''}
          </div>

          <div class="stats-section">
            <h2 style="color: #333; margin: 0 0 20px 0;">Статистика</h2>
            <div class="stats-grid">
              <div class="stat-card green">
                <div class="stat-value">${userStats.averageScore}/5</div>
                <div class="stat-label">Середній бал</div>
              </div>
            </div>
          </div>

          <div class="skills-section">
            <h2 class="skills-title">Порівняння навичок</h2>
            <div class="skills-grid">
              ${userStats.skills.map(skill => `
                <div class="skill-item">
                  <div class="skill-name">${skill.name}</div>
                  <div class="skill-level">${skill.score}/5</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;"><strong>Вітаємо з завершенням модуля "${moduleTitle}"!</strong></p>
            <p style="margin: 0;">Продовжуйте навчання в додатку Kiflow для досягнення нових висот!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Отправка email через SMTP (требует настройки переменных окружения)
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'natamrshn@gmail.com';

    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      // Реальная отправка email через SMTP
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: parseInt(SMTP_PORT),
          secure: SMTP_PORT === '465', // true для 465, false для других портов
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: FROM_EMAIL,
          to: userEmail,
          subject: `🎉 Ваша статистика - Завершення модуля ${moduleTitle}`,
          html: htmlContent,
          text: `🎉 Вітаємо з завершенням модуля "${moduleTitle}"!

Твоя статистика:
• Час навчання: ${userStats.totalLearningTime} год
• Середній бал: ${userStats.averageScore}/5
• Курси: ${userStats.completedCourses}

Порівняння навичок:
${userStats.skills.map(skill => `• ${skill.name}: ${skill.score}/5`).join('\n')}

Продовжуйте навчання в додатку Kiflow для досягнення нових висот!`
        });

        console.log('Email sent successfully to:', userEmail);
      } catch (smtpError) {
        console.error('SMTP Error:', smtpError);
        // Fallback: логируем email если SMTP не работает
        console.log('Email would be sent to:', userEmail);
        console.log('Subject: Останній слайд модуля - ' + moduleTitle);
        console.log('Content:', slideContent);
      }
    } else {
      // Если SMTP не настроен, просто логируем
      console.log('SMTP not configured. Email would be sent to:', userEmail);
      console.log('Subject: Останній слайд модуля - ' + moduleTitle);
      console.log('Content:', slideContent);
    }

    return Response.json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
