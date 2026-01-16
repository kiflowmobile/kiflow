# Supabase Database Backup Instructions

Before running the migration `20260107120000_schema_integrity_fixes.sql`, follow these steps to backup your database.

---

## Option 1: Supabase Dashboard (Recommended for Quick Backup)

### Step 1: Export via Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Scroll to **Database Backups** section
5. Click **Download backup** to get the latest automatic backup

### Step 2: Manual SQL Dump via Dashboard
1. Go to **SQL Editor** in the dashboard
2. Run this query to see all your data counts (for verification later):

```sql
SELECT
  'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL SELECT 'courses', COUNT(*) FROM public.courses
UNION ALL SELECT 'modules', COUNT(*) FROM public.modules
UNION ALL SELECT 'lessons', COUNT(*) FROM public.lessons
UNION ALL SELECT 'slides', COUNT(*) FROM public.slides
UNION ALL SELECT 'quiz_answers', COUNT(*) FROM public.quiz_answers
UNION ALL SELECT 'main_rating', COUNT(*) FROM public.main_rating
UNION ALL SELECT 'user_course_summaries', COUNT(*) FROM public.user_course_summaries
UNION ALL SELECT 'chat_history', COUNT(*) FROM public.chat_history
UNION ALL SELECT 'companies', COUNT(*) FROM public.companies
UNION ALL SELECT 'company_members', COUNT(*) FROM public.company_members
UNION ALL SELECT 'company_courses', COUNT(*) FROM public.company_courses
UNION ALL SELECT 'criterias', COUNT(*) FROM public.criterias
UNION ALL SELECT 'slide_ai_prompts', COUNT(*) FROM public.slide_ai_prompts
ORDER BY table_name;
```

3. Save the output - you'll use this to verify the migration didn't lose critical data

---

## Option 2: pg_dump via CLI (Full Backup)

### Prerequisites
- PostgreSQL client tools installed (`psql`, `pg_dump`)
- Your Supabase connection string

### Step 1: Get Connection String
1. Go to Supabase Dashboard → **Settings** → **Database**
2. Find **Connection string** section
3. Copy the **URI** (it looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)

### Step 2: Run pg_dump
```bash
# Set your connection string
export DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Create backup directory
mkdir -p ./backups

# Full backup (schema + data)
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file=./backups/kiflow_backup_$(date +%Y%m%d_%H%M%S).dump

# Or plain SQL format (easier to read)
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --format=plain \
  --file=./backups/kiflow_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 3: Backup Individual Tables (Optional)
```bash
# Backup specific tables that will be modified
for table in quiz_answers main_rating user_course_summaries chat_history lessons; do
  pg_dump "$DATABASE_URL" \
    --no-owner \
    --no-acl \
    --table="public.$table" \
    --file="./backups/${table}_backup_$(date +%Y%m%d_%H%M%S).sql"
done
```

---

## Option 3: Supabase CLI

### Prerequisites
```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Or via Homebrew (macOS)
brew install supabase/tap/supabase
```

### Step 1: Link to Your Project
```bash
# Login to Supabase
supabase login

# Link to your project (get project ref from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Create Backup
```bash
# Dump remote database
supabase db dump -f ./backups/kiflow_backup_$(date +%Y%m%d_%H%M%S).sql

# Dump only data (no schema)
supabase db dump -f ./backups/kiflow_data_$(date +%Y%m%d_%H%M%S).sql --data-only

# Dump only specific schemas
supabase db dump -f ./backups/kiflow_public_$(date +%Y%m%d_%H%M%S).sql --schema public
```

---

## Running the Migration

After backup is complete:

### Option A: Via Supabase CLI (Recommended)
```bash
# From project root
cd /Users/madrov/coding/kiflow

# Push migrations to remote
supabase db push
```

### Option B: Via Dashboard SQL Editor
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy the contents of `supabase/migrations/20260107120000_schema_integrity_fixes.sql`
3. Paste and click **Run**

### Option C: Via psql
```bash
psql "$DATABASE_URL" -f supabase/migrations/20260107120000_schema_integrity_fixes.sql
```

---

## Verify Migration Success

After running the migration, verify:

```sql
-- Check all foreign keys were created
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Check indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Re-run the row count query to verify no unexpected data loss
```

---

## Rollback Procedure

If something goes wrong, you can restore from backup:

### From pg_dump custom format
```bash
pg_restore "$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  ./backups/kiflow_backup_TIMESTAMP.dump
```

### From plain SQL
```bash
psql "$DATABASE_URL" -f ./backups/kiflow_backup_TIMESTAMP.sql
```

### Or use the rollback script
```bash
psql "$DATABASE_URL" -f supabase/migrations/20260107120001_schema_integrity_fixes_rollback.sql
```

---

## Important Notes

1. **Test in staging first**: If you have a staging environment, run the migration there first
2. **Schedule during low traffic**: Run during off-peak hours
3. **The migration will DELETE orphaned data**: Records pointing to non-existent foreign keys will be removed
4. **App should continue working**: The migration is additive (adds constraints) and shouldn't break existing functionality
5. **Indexes may take time**: On large tables, index creation can take a few minutes
