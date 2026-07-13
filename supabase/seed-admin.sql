-- Execute depois de criar o primeiro usuário em Authentication > Users.
-- Substitua o e-mail abaixo pelo e-mail institucional correto.
update public.profiles
set role = 'admin', full_name = coalesce(full_name, 'Administrador Prospecta')
where id = (select id from auth.users where email = 'SEU_EMAIL@UEFS.BR');
