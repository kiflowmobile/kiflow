import { supabase } from "./supabase";

export async function sendCourseCompletionEmail(courseId: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-course-completion-email",
      {
        body: { course_id: courseId },
      }
    );

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending course completion email:", error);
    throw error;
  }
}
