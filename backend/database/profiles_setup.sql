-- ==========================================
-- SISTEMA SIG IGGA / ISA - PERFILES Y ROLES
-- ==========================================

-- 1. Tabla de Perfiles (Extiende Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'Oficina' CHECK (
        role IN (
            'Oficina',
            'Analista Ambiental',
            'Coordinador Predial Junior',
            'Coordinador Predial Senior'
        )
    ),
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los perfiles son visibles por los propios dueños" ON public.profiles FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Los perfiles pueden ser actualizados por los dueños" ON public.profiles FOR
UPDATE USING (auth.uid () = id);

-- 3. Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'Oficina')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Inserción de Roles en metadatos para que el JWT los vea (Opcional pero recomendado para Backend)
-- El backend lee user_metadata.role