# To replace everything in dev db with prod data

## 1 Dump prod db
```
supabase db dump --db-url "postgresql://postgres.dysycsgsanwqsfrswyeq:HgUQOembXp76O4fV@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -f schema.sql
```

```
supabase db dump --db-url "postgresql://postgres.dysycsgsanwqsfrswyeq:HgUQOembXp76O4fV@aws-1-eu-north-1.pooler.supabase.com:6543/postgres" -f data.sql --use-copy --data-only
```

## 2 Reset dev dev (install psql first)
```
psql "postgresql://postgres.qejhniaccrdgwlzkxftp:gE83bk1Z9WrOqAYO@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"
```

and inside run

```
DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO anon; GRANT ALL ON SCHEMA public TO authenticated; GRANT ALL ON SCHEMA public TO service_role;
```

## 3 Upload backup from prod 
```
psql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "postgresql://postgres.qejhniaccrdgwlzkxftp:gE83bk1Z9WrOqAYO@aws-1-eu-west-2.pooler.supabase.com:6543/postgres"
```