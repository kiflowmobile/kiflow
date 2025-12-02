INSERT INTO public.courses (id, code, name, created_at)
VALUES (
  gen_random_uuid(),
  'interno_course',
  'Interno Course',
  NOW()
)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert criterias for this course
WITH current_course AS (
  SELECT id
  FROM public.courses
  WHERE code = 'interno_course'
  LIMIT 1
)
INSERT INTO public.criterias (course_id, key, name, description, created_at)
SELECT
  cc.id,
  cr.key,
  cr.name,
  cr.description,
  NOW()
FROM current_course cc,
LATERAL (VALUES
    ('leadership', 'Контроль ситуації (Leadership Response)', 'Наскільки менеджер спокійно і впевнено керує діалогом'),
    ('structure', 'Дотримання формули техніки (Structure Alignment)', 'Чи логічно побудована відповідь'),
    ('clarity', 'Змістова ясність і користь для клієнта (Clarity & Value)', 'Чи пояснив менеджер цінність рішення'),
    ('conversion', 'Просування до рішення (Conversion Move)', 'Чи створює відповідь рух до домовленості')
) AS cr(key, name, description);