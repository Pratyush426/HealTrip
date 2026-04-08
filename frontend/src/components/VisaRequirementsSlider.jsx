import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock, DollarSign, Users, Flag } from "lucide-react";

const VISA_REQUIREMENTS = {
  India: {
    country: "India",
    flag: "🇮🇳",
    requirements: [
      {
        title: "Medical Visa Letter",
        description: "Visa request letter from the treatment facility",
        icon: "📄",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Passport",
        description: "Valid passport with minimum 6 months validity",
        icon: "🛂",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Medical Documents",
        description: "Patient medical reports and test results",
        icon: "🏥",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        title: "Proof of Funds",
        description: "Bank statements or financial documents",
        icon: "💳",
        color: "from-yellow-500 to-yellow-600",
      },
      {
        title: "Travel Insurance",
        description: "Health/travel insurance covering treatment",
        icon: "🛡️",
        color: "from-red-500 to-red-600",
      },
    ],
    processingTime: "5-7 days",
    validityPeriod: "6-12 months",
    cost: "Free",
  },
  USA: {
    country: "USA",
    flag: "🇺🇸",
    requirements: [
      {
        title: "Medical Visa Letter",
        description: "Letter from verified medical institution",
        icon: "📄",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "DS-160 Form",
        description: "Online visa application form",
        icon: "📋",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Valid Passport",
        description: "At least 6 months validity required",
        icon: "🛂",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        title: "Medical Records",
        description: "Complete medical history and documents",
        icon: "🏥",
        color: "from-yellow-500 to-yellow-600",
      },
      {
        title: "Proof of Residence",
        description: "Address verification documents",
        icon: "🏠",
        color: "from-orange-500 to-orange-600",
      },
      {
        title: "Financial Documents",
        description: "Evidence of funds for treatment & stay",
        icon: "💰",
        color: "from-pink-500 to-pink-600",
      },
    ],
    processingTime: "15-30 days",
    validityPeriod: "Single entry",
    cost: "$160",
  },
  Canada: {
    country: "Canada",
    flag: "🇨🇦",
    requirements: [
      {
        title: "Medical Visa Letter",
        description: "From Canadian medical facility",
        icon: "📄",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Passport",
        description: "Valid for entire stay duration",
        icon: "🛂",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Medical Documents",
        description: "All relevant medical test results",
        icon: "🏥",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        title: "IMM 1444 Form",
        description: "Temporary Resident Visa Application",
        icon: "📋",
        color: "from-yellow-500 to-yellow-600",
      },
      {
        title: "Proof of Financial Support",
        description: "Bank statements and financial records",
        icon: "💳",
        color: "from-red-500 to-red-600",
      },
    ],
    processingTime: "10-20 days",
    validityPeriod: "2-3 years",
    cost: "CAD 100",
  },
  UK: {
    country: "UK",
    flag: "🇬🇧",
    requirements: [
      {
        title: "PVT Sponsor Letter",
        description: "From private healthcare provider",
        icon: "📄",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Valid Passport",
        description: "Minimum 6 months validity",
        icon: "🛂",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Medical Test Reports",
        description: "Complete medical documentation",
        icon: "🏥",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        title: "Tuberculosis Test",
        description: "TB clearance certificate if required",
        icon: "✓",
        color: "from-yellow-500 to-yellow-600",
      },
      {
        title: "Financial Evidence",
        description: "Proof of funds for treatment costs",
        icon: "💰",
        color: "from-pink-500 to-pink-600",
      },
    ],
    processingTime: "3-8 weeks",
    validityPeriod: "Up to 11 months",
    cost: "£719",
  },
  Thailand: {
    country: "Thailand",
    flag: "🇹🇭",
    requirements: [
      {
        title: "Medical Visa Letter",
        description: "From registered Thai hospital",
        icon: "📄",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Passport",
        description: "Valid for at least 6 months",
        icon: "🛂",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Medical Records",
        description: "Diagnosis and treatment plan",
        icon: "🏥",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        title: "Bank Statement",
        description: "Proof of financial ability",
        icon: "💳",
        color: "from-yellow-500 to-yellow-600",
      },
    ],
    processingTime: "1-3 days",
    validityPeriod: "90 days",
    cost: "Free",
  },
  Germany: {
    country: "Germany",
    flag: "🇩🇪",
    requirements: [
      {
        title: "Medical Visa Letter",
        description: "From German medical institution",
        icon: "📄",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Schengen Requirements",
        description: "Standard Schengen visa requirements",
        icon: "🛂",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Medical Documents",
        description: "Complete medical history",
        icon: "🏥",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        title: "Travel Insurance",
        description: "Medical insurance coverage €30,000+",
        icon: "🛡️",
        color: "from-red-500 to-red-600",
      },
      {
        title: "Proof of Funds",
        description: "Bank statements and income proof",
        icon: "💰",
        color: "from-pink-500 to-pink-600",
      },
    ],
    processingTime: "5-15 days",
    validityPeriod: "90 days (Schengen)",
    cost: "€90",
  },
  Turkey: {
    country: "Turkey",
    flag: "🇹🇷",
    requirements: [
      {
        title: "Medical Visa Letter",
        description: "From Turkish healthcare facility",
        icon: "📄",
        color: "from-blue-500 to-blue-600",
      },
      {
        title: "Passport",
        description: "Valid for stay duration",
        icon: "🛂",
        color: "from-purple-500 to-purple-600",
      },
      {
        title: "Medical Reports",
        description: "Treatment documentation",
        icon: "🏥",
        color: "from-emerald-500 to-emerald-600",
      },
      {
        title: "Bank Statement",
        description: "Financial proof",
        icon: "💳",
        color: "from-yellow-500 to-yellow-600",
      },
    ],
    processingTime: "1-3 days",
    validityPeriod: "30-90 days",
    cost: "Free",
  },
};

