CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    module_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    lesson_order INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_lessons_module
        FOREIGN KEY (module_id)
        REFERENCES public.modules(id)
        ON DELETE CASCADE
);

-- Індекс для швидкого пошуку уроків у модулі
CREATE INDEX IF NOT EXISTS idx_lessons_module_id
    ON public.lessons(module_id);