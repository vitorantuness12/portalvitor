-- Apagar todos os usuários e dados relacionados
-- Ordem: primeiro tabelas filhas, depois auth.users (cascade para profiles)

-- Limpa dependências diretas de users
DELETE FROM push_subscriptions WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM payments WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM support_tickets WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM student_cards WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM user_interests WHERE user_id IN (SELECT id FROM auth.users);

-- Apaga autenticação (cascade para profiles, enrollments, certificates, course_notes)
DELETE FROM auth.users;
