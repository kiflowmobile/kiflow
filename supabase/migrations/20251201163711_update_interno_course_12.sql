-- 1. Створюємо курс interno_course, якщо його ще немає
WITH new_course AS (
  INSERT INTO public.courses (id, code, title, created_at)
  VALUES (
    gen_random_uuid(),
    'interno_course',
    'Interno Course',
    NOW()
  )
  ON CONFLICT (code) DO NOTHING
  RETURNING id
),
get_course AS (
  SELECT id FROM new_course
  UNION
  SELECT id FROM public.courses WHERE code = 'interno_course'
)

-- 2. Додаємо критерії
INSERT INTO public.criterias (course_id, key, name, description, created_at)
SELECT
  gc.id,
  cr.key,
  cr.name,
  cr.description,
  NOW()
FROM get_course gc,
LATERAL (
  VALUES
    ('leadership', 'Контроль ситуації (Leadership Response)', 'Наскільки менеджер спокійно і впевнено керує діалогом'),
    ('structure', 'Дотримання формули техніки (Structure Alignment)', 'Чи логічно побудована відповідь'),
    ('clarity', 'Змістова ясність і користь для клієнта (Clarity & Value)', 'Чи пояснив менеджер цінність рішення'),
    ('conversion', 'Просування до рішення (Conversion Move)', 'Чи створює відповідь рух до домовленості')
) AS cr(key, name, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.criterias c
  WHERE c.course_id = gc.id AND c.key = cr.key
);

