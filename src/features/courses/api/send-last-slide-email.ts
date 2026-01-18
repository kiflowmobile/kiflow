import nodemailer from 'nodemailer';
import { ratingsApi } from '@/features/statistics';
import { dedupeSkills, escapeHtml, normalizeScore, type Skill } from '../utils/email-utils';

export interface ClientSkill {
  criterion_id?: string;
  criterion_key?: string;
  criterion_name?: string;
  average_score?: number;
  score?: number;
}

export interface EmailRequest {
  userEmail: string;
  moduleTitle: string;
  slide: unknown;
  courseTitle?: string;
  userId?: string;
  moduleId?: string;
  extraRecipients?: string[] | string;
  debug?: boolean;
  userName?: string;
  quizScore?: number;

  // данные только с клиента
  averageScore?: number;
  skills?: ClientSkill[];
}

interface UserStats {
  averageScore?: number;
  skills?: Skill[];
}

export async function POST(request: Request) {
  try {
    const {
      userEmail,
      userName,
      moduleTitle,
      slide,
      courseTitle,
      userId,
      moduleId,
      extraRecipients,
      debug,
      averageScore,
      skills,
      quizScore,
    }: EmailRequest = await request.json();

    if (!userEmail || !moduleTitle || !slide) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userEmail, moduleTitle, slide' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const userStats: UserStats = {
      averageScore: normalizeScore(averageScore),
    };

    if (Array.isArray(skills) && skills.length > 0) {
      userStats.skills = skills
        .map((skill) => {
          const key = skill.criterion_key ?? skill.criterion_id ?? undefined;
          const name =
            skill.criterion_name ?? skill.criterion_id ?? skill.criterion_key ?? 'Без названия';

          let score = 0;
          if (typeof skill.average_score === 'number') {
            score = skill.average_score;
          } else if (typeof skill.score === 'number') {
            score = skill.score;
          }

          const normalizedScore = normalizeScore(score);
          if (normalizedScore === undefined) return null;

          return {
            name,
            key,
            score: normalizedScore,
            individualScores: undefined,
          } as Skill;
        })
        .filter((s): s is Skill => s !== null);
    }

    // Calculate average from skills if not provided
    if (
      (userStats.averageScore === undefined || Number.isNaN(userStats.averageScore)) &&
      userStats.skills &&
      userStats.skills.length > 0
    ) {
      const sum = userStats.skills.reduce((acc, s) => acc + (s.score ?? 0), 0);
      const avg = sum / userStats.skills.length;
      userStats.averageScore = normalizeScore(avg);
    }

    // Deduplicate skills
    if (userStats.skills && userStats.skills.length > 0) {
      userStats.skills = dedupeSkills(userStats.skills);
    }

    // Fetch criteria names from database
    if (userStats.skills && userStats.skills.length > 0) {
      try {
        const keys = Array.from(
          new Set(userStats.skills.map((s) => s.key).filter((k): k is string => Boolean(k)))
        );
        if (keys.length > 0) {
          const { data: criterias, error: criteriasError } = await ratingsApi.fetchCriteriaByKeys(
            keys
          );
          if (!criteriasError && criterias && Array.isArray(criterias) && criterias.length > 0) {
            const nameByKey = new Map<string, string>();
            criterias.forEach((c) => {
              if (c?.key) {
                nameByKey.set(c.key, c.name ?? c.key);
              }
            });

            userStats.skills = userStats.skills.map((s) => {
              if (s.key && nameByKey.has(s.key)) {
                return { ...s, name: nameByKey.get(s.key) ?? s.name };
              }
              return s;
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch criteria names:', error);
      }
    }

    // Отправка email через SMTP
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'natamrshn@gmail.com';

    // Статичный e-mail, куда ВСЕГДА дублируем письмо (ты)
    const STATIC_COMPLETION_EMAIL = 'Deregaroman@gmail.com';

    const EXTRA_COMPLETION_EMAILS = (process.env.MODULE_COMPLETION_EXTRA_EMAILS || '')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean);

    const payloadExtraEmails = Array.isArray(extraRecipients)
      ? extraRecipients
      : extraRecipients
        ? [extraRecipients]
        : [];

    const userPlainText: string[] = [];

    if (typeof userName === 'string' && userName.trim().length > 0) {
      userPlainText.push(`Вітаємо, ${userName}!`);
    }

    userPlainText.push(`Ви завершили модуль: в курсі ${courseTitle}`);
    userPlainText.push('');
    userPlainText.push('1) Середній бал:');
    userPlainText.push(
      userStats.averageScore != null
        ? `• ${userStats.averageScore}/5`
        : '• Середній бал ще не розрахований',
    );
    userPlainText.push('');
    userPlainText.push('2) Розподіл за навичками:');

    if (userStats.skills && userStats.skills.length > 0) {
      for (const skill of userStats.skills) {
        const base = `• ${skill.name}: ${skill.score}/5`;
        if (skill.individualScores && skill.individualScores.length > 0) {
          userPlainText.push(base + ` (Оцінки: ${skill.individualScores.join(', ')})`);
        } else {
          userPlainText.push(base);
        }
      }
    } else {
      userPlainText.push('Дані про навички відсутні.');
    }

    userPlainText.push('');
    userPlainText.push('3) Оцінка за квіз:');
    userPlainText.push(quizScore != null ? `• ${quizScore}/5` : '• Немає даних про квіз');
    userPlainText.push('');
    userPlainText.push('Дякуємо, команда Kiflow');

    const skillsHtml =
      userStats.skills && userStats.skills.length > 0
        ? `<ul>${userStats.skills
            .map((skill: Skill) => {
              const scores =
                skill.individualScores && skill.individualScores.length > 0
                  ? ` <small>(оцінки: ${skill.individualScores
                      .map((s) => escapeHtml(s))
                      .join(', ')})</small>`
                  : '';
              return `<li><strong>${escapeHtml(skill.name)}</strong>: ${escapeHtml(
                skill.score,
              )}/5${scores}</li>`;
            })
            .join('')}</ul>`
        : `<p>Дані про навички відсутні.</p>`;

    const userHtml = `
      <div style="font-family: -apple-system, Roboto, 'Segoe UI', Arial, sans-serif; color: #111; line-height:1.4;">
        <h2 style="color:#1f6feb;">${escapeHtml(
          userName ? `Вітаємо, ${userName}!` : 'Вітаємо!',
        )}</h2>

        <h3 style="margin-top:18px;">1) Середній бал</h3>
        <p style="font-size:16px;">${
          userStats.averageScore != null
            ? `<strong>${escapeHtml(userStats.averageScore)}/5</strong>`
            : 'Середній бал ще не розрахований'
        }</p>

        <h3 style="margin-top:12px;">2) Розподіл за навичками</h3>
        ${skillsHtml}

        <h3 style="margin-top:12px;">3) Оцінка за квіз</h3>
        <p style="font-size:16px;">${
          quizScore != null ? `<strong>${escapeHtml(quizScore)}/5</strong>` : 'Немає даних про квіз'
        }</p>

        <hr style="border:none; border-top:1px solid #eee; margin:18px 0;" />
        <p style="font-size:13px; color:#666;">Це автоматичне повідомлення від команди Kiflow.</p>
      </div>
    `;

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
          subject: `🎉 Ви завершили модуль`,
          text: userPlainText.join('\n'),
          html: userHtml,
        });

        // 2) Админская копия
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
            subject: `Копія — Статистика користувача`,
            text: `${userPlainText.join('\n')}

---
Адміністраторська копія. userEmail: ${userEmail}
userId: ${userId ?? 'n/a'}
moduleId: ${moduleId ?? 'n/a'}`,
            html: `
              <div style="font-family: -apple-system, Roboto, 'Segoe UI', Arial, sans-serif; color:#111;">
                <h3>Копія — Статистика користувача</h3>
                ${userHtml}
                <hr />
                <p style="font-size:12px; color:#666;">Адміністраторська копія. userEmail: ${escapeHtml(
                  userEmail,
                )}<br/>userId: ${escapeHtml(userId ?? 'n/a')}<br/>moduleId: ${escapeHtml(
              moduleId ?? 'n/a',
            )}</p>
              </div>
            `,
          });
        }
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }

    interface ResponseData {
      success: boolean;
      message: string;
      userId?: string | null;
      moduleId?: string | null;
      userStats?: UserStats;
      userName?: string | null;
      quizScore?: number | null;
    }

    const baseResponse: ResponseData = { success: true, message: 'Email sent successfully' };
    if (debug) {
      baseResponse.userId = userId ?? null;
      baseResponse.moduleId = moduleId ?? null;
      baseResponse.userStats = userStats;
      baseResponse.userName = userName ?? null;
      baseResponse.quizScore = quizScore ?? null;
    }

    return new Response(JSON.stringify(baseResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
