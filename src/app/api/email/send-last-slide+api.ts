import nodemailer from 'nodemailer';
import { formatSlideContent } from '@/src/services/emailService';

interface ClientSkill {
  criterion_id?: string;
  criterion_key?: string;
  criterion_name?: string;
  average_score?: number;
  score?: number;
}

interface EmailRequest {
  userEmail: string;
  moduleTitle: string;
  slide: any;
  courseTitle?: string;
  userId?: string;
  moduleId?: string;
  extraRecipients?: string[] | string;
  debug?: boolean;

  // данные только с клиента
  averageScore?: number;
  skills?: ClientSkill[];
}

// 🔹 утилита для удаления дубликатов критериев
function dedupeSkills(
  skills: {
    name: string;
    key?: string;
    score: number;
    individualScores?: (number | string)[];
  }[],
) {
  const seen = new Set<string>();
  const result: typeof skills = [];

  for (const skill of skills) {
    const id = (skill.key || skill.name || '').toString().trim().toLowerCase();

    if (!id) {
      result.push(skill);
      continue;
    }

    if (seen.has(id)) {
      continue; // дубликат — пропускаем
    }

    seen.add(id);
    result.push(skill);
  }

  return result;
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
      debug,
      averageScore,
      skills,
    }: EmailRequest = await request.json();

    console.log('[module-completion] Incoming request body (client-only stats):', {
      userEmail,
      moduleTitle,
      courseTitle,
      userId,
      moduleId,
      extraRecipients,
      debug,
      hasSlide: !!slide,
      averageScore,
      skillsFromClientCount: Array.isArray(skills) ? skills.length : 0,
    });

    if (!userEmail || !moduleTitle || !slide) {
      console.warn('[module-completion] Missing required fields', {
        userEmail,
        moduleTitle,
        hasSlide: !!slide,
      });

      return new Response(
        JSON.stringify({ error: 'Missing required fields: userEmail, moduleTitle, slide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Статистика пользователя — ТОЛЬКО из клиента
    let userStats: {
      averageScore?: number;
      skills?: {
        name: string;
        key?: string;
        score: number;
        individualScores?: (number | string)[];
      }[];
    } = {};

    // 1) Средний балл из клиента
    if (typeof averageScore === 'number' && Number.isFinite(averageScore)) {
      userStats.averageScore = Math.round(averageScore * 10) / 10;
      console.log('[module-completion] Using averageScore from client:', userStats.averageScore);
    }

    // 2) Навыки из клиента
    if (Array.isArray(skills) && skills.length > 0) {
      userStats.skills = skills.map((skill) => {
        const key = skill.criterion_key ?? skill.criterion_id ?? undefined;
        const name =
          skill.criterion_name ?? skill.criterion_id ?? skill.criterion_key ?? 'Без названия';

        let s = 0;
        if (typeof skill.average_score === 'number') s = skill.average_score;
        else if (typeof skill.score === 'number') s = skill.score;

        const normalizedScore = Math.round(s * 10) / 10;

        return {
          name,
          key,
          score: normalizedScore,
          individualScores: undefined, // только если когда-то решим их прислать
        };
      });

      console.log('[module-completion] Using skills from client. Count:', userStats.skills.length);
    }

    // 3) Если среднего балла нет, но есть навыки — считаем среднее по ним
    if (
      (userStats.averageScore === undefined || Number.isNaN(userStats.averageScore)) &&
      userStats.skills &&
      userStats.skills.length > 0
    ) {
      const sum = userStats.skills.reduce((acc, s) => acc + (s.score ?? 0), 0);
      const avg = sum / userStats.skills.length;
      userStats.averageScore = Math.round(avg * 10) / 10;
      console.log(
        '[module-completion] Computed averageScore from client skills:',
        userStats.averageScore,
      );
    }

    // 🔹 удаляем дубликаты критериев, если они есть
    if (userStats.skills && userStats.skills.length > 0) {
      const before = userStats.skills.length;
      userStats.skills = dedupeSkills(userStats.skills);
      const after = userStats.skills.length;
      console.log('[module-completion] Dedupe skills: before =', before, 'after =', after);
    }

    console.log('[module-completion] Final userStats before email (client-only):', userStats);

    // Форматируем контент слайда (пока используем только в логах)
    const slideContent = formatSlideContent(slide);
    console.log('[module-completion] Slide content (formatted, for debug only):', slideContent);

    // Отправка email через SMTP
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'natamrshn@gmail.com';

    console.log('[module-completion] SMTP env summary:', {
      hasHost: !!SMTP_HOST,
      port: SMTP_PORT,
      hasUser: !!SMTP_USER,
      hasPass: !!SMTP_PASS,
      fromEmail: FROM_EMAIL,
    });

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

    console.log('[module-completion] Extra emails summary:', {
      EXTRA_COMPLETION_EMAILS,
      payloadExtraEmails,
    });

    // Формируем письмо — средний балл + разбивка по характеристикам
    const emailText = `Здравствуйте!

Поздравляем с завершением модуля "${moduleTitle}"${courseTitle ? ` (курс "${courseTitle}")` : ''}.

1) Средний балл:
${
  userStats.averageScore != null
    ? `• ${userStats.averageScore}/5`
    : '• Средний балл ещё не рассчитан'
}

2) Разбивка по характеристикам:
${
  userStats.skills && userStats.skills.length > 0
    ? userStats.skills
        .map((skill: any) => {
          const base = `• ${skill.name}: ${skill.score}/5`;
          if (skill.individualScores && skill.individualScores.length > 0) {
            return base + ` (Оценки: ${skill.individualScores.join(', ')})`;
          }
          return base;
        })
        .join('\n')
    : 'Данные по характеристикам отсутствуют.'
}

Спасибо, команда Kiflow.`;

    console.log('[module-completion] Final emailText preview:', emailText);

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

        console.log('[module-completion] Transporter created, sending user email to:', userEmail);

        // 1) Письмо пользователю
        await transporter.sendMail({
          from: FROM_EMAIL,
          to: userEmail,
          subject: `🎉 Ваша статистика - Завершення модуля ${moduleTitle}`,
          text: emailText,
        });
        console.log('Email sent successfully to user:', userEmail);

        // 2) Админская копия
        const adminRecipientsList = [
          STATIC_COMPLETION_EMAIL,
          ...EXTRA_COMPLETION_EMAILS,
          ...payloadExtraEmails,
        ]
          .map((email) => email?.trim())
          .filter(Boolean);

        const uniqueAdminRecipients = Array.from(new Set(adminRecipientsList));
        console.log('[module-completion] Admin recipients (unique):', uniqueAdminRecipients);

        if (uniqueAdminRecipients.length > 0) {
          const adminRecipientsString = uniqueAdminRecipients.join(', ');

          console.log('[module-completion] Sending admin copy to:', adminRecipientsString);

          await transporter.sendMail({
            from: FROM_EMAIL,
            to: adminRecipientsString,
            subject: `Копия — статистика пользователя: ${moduleTitle}`,
            text: `${emailText}

---
Административная копия. userEmail: ${userEmail}
userId: ${userId ?? 'n/a'}
moduleId: ${moduleId ?? 'n/a'}`,
          });

          console.log('Admin copy email sent to:', uniqueAdminRecipients);
        } else {
          console.log('[module-completion] No admin recipients after deduplication.');
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
      console.log('[module-completion] SMTP not configured, skipping real send. Debug info:');
      console.log('Email would be sent to user:', userEmail);
      console.log('Admin copy would be sent to:', [
        STATIC_COMPLETION_EMAIL,
        ...EXTRA_COMPLETION_EMAILS,
        ...payloadExtraEmails,
      ]);
      console.log('Subject: Останній слайд модуля - ' + moduleTitle);
      console.log('Content:', slideContent);
    }

    const baseResponse: any = { success: true, message: 'Email sent successfully' };
    if (debug) {
      baseResponse.userId = userId ?? null;
      baseResponse.moduleId = moduleId ?? null;
      baseResponse.userStats = userStats;

      console.log('[module-completion] Debug response payload (client-only):', baseResponse);
    }

    return new Response(JSON.stringify(baseResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending email (outer catch):', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
