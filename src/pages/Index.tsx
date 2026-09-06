import { Seo } from '@/components/seo/Seo';
import { SITE_URL } from '@/lib/site';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCourses } from '@/components/home/FeaturedCourses';
import { CategorySection } from '@/components/home/CategorySection';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { FAQSection } from '@/components/home/FAQSection';
import { BadgesSection } from '@/components/home/BadgesSection';
import { FreeCoursesBanner } from '@/components/home/FreeCoursesBanner';
import { useIsPwa } from '@/hooks/useIsPwa';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const isPwa = useIsPwa();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // In PWA mode, redirect logged-in users to dashboard
  useEffect(() => {
    if (isPwa && !loading && user) {
      navigate('/meu-progresso', { replace: true });
    }
  }, [isPwa, user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="Formak. Aprenda. Evolua. Conquiste."
        description="Cursos online acessíveis e práticos para você desenvolver seu potencial, fortalecer seu currículo e transformar conhecimento em novas oportunidades."
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Formak',
            url: SITE_URL,
            logo: `${SITE_URL}/icon-512.png`,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Formak',
            url: SITE_URL,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/cursos?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategorySection />
        <WhyChooseUs />
        <HowItWorksSection />
        <FeaturedCourses />
        <FreeCoursesBanner />
        <TestimonialsSection />
        <BadgesSection />
        <FAQSection />
      </main>
      {!isPwa && <Footer />}
    </div>
  );
};

export default Index;
