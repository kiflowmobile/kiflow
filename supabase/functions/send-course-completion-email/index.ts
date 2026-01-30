import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  course_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { course_id } = (await req.json()) as RequestBody;

    if (!course_id) {
      throw new Error("Missing course_id");
    }

    // Initialize admin client to fetch user email and other protected data if needed
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch Course Details
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("title")
      .eq("id", course_id)
      .single();

    if (courseError || !course) {
      throw new Error("Course not found");
    }

    // 2. Fetch Course Grade
    const { data: courseGradeData, error: gradeError } = await supabaseAdmin
      .from("view_user_course_grades")
      .select("course_grade")
      .eq("user_id", user.id)
      .eq("course_id", course_id)
      .maybeSingle(); // Use maybeSingle as grade might not exist if not fully calculated yet

    const courseRating = courseGradeData?.course_grade ?? 0;

    // 3. Fetch Quiz Average
    // We calculate this manually from view_user_lesson_grades
    const { data: lessonGrades, error: lessonError } = await supabaseAdmin
      .from("view_user_lesson_grades")
      .select("quiz_avg_score")
      .eq("user_id", user.id)
      .eq("course_id", course_id);

    let quizRating = 0;
    if (lessonGrades && lessonGrades.length > 0) {
      const totalQuizScore = lessonGrades.reduce(
        (sum, item) => sum + (item.quiz_avg_score || 0),
        0
      );
      // Filter out lessons that might not have quizzes if needed, but assuming average of 0 is fine if handled correctly
      // Better: average of non-null quiz scores?
      // The view returns 0 if null, so simple average is fine for now.
      quizRating = totalQuizScore / lessonGrades.length;
    }

    // 4. Fetch Ratings per Criterion
    // We need to join tables. Supabase JS client is tricky with complex joins and aggregations.
    // It's often easier to call an RPC or make a raw query if possible, but JS client doesn't support raw SQL easily.
    // We will fetch the raw scores and aggregate in JS.
    const { data: criterionScores, error: criterionError } = await supabaseAdmin
      .from("course_case_study_scores")
      .select(`
        score,
        criterion:course_assessment_criteria!inner(title, course_id),
        interaction:course_case_study_interactions!inner(user_id)
      `)
      .eq("interaction.user_id", user.id)
      .eq("criterion.course_id", course_id);

    const criterionRatings: Record<string, { total: number; count: number }> =
      {};

    if (criterionScores) {
      criterionScores.forEach((item: any) => {
        const title = item.criterion.title;
        const score = item.score;
        if (!criterionRatings[title]) {
          criterionRatings[title] = { total: 0, count: 0 };
        }
        criterionRatings[title].total += score;
        criterionRatings[title].count += 1;
      });
    }

    const formattedCriterionRatings = Object.entries(criterionRatings).map(
      ([title, data]) => ({
        title,
        rating: (data.total / data.count).toFixed(2),
      })
    );

    // 5. Send Email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Internal Server Error: Email configuration missing");
    }

    const emailHtml = `
      <h1>Congratulations!</h1>
      <p>You have completed the course <strong>${course.title}</strong>.</p>
      
      <h2>Your Results</h2>
      <ul>
        <li><strong>Overall Course Rating:</strong> ${courseRating}/100</li>
        <li><strong>Quiz Rating:</strong> ${quizRating.toFixed(2)}/100</li>
      </ul>

      <h3>Ratings per Criterion</h3>
      <ul>
        ${formattedCriterionRatings
          .map((c) => `<li><strong>${c.title}:</strong> ${c.rating}/100</li>`)
          .join("")}
      </ul>

      <p>Keep up the good work!</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Kiflow <onboarding@resend.dev>", // TODO: Update with user's domain
        to: [user.email],
        subject: `Course Completion: ${course.title}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API Error:", data);
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
