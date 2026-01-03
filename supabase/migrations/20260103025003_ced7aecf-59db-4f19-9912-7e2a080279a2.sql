-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'student');
CREATE TYPE public.course_status AS ENUM ('active', 'inactive');
CREATE TYPE public.enrollment_status AS ENUM ('in_progress', 'completed', 'failed', 'passed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  duration_hours INTEGER NOT NULL DEFAULT 1,
  level TEXT NOT NULL DEFAULT 'iniciante',
  thumbnail_url TEXT,
  status course_status NOT NULL DEFAULT 'active',
  content_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_exercises table
CREATE TABLE public.course_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_exams table (final exam questions)
CREATE TABLE public.course_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'in_progress',
  progress INTEGER NOT NULL DEFAULT 0,
  exam_score DECIMAL(4, 2),
  exam_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_code TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Categories policies (public read)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Courses policies (public read for active courses)
CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage all courses"
  ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Course exercises policies
CREATE POLICY "Enrolled users can view exercises"
  ON public.course_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.course_id = course_exercises.course_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage exercises"
  ON public.course_exercises FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Course exams policies
CREATE POLICY "Enrolled users can view exams"
  ON public.course_exams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE enrollments.course_id = course_exams.course_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage exams"
  ON public.course_exams FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all enrollments"
  ON public.enrollments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Certificates policies
CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
  ON public.certificates FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can validate a certificate by code
CREATE POLICY "Anyone can validate certificates"
  ON public.certificates FOR SELECT
  USING (true);

-- Functions for auto-profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, description, icon) VALUES
  ('Tecnologia', 'Cursos de programação, desenvolvimento e TI', 'laptop'),
  ('Negócios', 'Gestão, empreendedorismo e finanças', 'briefcase'),
  ('Marketing', 'Marketing digital, vendas e comunicação', 'megaphone'),
  ('Design', 'Design gráfico, UX/UI e criatividade', 'palette'),
  ('Desenvolvimento Pessoal', 'Produtividade, liderança e soft skills', 'user'),
  ('Saúde', 'Bem-estar, nutrição e exercícios', 'heart');