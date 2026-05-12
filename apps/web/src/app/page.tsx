
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/hero/HeroSection";
import WhatBodySignalDoes from "@/components/sections/WhatBodySignalDoes";
import WhatBodySignalDoesNot from "@/components/sections/WhatBodySignalDoesNot";
import SignalPreview from "@/components/signal/SignalPreview";
import HowItWorks from "@/components/how-it-works/HowItWorks";
import DesignedForEveryBody from "@/components/sections/DesignedForEveryBody";
import Container from "@/components/ui/Container";


export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Container>
          <HeroSection />
          <div className="grid md:grid-cols-2 gap-10 py-16">
            <WhatBodySignalDoes />
            <WhatBodySignalDoesNot />
          </div>
          <SignalPreview />
          <HowItWorks />
          <DesignedForEveryBody />
        </Container>
      </main>
      <Footer />
    </>
  );
}
