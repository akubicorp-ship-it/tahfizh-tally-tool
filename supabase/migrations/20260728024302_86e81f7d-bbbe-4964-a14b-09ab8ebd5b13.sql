UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email IN ('admin@msq.demo','ustadz@msq.demo','wali@msq.demo','santri@msq.demo');

INSERT INTO public.profiles (id, full_name)
SELECT u.id, 'Demo ' || initcap(split_part(u.email,'@',1))
FROM auth.users u
WHERE u.email IN ('admin@msq.demo','ustadz@msq.demo','wali@msq.demo','santri@msq.demo')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, split_part(u.email,'@',1)::app_role
FROM auth.users u
WHERE u.email IN ('admin@msq.demo','ustadz@msq.demo','wali@msq.demo','santri@msq.demo')
ON CONFLICT (user_id, role) DO NOTHING;