interface AIResponse {
    content?: string;
    rating?: {
      comment?: string
    } | null;
  }

  export function formatAIResponseForChat(aiResponse: AIResponse): string {
    if (!aiResponse) return "";

    const { content, rating } = aiResponse;
    if (!rating) return content || "";
  
    const lines: string[] = [];

    if (rating.comment) {
      lines.push(rating.comment)
    }

    return lines.join("\n");
  }
  