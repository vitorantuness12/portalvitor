-- Migração para adicionar usuário vitorantuness@hotmail.com como admin
-- Data: 2026-09-02

-- Primeiro, busca o user_id do usuário pelo email na tabela auth.users
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Busca o ID do usuário
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'vitorantuness@hotmail.com';

  -- Se o usuário existir e ainda não for admin, insere o role
  IF v_user_id IS NOT NULL THEN
    -- Remove roles anteriores se existirem (para garantir que será admin)
    DELETE FROM public.user_roles
    WHERE user_id = v_user_id;

    -- Insere como admin
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (v_user_id, 'admin', NOW());

    RAISE NOTICE 'Usuário vitorantuness@hotmail.com agora é admin.';
  ELSE
    RAISE NOTICE 'Usuário vitorantuness@hotmail.com não encontrado no auth.users.';
  END IF;
END $$;
