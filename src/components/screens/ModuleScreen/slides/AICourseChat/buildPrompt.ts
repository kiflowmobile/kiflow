import { Message } from '@/src/constants/types/ai_chat';


export function buildPrompt(
  slidePrompt: string,
  isFirstMessage: boolean,
  lastUserMessage?: Message,
  criteriasText: string = '',
  companyStandards?: unknown,
): string {
  const standardsInstruction = companyStandards
    ? `
[ОБОВ'ЯЗКОВО ВРАХУЙ СТАНДАРТИ]
Нижче перелік стандартів компанії (чек-лист). Перевір відповідь на відповідність кожному пункту.
Якщо є СУТТЄВІ порушення (будь-який критичний пункт), то:
- "overall_score" НЕ може бути > 2.
- У "comment" додай підрозділ "❗ Порушення стандартів:" з коротким переліком пунктів, які порушено.
- Якщо порушень немає — додай підрозділ "✅ Відповідність стандартам: так".

Чек-лист стандартів:
${companyStandards}
`
    : '';

  if (isFirstMessage) {
    return `Візьми текст після слова "КЕЙС:" у цьому описі:
${slidePrompt}

Покажи його без слова "КЕЙС:" і без лапок. 
Не додавай нічого від себе.`;
  }

  if (lastUserMessage?.text) {
    const studentAnswer = lastUserMessage.text;

    return `Оціни відповідь студента за критеріями з цього опису:
${slidePrompt}
${standardsInstruction}

Відповідь студента:
${studentAnswer}

Тепер поверни СТРОГО валідний JSON в один рядок без переносів рядків, без додаткового тексту. Формат:

{
  "text": "повтор відповіді студента",
  "rating": {
    "overall_score": <число від 0 до 5>,
    "criteriaScores": {
      "для того щоб зрозуміти який буде ключ знайти назву критерию в списку ${criteriasText}, та встанову ключ": <оцінка>,
      "...": <оцінка>
    },
    "comment":"📊 ЗАГАЛЬНА ОЦІНКА: 4/5\\n\\n🎯 ОЦІНКА ПО КРИТЕРІЯХ:\\n• Логіка: 7\\n• Структура: 8\\n\\n💡 ФІДБЕК:\\nТут йде пояснення...\\n\\n✅ СИЛЬНІ СТОРОНИ:\\n...\\n\\n🔧 ЩО ПОКРАЩИТИ:\\n...\\n\\n🚀 НАСТУПНИЙ КРОК:\\n...${
      companyStandards
        ? '\\n\\n❗ Порушення стандартів:\\n(перерахуйте або вкажіть: відсутні)\\n\\n✅ Відповідність стандартам: так/ні'
        : ''
    }"
  }
}

❗ Дуже важливо: це має бути ОДИН JSON-обʼєкт, без зайвих символів.`;
  }

  return '';
}
