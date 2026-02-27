import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  course_id: string;
}

// Format score on 0-5 scale to one decimal (aligned with app/course/[id]/progress.tsx)
const formatScore5 = (score: number) => Math.round(score * 10) / 10;

// Helper function to generate skill progress bar HTML (fluid-friendly)
const generateSkillBar = (rating5: number): string => {
  const filled = Math.floor(rating5);
  const bars = [];
  for (let i = 0; i < 5; i++) {
    const isFilled = i < filled;
    const color = isFilled ? '#5774cd' : '#c2d1ff';
    const borderRadius = i === 0 ? 'border-top-left-radius: 4px; border-bottom-left-radius: 4px;' : 
                        i === 4 ? 'border-top-right-radius: 4px; border-bottom-right-radius: 4px;' : '';
    bars.push(`<td width="16" height="8" style="background-color: ${color}; ${borderRadius}"></td>`);
    if (i < 4) bars.push('<td width="4"></td>');
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display: inline-table; vertical-align: middle;"><tr>${bars.join('')}</tr></table>`;
};

// Helper function to generate module card HTML
const generateModuleCard = (
  moduleTitle: string,
  completedLessons: number,
  totalLessons: number,
  skills: Array<{ title: string; rating5: number }>,
): string => {
  const skillsHtml = skills
    .map(
      (skill, index) => `
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100%; margin-bottom: 8px;">
                        <tr>
                          <td style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #0a0a0a; padding-bottom: 4px;">
                            ${skill.title}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 0; padding-bottom: 0;">
                            ${generateSkillBar(skill.rating5)}
                            <span style="display: inline-block; width: 8px;"></span>
                            <span style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 16px; line-height: 20px; color: #0a0a0a; vertical-align: middle;">
                              ${Number(skill.rating5).toFixed(1)}/5
                            </span>
                          </td>
                        </tr>
                      ${index < skills.length - 1 ? '<tr><td style="height: 12px; line-height: 12px;">&nbsp;</td></tr>' : ''}`,
    )
    .join('');

  return `
                  <tr>
                    <td class="module-card" style="background-color: #f4f5f6; border: 1px solid rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="module-header-table">
                        <tr>
                          <td>
                            <div style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 18px; line-height: 22px; color: #0a0a0a; margin: 0 0 4px;">
                              ${moduleTitle}
                            </div>
                            <div style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #737373;">
                              ${completedLessons}/${totalLessons} lessons
                            </div>
                          </td>
                          <td align="right" valign="top">
                            <span style="display: inline-block; background-color: #5ea500; border-radius: 14px; padding: 4px 10px; font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 600; font-size: 14px; line-height: 20px; color: #ffffff;">
                              Completed
                            </span>
                          </td>
                        </tr>
                      </table>
                      <div style="border-top: 1px solid rgba(0, 0, 0, 0.05); height: 1px; line-height: 1px; margin: 16px 0;"></div>
                      ${skills.length > 0 ? `
                      <div style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 16px; line-height: 20px; color: #0a0a0a; margin: 0 0 12px;">
                        Skills level
                      </div>
                      ${skillsHtml}` : ''}
                    </td>
                  </tr>
                  <tr><td style="height: 8px; line-height: 8px;">&nbsp;</td></tr>`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    );

    // Get current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { course_id } = (await req.json()) as RequestBody;

    if (!course_id) {
      throw new Error('Missing course_id');
    }

    // Initialize admin client to fetch user email and other protected data if needed
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Fetch Course Details
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('title, description')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      throw new Error('Course not found');
    }

    const fullName = user.user_metadata?.firstName + ' ' + user.user_metadata?.lastName;
    const employeeName = fullName || user.email || 'Learner';

    const completionDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });

    // 2. Score calculation aligned with app/course/[id]/progress.tsx (interactions-based, 0-5 scale)
    // Get all slide IDs for this course
    const { data: courseSlides } = await supabaseAdmin
      .from('course_slides')
      .select('id, course_lessons!inner(course_modules!inner(course_id))')
      .eq('course_lessons.course_modules.course_id', course_id);
    const slideIds = (courseSlides || []).map((s: any) => s.id);

    let totalQuizScore = 0;
    let quizCount = 0;
    let totalCaseScore = 0;
    let caseCount = 0;

    if (slideIds.length > 0) {
      const [quizRows, caseRows] = await Promise.all([
        supabaseAdmin.from('course_quiz_interactions').select('slide_id, selected_option_index, correct_option_index').eq('user_id', user.id).in('slide_id', slideIds),
        supabaseAdmin
          .from('course_case_study_interactions')
          .select('id, course_case_study_scores(score)')
          .eq('user_id', user.id)
          .in('slide_id', slideIds),
      ]);

      if (quizRows.data) {
        (quizRows.data as any[]).forEach((q) => {
          const score = q.selected_option_index === q.correct_option_index ? 5 : 0;
          totalQuizScore += score;
          quizCount++;
        });
      }
      if (caseRows.data) {
        (caseRows.data as any[]).forEach((c) => {
          const scores = c.course_case_study_scores || [];
          const avgScore = scores.length > 0 ? scores.reduce((acc: number, curr: any) => acc + curr.score, 0) / scores.length : 0;
          totalCaseScore += Math.round(avgScore);
          caseCount++;
        });
      }
    }

    const quizScore = quizCount > 0 ? totalQuizScore / quizCount : 0;
    const caseStudyScore = caseCount > 0 ? totalCaseScore / caseCount : 0;
    const quizScoreFormatted = formatScore5(quizScore);
    const caseStudyScoreFormatted = formatScore5(caseStudyScore);

    const scoresForAverage: number[] = [];
    if (quizScore > 0) scoresForAverage.push(quizScore);
    if (caseStudyScore > 0) scoresForAverage.push(caseStudyScore);
    const overallScore = scoresForAverage.length === 0 ? 0 : scoresForAverage.reduce((a, b) => a + b, 0) / scoresForAverage.length;
    const overallScoreFormatted = formatScore5(overallScore);

    // 5. Fetch Modules with Lessons and Skills
    const { data: modules, error: modulesError } = await supabaseAdmin
      .from('course_modules')
      .select('id, title, order_index')
      .eq('course_id', course_id)
      .order('order_index', { ascending: true });

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
    }

    // Fetch user progress to determine completed lessons
    const { data: userProgress } = await supabaseAdmin
      .from('course_user_progress')
      .select('last_slide_id')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .maybeSingle();

    const modulesWithData = await Promise.all(
      (modules || []).map(async (module) => {
        // Fetch lessons for this module
        const { data: lessons } = await supabaseAdmin
          .from('course_lessons')
          .select('id, order_index')
          .eq('module_id', module.id)
          .order('order_index', { ascending: true });

        const totalLessons = lessons?.length || 0;

        // Calculate completed lessons (simplified: if user has progressed past this module, all lessons are completed)
        let completedLessons = 0;
        if (userProgress?.last_slide_id) {
          const { data: lastSlide } = await supabaseAdmin
            .from('course_slides')
            .select('lesson_id, course_lessons!inner(module_id, order_index)')
            .eq('id', userProgress.last_slide_id)
            .single();

          if (lastSlide) {
            const lastModuleId = (lastSlide.course_lessons as any).module_id;
            const lastLessonOrder = (lastSlide.course_lessons as any).order_index;
            const { data: lastModule } = await supabaseAdmin
              .from('course_modules')
              .select('order_index')
              .eq('id', lastModuleId)
              .single();

            if (lastModule && lastModule.order_index > module.order_index) {
              completedLessons = totalLessons; // Module is fully completed
            } else if (lastModule && lastModule.order_index === module.order_index) {
              // Same module - count completed lessons up to the last lesson
              completedLessons = lessons?.filter(
                (l) => l.order_index <= lastLessonOrder,
              ).length || 0;
            }
          }
        }

        // Fetch criteria scores for this module
        const { data: moduleScores } = await supabaseAdmin
          .from('course_case_study_scores')
          .select(
            `
            score,
            criterion:course_assessment_criteria!inner(title),
            interaction:course_case_study_interactions!inner(
              user_id,
              course_slides!inner(
                course_lessons!inner(module_id)
              )
            )
          `,
          )
          .eq('interaction.user_id', user.id)
          .eq('interaction.course_slides.course_lessons.module_id', module.id);

        const moduleCriteriaRatings: Record<string, { total: number; count: number }> = {};
        if (moduleScores) {
          (moduleScores as any[]).forEach((item: any) => {
            const title = item.criterion.title;
            const score = item.score;
            if (!moduleCriteriaRatings[title]) {
              moduleCriteriaRatings[title] = { total: 0, count: 0 };
            }
            moduleCriteriaRatings[title].total += score;
            moduleCriteriaRatings[title].count += 1;
          });
        }

        const skills = Object.entries(moduleCriteriaRatings).map(([title, data]) => {
          const avg = data.count > 0 ? data.total / data.count : 0;
          return {
            title,
            rating5: avg,
          };
        });

        return {
          ...module,
          totalLessons,
          completedLessons,
          skills,
        };
      }),
    );

    // 6. Generate Email HTML
    const LOGO_URL = 'https://qejhniaccrdgwlzkxftp.supabase.co/storage/v1/object/public/assets/logo.jpg'
    const EMAIL_BG_URL = 'https://qejhniaccrdgwlzkxftp.supabase.co/storage/v1/object/public/assets/email-bg.jpg'

    const modulesHtml = modulesWithData.map((module) =>
      generateModuleCard(
        module.title || `Module ${module.order_index + 1}`,
        module.completedLessons,
        module.totalLessons,
        module.skills,
      ),
    ).join('');

    const emailHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Kiflow – Course completion</title>
    <style type="text/css">
      @media only screen and (max-width: 620px) {
        .email-wrapper { width: 100% !important; max-width: 100% !important; }
        .email-body { padding: 24px 16px 20px !important; }
        .module-card { padding: 12px !important; }
        .module-header-table { display: block !important; }
        .module-header-table tr { display: block !important; }
        .module-header-table td { display: block !important; text-align: left !important; padding-bottom: 8px !important; }
        .module-header-table td:last-child { padding-bottom: 0 !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f5f6; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f5f6; width: 100%;">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <!-- Container: fluid on mobile, max 600px on desktop -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-wrapper" style="width: 100%; max-width: 600px; background-color: #f4f5f6; border-radius: 16px;">
            <!-- Logo -->
            <tr>
              <td align="center" style="padding: 32px 24px;">
                <img src="${LOGO_URL}" width="160" height="40" alt="Kiflow" style="display: block; border: 0; outline: none; text-decoration: none;" />
              </td>
            </tr>

            <!-- Cover -->
            <tr>
              <td align="center" valign="middle" style="height: 324px; background-color: #5774cd; background-image: url('${EMAIL_BG_URL}'); background-size: cover; background-position: center; border-top-left-radius: 16px; border-top-right-radius: 16px; padding: 24px;">
                <div style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 700; font-size: 32px; line-height: 42px; color: #ffffff; text-align: center; max-width: 552px;">
                  Congratulations!<br />
                  Course "${course.title}" has been completed!
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="email-body" style="background-color: #ffffff; border-bottom-left-radius: 16px; border-bottom-right-radius: 16px; padding: 32px 24px 24px;">
                <!-- Intro -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td align="center" style="padding: 0 0 24px;">
                      <div style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 18px; line-height: 22px; color: #525252; text-align: center; margin: 0 0 8px;">
                        Employee name: ${employeeName}
                      </div>
                      <div style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 24px; line-height: 32px; color: #0a0a0a; text-align: center; margin: 0 0 8px;">
                        Results from course "${course.title}"
                      </div>
                      <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-weight: 400; font-size: 16px; line-height: 22px; color: #525252; text-align: center; margin: 0; max-width: 552px;">
                        ${course.description || 'During this course we explored the key aspects and how to build an effective system.'}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Score card -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #e2e8f7; border-radius: 12px; width: 100%;">
                  <tr>
                    <td style="padding: 16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 20px; line-height: 24px; color: #0a0a0a;">
                            Overall score: <span style="white-space: nowrap;">${overallScoreFormatted}</span>
                          </td>
                          <td align="right" style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #525252; white-space: nowrap;">
                            Completion date: ${completionDate}
                          </td>
                        </tr>
                      </table>
                      <div style="height: 12px; line-height: 12px;">&nbsp;</div>
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #0a0a0a;">
                            Quiz score:
                          </td>
                          <td align="left" style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 16px; line-height: 20px; color: #0a0a0a; width: 80px; white-space: nowrap;">
                            ${quizScoreFormatted}
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #0a0a0a; padding-top: 4px;">
                            Case study score:
                          </td>
                          <td align="left" style="font-family: 'Roboto Condensed', Arial, sans-serif; font-weight: 500; font-size: 16px; line-height: 20px; color: #0a0a0a; width: 80px; white-space: nowrap; padding-top: 4px;">
                            ${caseStudyScoreFormatted}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <div style="height: 24px; line-height: 24px;">&nbsp;</div>

                <!-- Modules -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${modulesHtml}
                </table>

                <div style="height: 24px; line-height: 24px;">&nbsp;</div>

                <!-- Closing -->
                <div style="font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-weight: 400; font-size: 14px; line-height: 20px; color: #686868; text-align: center;">
                  May learning bring maximum benefit!<br />
                  The Kiflow platform team
                </div>

                <div style="height: 12px; line-height: 12px;">&nbsp;</div>

                <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 20px; text-align: center; color: #e86591;">
                  ♥
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-wrapper" style="width: 100%; max-width: 600px;">
            <tr>
              <td align="center" style="padding: 24px 0 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #9a9ea6; text-align: center;">
                Copyright © 2025 Kiflow, all rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    // 7. Send Email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      throw new Error('Internal Server Error: Email configuration missing');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Kiflow <onboarding@resend.dev>', // TODO: Update with user's domain
        to: [user.email],
        subject: `Course Completion: ${course.title}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API Error:', data);
      throw new Error('Failed to send email');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
