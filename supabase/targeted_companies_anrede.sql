-- 2026-10-14: Anrede pro /for-Seite. Run in Supabase SQL Editor.
-- Default 'sie'. Bestehende Seiten (alle Mails bis CEO-261 in du-Form) bleiben 'du'; neue Sie-Firmen explizit.
alter table public.targeted_companies add column if not exists anrede text not null default 'sie' check (anrede in ('sie', 'du'));
update public.targeted_companies set anrede = 'du' where created_at < '2026-10-14T16:00:00Z';
update public.targeted_companies set anrede = 'du' where slug = 'omul';
update public.targeted_companies set anrede = 'sie' where slug in ('moduly', 'contactscanner');
