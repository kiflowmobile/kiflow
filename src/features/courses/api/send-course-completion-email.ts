import nodemailer from 'nodemailer';
import { ratingsApi } from '@/features/statistics';
import {
  dedupeSkills,
  escapeHtml,
  normalizeScore,
  type Skill,
  type ClientSkill,
} from '../utils/email-utils';

export type { ClientSkill } from '../utils/email-utils';

interface ModuleItem {
  moduleId: string;
  moduleTitle?: string;
  progress?: number;
  skills?: ClientSkill[];
}

export interface EmailRequest {
  userEmail: string;
  userName?: string;
  courseId?: string;
  courseTitle?: string;
  modules?: ModuleItem[];
  averageScore?: number;
  quizScore?: number;
  skills?: ClientSkill[];
  extraRecipients?: string[] | string;
  debug?: boolean;
}

interface NormalizedModule extends ModuleItem {
  skills?: ClientSkill[];
}

interface NormalizedGlobalSkills extends ClientSkill {
  average_score: number;
}

export async function POST(request: Request) {
  try {
    const {
      userEmail,
      userName,
      courseTitle,
      courseId,
      modules,
      averageScore,
      quizScore,
      skills,
      extraRecipients,
      debug,
    }: EmailRequest = await request.json();

    if (!userEmail || !courseId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userEmail or courseId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const FROM_EMAIL = process.env.FROM_EMAIL || 'natamrshn@gmail.com';
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    const STATIC_COMPLETION_EMAIL = 'natamrshn@gmail.com';

    const EXTRA_COMPLETION_EMAILS = (process.env.MODULE_COMPLETION_EXTRA_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const payloadExtraEmails = Array.isArray(extraRecipients)
      ? extraRecipients
      : extraRecipients
        ? [extraRecipients]
        : [];

    let normalizedModules = modules;
    if (Array.isArray(modules) && modules.length > 0) {
      normalizedModules = await Promise.all(
        modules.map(async (m) => {
          if (!Array.isArray(m.skills) || m.skills.length === 0) {
            return m;
          }

          const moduleSkills = m.skills.map((s) => {
            const key = s.criterion_key ?? s.criterion_id ?? undefined;
            const name = s.criterion_name ?? s.criterion_id ?? s.criterion_key ?? 'Без названия';

            let score = 0;
            if (typeof s.average_score === 'number') score = s.average_score;
            else if (typeof s.score === 'number') score = s.score;

            const normalizedScore = Math.round(score * 10) / 10;

            return {
              name,
              key,
              score: normalizedScore,
            };
          });

          const deduped = dedupeSkills(moduleSkills);

          try {
            const keys = Array.from(
              new Set(deduped.map((s) => s.key).filter((k): k is string => Boolean(k))),
            );
            if (keys.length > 0) {
              const { data: criterias, error: criteriasError } =
                await ratingsApi.fetchCriteriaByKeys(keys);
              if (
                !criteriasError &&
                criterias &&
                Array.isArray(criterias) &&
                criterias.length > 0
              ) {
                const nameByKey = new Map<string, string>();
                criterias.forEach((c) => {
                  if (c?.key) {
                    nameByKey.set(c.key, c.name ?? c.key);
                  }
                });

                const finalSkills = deduped.map((s) => {
                  if (s.key && nameByKey.has(s.key)) {
                    return { ...s, name: nameByKey.get(s.key) ?? s.name };
                  }
                  return s;
                });

                return {
                  ...m,
                  skills: finalSkills.map((s) => ({
                    criterion_id: s.key,
                    criterion_key: s.key,
                    criterion_name: s.name,
                    average_score: s.score,
                  })),
                } as NormalizedModule;
              }
            }
          } catch (e) {
            console.warn('Failed to fetch criterias for module', m.moduleId, e);
          }

          return {
            ...m,
            skills: deduped.map((s) => ({
              criterion_id: s.key,
              criterion_key: s.key,
              criterion_name: s.name,
              average_score: s.score,
            })),
          };
        }),
      );
    }

    let normalizedGlobalSkills = skills;
    if (Array.isArray(skills) && skills.length > 0) {
      const globalSkills = skills.map((s) => {
        const key = s.criterion_key ?? s.criterion_id ?? undefined;
        const name = s.criterion_name ?? s.criterion_id ?? s.criterion_key ?? 'Без названия';

        let score = 0;
        if (typeof s.average_score === 'number') score = s.average_score;
        else if (typeof s.score === 'number') score = s.score;

        const normalizedScore = Math.round(score * 10) / 10;

        return {
          name,
          key,
          score: normalizedScore,
        };
      });

      const deduped = dedupeSkills(globalSkills);

      try {
        const keys = Array.from(
          new Set(deduped.map((s) => s.key).filter((k): k is string => Boolean(k))),
        );
        if (keys.length > 0) {
          const { data: criterias, error: criteriasError } =
            await ratingsApi.fetchCriteriaByKeys(keys);
          if (!criteriasError && criterias && Array.isArray(criterias) && criterias.length > 0) {
            const nameByKey = new Map<string, string>();
            criterias.forEach((c) => {
              if (c?.key) {
                nameByKey.set(c.key, c.name ?? c.key);
              }
            });

            normalizedGlobalSkills = deduped.map((s) => ({
              criterion_id: s.key,
              criterion_key: s.key,
              criterion_name:
                (s.key && nameByKey.has(s.key) ? nameByKey.get(s.key)! : s.name) ?? '',
              average_score: s.score,
            })) as NormalizedGlobalSkills[];
          }
        }
      } catch (e) {
        console.warn('Failed to fetch criterias for global skills', e);
      }

      if (!normalizedGlobalSkills) {
        normalizedGlobalSkills = deduped.map((s) => ({
          criterion_id: s.key,
          criterion_key: s.key,
          criterion_name: s.name,
          average_score: s.score,
        }));
      }
    }

    let normalizedAverageScore = normalizeScore(averageScore);

    if (
      (normalizedAverageScore === undefined || Number.isNaN(normalizedAverageScore)) &&
      normalizedGlobalSkills &&
      normalizedGlobalSkills.length > 0
    ) {
      const sum = normalizedGlobalSkills.reduce(
        (acc, s) => acc + (s.average_score ?? s.score ?? 0),
        0,
      );
      const avg = sum / normalizedGlobalSkills.length;
      normalizedAverageScore = normalizeScore(avg);
    }

    const modulesHtml =
      Array.isArray(normalizedModules) && normalizedModules.length > 0
        ? normalizedModules
            .map((m, index) => {
              const title = `<strong>Модуль ${index + 1} — ${escapeHtml(
                m.moduleTitle || m.moduleId,
              )}</strong>`;

              const skillsList =
                Array.isArray(m.skills) && m.skills.length > 0
                  ? `<ul>${m.skills
                      .map(
                        (s) =>
                          `<li><strong>${escapeHtml(
                            s.criterion_name || s.criterion_key,
                          )}</strong>: ${escapeHtml(s.average_score ?? s.score ?? 0)}/5</li>`,
                      )
                      .join('')}</ul>`
                  : '<p>Дані про навички відсутні.</p>';

              return `<div>${title}${skillsList}</div>`;
            })
            .join('')
        : '<p>Дані про модулі відсутні.</p>';

    const skillsHtml =
      Array.isArray(normalizedGlobalSkills) && normalizedGlobalSkills.length > 0
        ? `<ul>${normalizedGlobalSkills
            .map(
              (s) =>
                `<li><strong>${escapeHtml(
                  s.criterion_name || s.criterion_key,
                )}</strong>: ${escapeHtml(s.average_score ?? s.score ?? 0)}/5</li>`,
            )
            .join('')}</ul>`
        : '<p>Дані про навички відсутні.</p>';

    const userPlainText: string[] = [];

    userPlainText.push(`Ім’я співробітника: ${userName || '—'}`);
    userPlainText.push(
      `Результати з курсу: "${courseTitle || courseId || 'Назва курсу відсутня'}"`,
    );
    userPlainText.push('');
    userPlainText.push('1) Загальний бал по курсу:');
    userPlainText.push(
      normalizedAverageScore != null
        ? `• ${normalizedAverageScore}/5`
        : '• Середній бал ще не розрахований',
    );
    userPlainText.push('');
    userPlainText.push('2) Quiz score:');
    userPlainText.push(quizScore != null ? `• ${quizScore}/5` : '• Немає даних');
    userPlainText.push('');
    userPlainText.push('3) Результати по модулях:');
    if (Array.isArray(normalizedModules) && normalizedModules.length > 0) {
      normalizedModules.forEach((m, index) => {
        userPlainText.push(`• Модуль ${index + 1} — ${m.moduleTitle || m.moduleId}`);

        if (Array.isArray(m.skills) && m.skills.length > 0) {
          userPlainText.push('  Навички:');
          m.skills.forEach((s) => {
            userPlainText.push(
              `    - ${s.criterion_name || s.criterion_key}: ${s.average_score ?? s.score ?? 0}/5`,
            );
          });
        } else {
          userPlainText.push('  Даних про навички для цього модуля немає.');
        }
      });
    } else {
      userPlainText.push('Дані про модулі відсутні.');
    }

    userPlainText.push('');
    if (Array.isArray(normalizedGlobalSkills) && normalizedGlobalSkills.length > 0) {
      userPlainText.push('4) Глобальні навички:');
      normalizedGlobalSkills.forEach((s) => {
        userPlainText.push(
          `• ${s.criterion_name || s.criterion_key}: ${s.average_score ?? s.score ?? 0}/5`,
        );
      });
    }

    userPlainText.push('');
    userPlainText.push('Дякуємо, команда Kiflow');

    const safeName = escapeHtml(userName || '');
    const safeCourseTitle = escapeHtml(courseTitle || courseId || 'Назва курсу відсутня');

    const userHtml = `
      <h2>Ім’я співробітника: ${safeName || '—'}</h2>

      <h2>Результати з курсу “${safeCourseTitle}”</h2>
      <p>
        У межах курсу було розглянуто основні аспекти роботи з клієнтами,
        особливості побудови ефективної системи продажів та розвиток ключових навичок.
      </p>

      <h3>Загальний бал:</h3>
      <p>${
        normalizedAverageScore != null
          ? `<strong>${escapeHtml(normalizedAverageScore)}/5</strong>`
          : 'Середній бал ще не розрахований'
      }</p>

      <h3>Quiz score:</h3>
      <p>${quizScore != null ? `${escapeHtml(quizScore)}/5` : 'Немає даних'}</p>

      <h3>Результати по модулях</h3>
      ${modulesHtml}

      <h3>Навички</h3>
      ${skillsHtml}

      <hr />
      <p>Це автоматичне повідомлення від команди Kiflow.</p>
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

        await transporter.sendMail({
          from: FROM_EMAIL,
          to: userEmail,
          subject: `🎉 Ви завершили курс ${courseTitle || ''}`,
          text: userPlainText.join('\n'),
          html: userHtml,
        });

        const adminRecipientsList = [
          STATIC_COMPLETION_EMAIL,
          ...EXTRA_COMPLETION_EMAILS,
          ...payloadExtraEmails,
        ]
          .map((e) => e?.trim())
          .filter(Boolean);

        const uniqueAdminRecipients = Array.from(new Set(adminRecipientsList));

        if (uniqueAdminRecipients.length > 0) {
          await transporter.sendMail({
            from: FROM_EMAIL,
            to: uniqueAdminRecipients.join(', '),
            subject: `Копія — Завершення курсу: ${courseTitle || courseId}`,
            text: `${userPlainText.join(
              '\n',
            )}\n---\nАдміністраторська копія. userEmail: ${userEmail}`,
            html: `
              <h3>Копія — Завершення курсу</h3>
              ${userHtml}
              <hr />
              <p>Адміністраторська копія. userEmail: ${escapeHtml(
                userEmail,
              )}<br/>courseId: ${escapeHtml(courseId ?? 'n/a')}</p>
            `,
          });
        }
      } catch (err) {
        console.error('Failed to send course completion email:', err);
        throw err;
      }
    }

    interface ResponseData {
      success: boolean;
      message: string;
      courseId?: string | null;
      courseTitle?: string | null;
      modules?: ModuleItem[] | null;
      averageScore?: number | null;
      quizScore?: number | null;
      skills?: ClientSkill[] | null;
    }

    const baseResponse: ResponseData = {
      success: true,
      message: 'Course completion email sent',
    };
    if (debug) {
      baseResponse.courseId = courseId ?? null;
      baseResponse.courseTitle = courseTitle ?? null;
      baseResponse.modules = modules ?? null;
      baseResponse.averageScore = averageScore ?? null;
      baseResponse.quizScore = quizScore ?? null;
      baseResponse.skills = skills ?? null;
    }

    return new Response(JSON.stringify(baseResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to send course completion email',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
