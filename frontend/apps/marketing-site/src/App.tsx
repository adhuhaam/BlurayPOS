import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CustomersSection } from './components/CustomersSection';
import { PosTerminalSection } from './components/PosTerminalSection';
import { PlatformFeatures } from './components/PlatformFeatures';
import { OnboardingSection } from './components/OnboardingSection';
import { PlansSection } from './components/PlansSection';
import { StatsBar } from './components/StatsBar';
import { TerminalWorkflow } from './components/TerminalWorkflow';
import { ValueProps } from './components/ValueProps';
import { CtaBanner } from './components/CtaBanner';
import { MarketingProvider } from './context/MarketingContext';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <MarketingProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <CustomersSection />
          <StatsBar />
          <PosTerminalSection />
          <PlatformFeatures />
          <TerminalWorkflow />
          <OnboardingSection />
          <PlansSection />
          <ValueProps />
          <CtaBanner />
        </main>
        <Footer />
      </div>
    </MarketingProvider>
  );
}
