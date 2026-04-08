import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import HeroSection from "../components/HeroSection";
import Section from "../components/Section";
import Button from "../components/Button";
import SpotlightCard from "../components/SpotlightCard";
import Threads from "../components/Threads";
import { motion } from "framer-motion";

export default function Landing() {
  const { isSignedIn, user, isLoaded } = useUser();
  
  // Auto-scroll state and refs for non-signed-in users
  const [currentSection, setCurrentSection] = useState(0);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(true);
  const containerRef = useRef(null);
  const sectionRefs = useRef([]);
  const autoScrollTimerRef = useRef(null);
  const userInteractionTimerRef = useRef(null);
  const totalSections = 4; // Number of sections in non-signed-in view

  // Auto-scroll effect for non-signed-in users
  useEffect(() => {
    if (!isSignedIn && isAutoScrollActive) {
      autoScrollTimerRef.current = setInterval(() => {
        setCurrentSection((prev) => {
          const nextSection = (prev + 1) % totalSections;
          
          // Scroll horizontally to next section
          if (containerRef.current) {
            const sectionWidth = window.innerWidth;
            containerRef.current.scrollTo({
              left: nextSection * sectionWidth,
              behavior: 'smooth'
            });
          }
          
          return nextSection;
        });
      }, 5000); // 5 seconds between scrolls

      return () => {
        if (autoScrollTimerRef.current) {
          clearInterval(autoScrollTimerRef.current);
        }
      };
    }
  }, [isSignedIn, isAutoScrollActive, totalSections]);

  // Handle user interaction to pause auto-scroll
  useEffect(() => {
    if (!isSignedIn) {
      const handleUserInteraction = () => {
        // Pause auto-scroll on user interaction
        setIsAutoScrollActive(false);
        
        // Clear existing timer
        if (userInteractionTimerRef.current) {
          clearTimeout(userInteractionTimerRef.current);
        }
        
        // Resume auto-scroll after 10 seconds of inactivity
        userInteractionTimerRef.current = setTimeout(() => {
          setIsAutoScrollActive(true);
        }, 10000);
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener('wheel', handleUserInteraction);
        container.addEventListener('touchstart', handleUserInteraction);
        container.addEventListener('click', handleUserInteraction);
      }

      return () => {
        if (container) {
          container.removeEventListener('wheel', handleUserInteraction);
          container.removeEventListener('touchstart', handleUserInteraction);
          container.removeEventListener('click', handleUserInteraction);
        }
        if (userInteractionTimerRef.current) {
          clearTimeout(userInteractionTimerRef.current);
        }
      };
    }
  }, [isSignedIn]);

  // Show personalized content if user is signed in
  if (isLoaded && isSignedIn) {
    return (
      <div className="w-full h-screen bg-zinc-950 text-white flex overflow-x-scroll overflow-y-hidden scroll-smooth no-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
        {/* SECTION 1: PERSONALIZED HERO */}
        <div className="min-w-full h-screen flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
          <HeroSection 
            badge={`Welcome back, ${user.firstName}!`}
            title1="Your Journey"
            title2="Continues."
            description="Explore personalized health recommendations, plan your next medical trip, and track your wellness journey—all in one place."
            primaryButton={{ text: "Plan Your Trip", link: "/journey" }}
            secondaryButton={{ text: "View Dashboard", link: "/dashboard" }}
          />
        </div>

        {/* SECTION 2: QUICK ACTIONS */}
        <div className="min-w-full h-screen flex-shrink-0 bg-zinc-900 border-l border-white/5" style={{ scrollSnapAlign: 'start' }}>
        <Section className="bg-zinc-900 border-t-0 border-l-0">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-heading font-bold">Quick Actions</h2>
            <p className="text-zinc-400 mt-4">Everything you need at your fingertips</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/travel">
              <SpotlightCard className="p-8 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-5xl mb-6">✈️</div>
                <h3 className="text-2xl font-bold mb-3 font-heading text-white">Travel Planner</h3>
                <p className="text-zinc-400">Book flights, hotels & cabs</p>
              </SpotlightCard>
            </Link>

            <Link to="/hospitals">
              <SpotlightCard className="p-8 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-5xl mb-6">🏥</div>
                <h3 className="text-2xl font-bold mb-3 font-heading text-white">Find Hospitals</h3>
                <p className="text-zinc-400">Top medical facilities worldwide</p>
              </SpotlightCard>
            </Link>

            <Link to="/medical-form">
              <SpotlightCard className="p-8 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-5xl mb-6">🧠</div>
                <h3 className="text-2xl font-bold mb-3 font-heading text-white">AI Diagnosis</h3>
                <p className="text-zinc-400">Instant medical analysis</p>
              </SpotlightCard>
            </Link>

            <Link to="/yoga">
              <SpotlightCard className="p-8 hover:scale-105 transition-transform cursor-pointer">
                <div className="text-5xl mb-6">🧘</div>
                <h3 className="text-2xl font-bold mb-3 font-heading text-white">Wellness</h3>
                <p className="text-zinc-400">Yoga & meditation retreats</p>
              </SpotlightCard>
            </Link>
          </div>
        </Section>
        </div>

        {/* SECTION 3: YOUR HEALTH STATS */}
        <div className="min-w-full h-screen flex-shrink-0 bg-zinc-950 border-l border-white/5" style={{ scrollSnapAlign: 'start' }}>
        <Section className="bg-zinc-950 border-t-0 border-l-0">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h2
                className="text-4xl md:text-6xl font-heading font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500"
              >
                Your Health Journey
              </motion.h2>
              <p className="text-xl text-zinc-400 leading-relaxed font-light mb-8">
                Track your medical history, upcoming appointments, and personalized wellness recommendations.
              </p>
              <Link to="/profile">
                <Button variant="outline" className="px-8 py-3">
                  Manage Profile
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SpotlightCard className="p-6">
                <div className="text-3xl mb-2">📊</div>
                <h4 className="text-2xl font-bold text-white">3</h4>
                <p className="text-zinc-400 text-sm">Recent Diagnoses</p>
              </SpotlightCard>
              <SpotlightCard className="p-6">
                <div className="text-3xl mb-2">🏥</div>
                <h4 className="text-2xl font-bold text-white">5</h4>
                <p className="text-zinc-400 text-sm">Saved Hospitals</p>
              </SpotlightCard>
              <SpotlightCard className="p-6">
                <div className="text-3xl mb-2">✈️</div>
                <h4 className="text-2xl font-bold text-white">2</h4>
                <p className="text-zinc-400 text-sm">Planned Trips</p>
              </SpotlightCard>
              <SpotlightCard className="p-6">
                <div className="text-3xl mb-2">💚</div>
                <h4 className="text-2xl font-bold text-white">Low</h4>
                <p className="text-zinc-400 text-sm">Risk Score</p>
              </SpotlightCard>
            </div>
          </div>
        </Section>
        </div>

        {/* SECTION 4: CALL TO ACTION */}
        <div className="min-w-full h-screen flex-shrink-0 bg-white border-l border-zinc-200" style={{ scrollSnapAlign: 'start' }}>
        <Section className="bg-white text-black border-t-0 border-l-0">
          <div className="text-center max-w-4xl">
            <h2 className="text-5xl md:text-8xl font-heading font-black mb-8 tracking-tighter">
              Ready for your next journey?
            </h2>
            <div className="flex justify-center gap-6">
              <Link to="/travel">
                <Button variant="primary" className="px-10 py-5 text-zinc-200 bg-zinc-950 border-none hover:text-white">
                  Start Planning
                </Button>
              </Link>
            </div>
          </div>
        </Section>
        </div>
      </div>
    );
  }

  // Show normal landing page if not signed in
  return (
    <div 
      ref={containerRef}
      className="w-full h-screen bg-zinc-950 text-white flex overflow-x-scroll overflow-y-hidden scroll-smooth no-scrollbar"
      style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
    >
      {/* SECTION 1: HERO */}
      <div 
        ref={(el) => (sectionRefs.current[0] = el)}
        className="min-w-full h-screen flex-shrink-0"
        style={{ scrollSnapAlign: 'start' }}
      >
        <HeroSection />
      </div>

      {/* SECTION 2: VALUE PROP */}
      <div
        ref={(el) => (sectionRefs.current[1] = el)}
        className="min-w-full h-screen flex-shrink-0 bg-zinc-900 border-l border-white/5"
        style={{ scrollSnapAlign: 'start' }}
      >
        <Section className="bg-zinc-900 border-t-0 border-l-0">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <motion.h2
              className="text-4xl md:text-6xl font-heading font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500"
            >
              Precision Diagnosis. <br /> Global Care.
            </motion.h2>
            <p className="text-xl text-zinc-400 leading-relaxed font-light">
              Our AI analyzes your reports instantly, matching you with the world's top specialists.
              No more waiting. No more uncertainty. Just world-class healthcare at your fingertips.
            </p>
            <Button variant="outline" className="mt-8 px-8 py-3">
              See How It Works
            </Button>
          </div>
          <div className="h-[400px] w-full bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
            <div className="z-10 bg-black/50 backdrop-blur-md p-6 rounded-xl border border-white/10">
              <span className="text-4xl">🏥</span>
            </div>
          </div>
        </div>
      </Section>
      </div>

      {/* SECTION 3: FEATURES GRID */}
      <div
        ref={(el) => (sectionRefs.current[2] = el)}
        className="min-w-full h-screen flex-shrink-0 bg-zinc-950"
        style={{ scrollSnapAlign: 'start' }}
      >
        <Section className="bg-zinc-950 border-t-0">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold">Everything you need to heal.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "AI Diagnostics", icon: "🧠", desc: "Instant analysis of medical reports with 99% accuracy." },
            { title: "Global Hospitals", icon: "🌍", desc: "Access to accredited hospitals in 20+ countries." },
            { title: "Wellness Travel", icon: "🧘", desc: "Recover in serenity with curated yoga & spa retreats." }
          ].map((feature, i) => (
            <SpotlightCard key={i} className="p-8">
              <div className="text-5xl mb-6">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-3 font-heading text-white">{feature.title}</h3>
              <p className="text-zinc-400">{feature.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </Section>
      </div>

      {/* SECTION 4: CALL TO ACTION */}
      <div
        ref={(el) => (sectionRefs.current[3] = el)}
        className="min-w-full h-screen flex-shrink-0 bg-white"
        style={{ scrollSnapAlign: 'start' }}
      >
        <Section className="bg-white text-black border-t-0">
        <div className="text-center max-w-4xl">
          <h2 className="text-5xl md:text-8xl font-heading font-black mb-8 tracking-tighter">
            Ready to start your journey?
          </h2>
          <div className="flex justify-center gap-6">
            <Link to="/signup">
              <Button variant="primary" className="px-10 py-5 text-zinc-200 bg-zinc-950 border-none hover:text-white">
                Join HealTrip
              </Button>
            </Link>
          </div>
        </div>
      </Section>
      </div>
    </div>
  );
}
