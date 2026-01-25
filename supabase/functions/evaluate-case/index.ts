import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  slide_id: string;
  user_answer: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { slide_id, user_answer }: RequestBody = await req.json();

    if (!slide_id || !user_answer) {
      return new Response(JSON.stringify({ error: "Missing required fields: slide_id, user_answer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client for admin database operations (using Service Role)
    // We use this for EVERYTHING except the initial user verification
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user from JWT using the admin client but passing the JWT
    // This is safer than using the anon key in some environments
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      console.error("User Auth Error:", userError);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Get slide and course information using the ADMIN client to bypass RLS
    const { data: slide, error: slideError } = await supabaseAdmin
      .from("course_slides")
      .select(
        `
        id,
        content,
        course_lessons!inner(
          module_id,
          course_modules!inner(
            course_id
          )
        )
      `
      )
      .eq("id", slide_id)
      .single();

    if (slideError || !slide) {
      console.error("Slide Error:", slideError);
      return new Response(JSON.stringify({ error: "Slide not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const courseId = (slide.course_lessons as any).course_modules.course_id;
    const slideContent = slide.content as any;

    // Get AI config for the course using ADMIN client
    const { data: aiConfig, error: aiConfigError } = await supabaseAdmin
      .from("course_case_study_ai_configs")
      .select("persona_name, system_role_instruction")
      .eq("course_id", courseId)
      .single();

    if (aiConfigError || !aiConfig) {
      console.error("AI Config Error:", aiConfigError);
      return new Response(JSON.stringify({ error: "AI config not found for this course" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get assessment criteria for the course using ADMIN client
    const { data: criteria, error: criteriaError } = await supabaseAdmin
      .from("course_assessment_criteria")
      .select("id, title")
      .eq("course_id", courseId);

    if (criteriaError || !criteria) {
      console.error("Criteria Error:", criteriaError);
      return new Response(JSON.stringify({ error: "Failed to fetch assessment criteria" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt
    const criteriaList = criteria.map((c) => `- ${c.title} (JSON ID: "${c.id}")`).join("\n");
    const criteriaKeysExample = criteria.map((c) => `"${c.id}": <score from 1 to 5>`).join(", ");

    const prompt = `
Person: ${aiConfig.persona_name}
System role instruction: ${aiConfig.system_role_instruction}
Case context: ${slideContent.scenario}
Assessment criteria:
${criteriaList}

Student answer: "${user_answer}"

# TECHNICAL FORMAT INSTRUCTION:
Return a STRICTLY valid JSON object.
Do not add any text before or after the JSON object.
The language of the feedback (field "comment"): As language of the user answer.
The JSON structure must be as follows:
{
  "text": "repeat of the student's answer",
  "rating": {
    "overall_score": <number from 1 to 5>,
    "criteriaScores": {
      ${criteriaKeysExample}
    },
    "comment": "detailed feedback for the user in their language"
  }
}
`.trim();

    // Call Gemini API
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", errorText);
      return new Response(JSON.stringify({ error: `Gemini API error: ${errorText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0]?.content?.parts[0]?.text || "{}";

    let evaluationJson: any;
    try {
      evaluationJson = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Parse Error:", parseError, "Response Text:", responseText);
      return new Response(JSON.stringify({ error: `Failed to parse Gemini response: ${parseError}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rating = evaluationJson.rating || {};
    const feedback = rating.comment || "No feedback provided";
    const criteriaScores = rating.criteriaScores || {};
    const overallScore = rating.overall_score || 0;

    // 1. Create/Update interaction WITH feedback (solving the "stores before response" issue)
    const { data: interaction, error: interactionError } = await supabaseAdmin
      .from("course_case_study_interactions")
      .upsert(
        {
          user_id: userId,
          slide_id: slide_id,
          user_answer: user_answer,
          ai_feedback: feedback,
        },
        { onConflict: "user_id,slide_id" }
      )
      .select("id")
      .single();

    if (interactionError || !interaction) {
      console.error("Interaction Upsert Error:", interactionError);
      return new Response(JSON.stringify({ error: "Failed to save interaction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const interactionId = interaction.id;

    // 2. Insert response scores
    if (Object.keys(criteriaScores).length > 0) {
      const responseScores = Object.entries(criteriaScores).map(([criterionId, score]) => {
        return {
          interaction_id: interactionId,
          criterion_id: criterionId,
          score: Math.round(Number(score)),
        };
      });

      const { error: insertScoresError } = await supabaseAdmin.from("course_case_study_scores").upsert(responseScores, {
        onConflict: "interaction_id,criterion_id",
      });

      if (insertScoresError) {
        console.error("Insert Scores Error:", insertScoresError);
      }
    }

    return new Response(
      JSON.stringify({
        feedback,
        average_score: overallScore,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in evaluate-case function:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
