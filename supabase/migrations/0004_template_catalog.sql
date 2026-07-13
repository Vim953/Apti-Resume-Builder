-- Template catalog used by the SaaS template picker.
-- Free users can use Simple Clean. Pro templates unlock after plan upgrade.

insert into templates (name, plan_min, ats_safe, config)
values
  ('Simple Clean', 'free', true, '{"columns":1,"font":"Plus Jakarta Sans","accent":"#5B4FE8","headingStyle":"uppercase-underline","layout":"simple"}'::jsonb),
  ('Academic ATS', 'pro', true, '{"columns":1,"font":"Times New Roman","accent":"#111827","headingStyle":"academic-line","layout":"academic"}'::jsonb),
  ('Minimal', 'pro', true, '{"columns":1,"font":"Plus Jakarta Sans","accent":"#A89163","headingStyle":"line","layout":"minimal"}'::jsonb),
  ('Executive', 'pro', true, '{"columns":1,"font":"Plus Jakarta Sans","accent":"#37322D","headingStyle":"uppercase-underline","layout":"executive"}'::jsonb),
  ('Professional', 'pro', true, '{"columns":1,"font":"Plus Jakarta Sans","accent":"#1057A8","headingStyle":"pill","layout":"professional"}'::jsonb),
  ('Creative', 'pro', true, '{"columns":1,"font":"Plus Jakarta Sans","accent":"#507A44","headingStyle":"line","layout":"creative"}'::jsonb)
on conflict do nothing;