export default function VisaRequirementsSlider({ userCountry = "India" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const countries = Object.keys(VISA_REQUIREMENTS);
  const initialIndex = countries.indexOf(userCountry);
  
  useEffect(() => {
    if (initialIndex !== -1) {
      setCurrentIndex(initialIndex);
    }
  }, [userCountry, initialIndex]);

  const currentCountryData = VISA_REQUIREMENTS[countries[currentIndex]];

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % countries.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + countries.length) % countries.length);
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      zIndex: 0,
      x: dir > 0 ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">
              Visa Requirements by Destination
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            {currentIndex + 1} of {countries.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative h-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="p-6 md:p-8"
          >
            {/* Country Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{currentCountryData.flag}</span>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {currentCountryData.country}
                  </h2>
                  <p className="text-zinc-400 text-sm mt-1">Medical Visa Information</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-zinc-400">Processing Time</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {currentCountryData.processingTime}
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-zinc-400">Validity Period</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {currentCountryData.validityPeriod}
                  </p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-zinc-400">Application Cost</span>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {currentCountryData.cost}
                  </p>
                </div>
              </div>
            </div>

            {/* Requirements Grid */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
                Required Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCountryData.requirements.map((req, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group cursor-pointer"
                  >
                    <div
                      className={`h-full p-4 rounded-xl bg-gradient-to-br ${req.color} bg-opacity-10 border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-lg`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-2xl">{req.icon}</span>
                        {/* <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition" /> */}
                      </div>
                      <h4 className="font-semibold text-white mb-2 text-sm group-hover:text-blue-200 transition">
                        {req.title}
                      </h4>
                      <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition">
                        {req.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-6 border-t border-white/10 bg-zinc-950/50 backdrop-blur">
        <button
          onClick={handlePrev}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Country Dots */}
        <div className="flex gap-2 flex-wrap justify-center">
          {countries.map((country, idx) => (
            <motion.button
              key={idx}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-blue-400 w-8"
                  : "bg-white/20 hover:bg-white/40"
              }`}
              title={countries[idx]}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
