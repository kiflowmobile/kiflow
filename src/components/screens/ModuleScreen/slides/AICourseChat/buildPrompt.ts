import { Message } from '@/src/constants/types/ai_chat';

export function buildPrompt(
  slidePrompt: string,
  isFirstMessage: boolean,
  lastUserMessage?: Message,
  criteriasText: string = '',
  companyStandards?: any,
): string {
  // Подготовим текст стандартов, если они есть
  const standardsText = companyStandards
    ? `\n\nКомпанійні стандарти сервісу (враховуй при оцінці):\n${JSON.stringify(
        companyStandards,
        null,
        2,
      )}\n\n`
    : '';

  if (isFirstMessage) {
    const content = `Візьми текст після слова "КЕЙС:" у цьому описі:
${slidePrompt}

Покажи його без слова "КЕЙС:" і без лапок. 
Не додавай нічого від себе.`;

    return content + standardsText;
  }

  if (lastUserMessage?.text) {
    const studentAnswer = lastUserMessage.text;

    const strictFormat = `Оціни відповідь студента за критеріями з цього опису:
${slidePrompt}
${standardsText}

Відпововідь студента:
${studentAnswer}

Тепер поверни СТРОГО валідний JSON в один рядок без переносів рядків, без додаткового тексту. Формат:

{
  "text": "повтор відповіді студента",
  "rating": {
    "overall_score": <число від 0 до 5>,
    "criteriaScores": {
      "<назва критерію>": <оцінка>,
      "...": <оцінка>
    },
    "comment": "Короткий фідбек з підказками для покращення"
  },
  "standards_used": {
    "summary": "Коротко опиши, які частини компанійних стандартів були застосовані при оцінці",
    "details": {
      "<ключ зі стандартів>": "як і чому це вплинуло на оцінку",
      "...": "..."
    }
  }
}

❗ Дуже важливо: це має бути ОДИН JSON-обʼєкт, без зайвих символів.`;

    return strictFormat;
  }

  return '';
}
