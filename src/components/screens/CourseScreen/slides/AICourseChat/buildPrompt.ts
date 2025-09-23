import { Message } from "@/src/constants/types/ai_chat";

export function buildPrompt(
  slidePrompt: string,
  isFirstMessage: boolean,
  lastUserMessage?: Message,
  criteriasText: string = ""
): string {
  let content = "";

  if (isFirstMessage) {
    content = `Візьми текст після слова "КЕЙС:" у цьому описі:
${slidePrompt}

Покажи його без слова "КЕЙС:" і без лапок. 
Не додавай нічого від себе.`;
    return content;
  }

  if (lastUserMessage?.text) {
    const studentAnswer = lastUserMessage.text;

    const strictFormat = `Оціни відповідь студента за критеріями з цього опису:
    ${slidePrompt}
    
    Відповідь студента:
    ${studentAnswer}
    
    Тепер поверни СТРОГО валідний JSON в один рядок без переносів рядків, без додаткового тексту. Формат:
    
    {
      "text": "повтор відповіді студента",
      "rating": {
        "overall_score": <число від 0 до 10>,
        "criteriaScores": {
          "для того щоб зрозуміти який буде ключ знайти назву критерию в списку ${criteriasText}, та встанову ключ": <оцінка>,
          "...": <оцінка>
        },
        "comment":"📊 ЗАГАЛЬНА ОЦІНКА: 8/10\n\n🎯 ОЦІНКА ПО КРИТЕРІЯХ:\n• Логіка: 7\n• Структура: 8\n\n💡 ФІДБЕК:\nТут йде пояснення...\n\n✅ СИЛЬНІ СТОРОНИ:\n...\n\n🔧 ЩО ПОКРАЩИТИ:\n...\n\n🚀 НАСТУПНИЙ КРОК:\n..."
      }
    }
    
    ❗ Дуже важливо: це має бути ОДИН JSON-обʼєкт, без зайвих символів, без пояснень, без \\n усередині рядка. Абзаци формуй лише пробілами або маркерами (•), але не використовуй реальні переноси рядків.`;
    

    return strictFormat;
  }

  return "";
}
