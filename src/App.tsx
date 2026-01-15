import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import { useHideToastCloseButtons } from "@/hooks/useHideToastCloseButtons";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Courses from "./pages/Courses";
import MyCourses from "./pages/MyCourses";
import MyCertificates from "./pages/MyCertificates";
import StudentDashboard from "./pages/StudentDashboard";
import Profile from "./pages/Profile";
import CourseDetail from "./pages/CourseDetail";
import CourseStudy from "./pages/CourseStudy";
import CourseCertificate from "./pages/CourseCertificate";
import ValidateCertificate from "./pages/ValidateCertificate";
import SupportTicket from "./pages/SupportTicket";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminCourses from "./pages/admin/Courses";
import AdminUsers from "./pages/admin/Users";
import AdminCategories from "./pages/admin/Categories";
import AdminCertificates from "./pages/admin/Certificates";
import CreateCourseAI from "./pages/admin/CreateCourseAI";
import BulkCreateCourseAI from "./pages/admin/BulkCreateCourseAI";
import AdminSupportTickets from "./pages/admin/SupportTickets";
import TopicGenerator from "./pages/admin/TopicGenerator";
import NotFound from "./pages/NotFound";
import { SupportChat } from "./components/support/SupportChat";

const queryClient = new QueryClient();

function App() {
  useHideToastCloseButtons();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/cursos" element={<Courses />} />
                <Route path="/meus-cursos" element={<MyCourses />} />
                <Route path="/meu-progresso" element={<StudentDashboard />} />
                <Route path="/meus-certificados" element={<MyCertificates />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/curso/:id" element={<CourseDetail />} />
                <Route path="/curso/:id/estudar" element={<CourseStudy />} />
                <Route path="/curso/:id/certificado" element={<CourseCertificate />} />
                <Route path="/validar-certificado" element={<ValidateCertificate />} />
                <Route path="/suporte/:id" element={<SupportTicket />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="cursos" element={<AdminCourses />} />
                  <Route path="usuarios" element={<AdminUsers />} />
                  <Route path="categorias" element={<AdminCategories />} />
                  <Route path="certificados" element={<AdminCertificates />} />
                  <Route path="criar-curso" element={<CreateCourseAI />} />
                  <Route path="criar-cursos-massa" element={<BulkCreateCourseAI />} />
                  <Route path="gerador-temas" element={<TopicGenerator />} />
                  <Route path="suporte" element={<AdminSupportTickets />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              <SupportChat />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

