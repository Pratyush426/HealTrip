import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import Button from "./Button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [onWhiteSection, setOnWhiteSection] = useState(false);
  const location = useLocation();
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Detect if we're on the white section (landing page only)
      if (location.pathname === "/") {
        const landingContainer = document.querySelector('.overflow-x-scroll');
        if (landingContainer) {
          const scrollLeft = landingContainer.scrollLeft;
          const scrollWidth = landingContainer.scrollWidth;
          const clientWidth = landingContainer.clientWidth;
          
          // Calculate which section we're on (0-3 for 4 sections)
          // Section 4 (index 3) is the white section
          const totalScrollable = scrollWidth - clientWidth;
          const scrollPercentage = scrollLeft / totalScrollable;
          
          // If we're more than 75% scrolled, we're on the last (white) section
          setOnWhiteSection(scrollPercentage > 0.75);
        }
      } else {
        setOnWhiteSection(false);
      }
    };
    
    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll);
    
    // For horizontal scroll on landing page
    const landingContainer = document.querySelector('.overflow-x-scroll');
    if (landingContainer) {
      landingContainer.addEventListener("scroll", handleScroll);
    }
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (landingContainer) {
        landingContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [location.pathname]);

  const navLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Hospitals", path: "/hospitals" },
    { name: "Flights", path: "/travel" },
    { name: "Journey", path: "/journey" },
    { name: "Wellness", path: "/yoga" },
    { name: "Visa Requests", path: "/visa-requests" },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div
        className={`
            pointer-events-auto
            flex items-center gap-2 p-2 rounded-full 
            transition-all duration-500 ease-[0.16,1,0.3,1]
            ${onWhiteSection 
              ? "bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 shadow-2xl" 
              : scrolled 
                ? "bg-zinc-900/60 backdrop-blur-xl border border-white/10 shadow-2xl scale-95" 
                : "bg-transparent border border-transparent"
            }
        `}
      >
        {/* LOGO */}
        <Link to="/" className="px-4 flex items-center gap-2 group">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 ${onWhiteSection ? 'bg-zinc-950' : 'bg-white'}`}>
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className={onWhiteSection ? 'text-white' : 'text-black'}
            >
              ✦
            </motion.div>
          </div>
          <span className={`font-heading font-bold text-lg tracking-tight transition-all duration-500 ${onWhiteSection ? 'text-zinc-950' : 'text-white'}`}>
            HealTrip
          </span>
        </Link>

        {/* LINKS DECOUPLED FOR CLEANER LOOK */}
        <div className="hidden md:flex items-center bg-zinc-950/50 backdrop-blur-md rounded-full px-1 border border-white/5 mx-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="relative px-5 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              {location.pathname === link.path && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-zinc-800 rounded-full -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {link.name}
            </Link>
          ))}
        </div>

        {/* AUTH - Conditional based on sign-in status */}
        <div className="flex items-center gap-2 pl-2">
          {isLoaded && isSignedIn ? (
            // Signed in - show Profile and Logout
            <>
              <Link to="/profile">
                <Button variant="ghost" className="px-4 py-2 text-xs !flex !flex-row items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.firstName?.[0]}
                  </div>
                  <span className="font-medium">Profile</span>
                </Button>
              </Link>
              <Button 
                variant="primary" 
                className="px-5 py-2 text-xs"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            // Not signed in - show Login and Sign Up
            <>
              <Link to="/login">
                <Button variant="ghost" className="px-4 py-2 text-xs">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" className="px-5 py-2 text-xs">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
