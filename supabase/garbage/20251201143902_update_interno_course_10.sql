-- Міграція: Додаємо критерії для курсу interno_course

WITH current_course AS (
  SELECT id
  FROM public.courses
  WHERE code = 'interno_course'
)
INSERT INTO public.criterias (course_id, key, name, description, created_at)
SELECT
  c.id,
  cr.key,
  cr.name,
  cr.description,
  NOW()
FROM current_course c,
LATERAL (VALUES
    ('leadership', 'Контроль ситуації (Leadership Response)', 'Наскільки менеджер спокійно і впевнено керує діалогом'),
    ('structure', 'Дотримання формули техніки (Structure Alignment)', 'Чи логічно побудована відповідь'),
    ('clarity', 'Змістова ясність і користь для клієнта (Clarity & Value)', 'Чи пояснив менеджер цінність рішення'),
    ('conversion', 'Просування до рішення (Conversion Move)', 'Чи створює відповідь рух до домовленості')
) AS cr(key, name, description);
