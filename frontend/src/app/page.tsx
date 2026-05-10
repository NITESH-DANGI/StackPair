import Navbar from '@/components/public/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import LogoCloud from '@/components/landing/LogoCloud';
import HowItWorks from '@/components/landing/HowItWorks';
import BentoFeatures from '@/components/landing/BentoFeatures';
import VerificationSection from '@/components/landing/VerificationSection';
import CardTeaserSection from '@/components/landing/CardTeaserSection';
import TestimonialSlider from '@/components/landing/TestimonialSlider';
import FoundingMentorBanner from '@/components/landing/FoundingMentorBanner';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/public/Footer';

export default function Home() {
  return (
    <main className="bg-[#09090B] overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <LogoCloud />
      <HowItWorks />
      <BentoFeatures />
      <VerificationSection />
      <CardTeaserSection />
      <TestimonialSlider />
      <FoundingMentorBanner />
      <FinalCTA />
      <Footer />
    </main>
  );
}
