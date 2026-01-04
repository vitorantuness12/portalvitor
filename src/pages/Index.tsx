import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCourses } from '@/components/home/FeaturedCourses';
import { CategorySection } from '@/components/home/CategorySection';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <HowItWorksSection />
        <CategorySection />
        <FeaturedCourses />
        <TestimonialsSection />
        <WhyChooseUs />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
