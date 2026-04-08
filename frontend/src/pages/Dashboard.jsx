import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, HeartPulse, Map, Hospital, Stethoscope, Loader2, Bot, MessageSquare, ArrowRight, Droplets, MapPin, Search, Plane, Hotel, Car, CalendarCheck } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../context/UserProfileContext";
import { BACKEND_URL } from "../apiUrl";

// Mock top hospitals for the curated home view
const TOP_HOSPITALS = [
  { name: "Apollo Hospital", city: "Bangalore", rating: 4.8, specialty: "Multi-specialty", image: "/hospital-1.png" },
  { name: "AIIMS", city: "New Delhi", rating: 4.9, specialty: "Research & Advanced Care", image: "/hospital-2.png" },
  { name: "Tata Memorial", city: "Mumbai", rating: 4.7, specialty: "Oncology", image: "/hospital-3.png" },
  { name: "CMC Hospital", city: "Vellore", rating: 4.8, specialty: "Neurology", image: "/hospital-4.png" }
];

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const [recentMessages, setRecentMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/chat/history/${user.id}`);
        const data = await res.json();
        if (res.ok && data.data) {
          const allMessages = data.data.messages || [];
          const botMessages = allMessages
            .filter((m) => m.role === "bot")
            .slice(-2) // Just get last 2 for compact view
            .reverse();
          setRecentMessages(botMessages);
        }
      } catch (err) {
        console.warn("Could not fetch chat history:", err.message);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const { fullName, age, bloodGroup, conditions, symptoms, homeCity } = profile;
  const firstName = fullName?.split(" ")[0] || user.firstName;
  const initials = firstName?.[0] || user.firstName?.[0] || "?";

  return (
    <div className="pt-28 px-8 pb-20 min-h-screen bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HERO SECTION - Personalized Welcome & CTA */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 p-8 md:p-12">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
           
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20">
                    {initials}
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Welcome back</p>
                    <h1 className="text-3xl font-bold">{firstName}</h1>
                  </div>
                </motion.div>
                
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-bold leading-tight mb-4 tracking-tight">
                  Ready to plan your <br/>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Medical Journey?</span>
                </motion.h2>
                
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-zinc-400 text-lg mb-8 max-w-md">
                  We'll guide you step-by-step from choosing the right hospital in India to booking your flights, hotels, and cabs.
                </motion.p>
                
                <motion.button
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  onClick={() => navigate("/journey")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg overflow-hidden transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
                >
                  <span className="relative z-10">Start Your Journey</span>
                  <div className="relative z-10 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </motion.button>
              </div>

              {/* Profile Summary Card */}
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
                 <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-4">
                    <Activity className="w-4 h-4 text-emerald-400" /> Health Profile
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Age</p>
                      <p className="font-medium">{age || "--"}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Blood Group</p>
                      <p className="font-medium flex items-center gap-1"><Droplets className="w-3 h-3 text-red-400"/> {bloodGroup || "--"}</p>
                    </div>
                 </div>

                 {symptoms?.length > 0 && (
                   <div className="mb-4">
                     <p className="text-zinc-500 text-xs mb-2">Current Symptoms</p>
                     <div className="flex flex-wrap gap-1.5">
                       {symptoms.slice(0, 3).map((s, i) => (
                         <span key={i} className="text-[10px] bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-full">{s}</span>
                       ))}
                       {symptoms.length > 3 && <span className="text-[10px] text-zinc-500 px-2 py-0.5">+{symptoms.length - 3}</span>}
                     </div>
                   </div>
                 )}

                 {conditions?.length > 0 && (
                   <div>
                     <p className="text-zinc-500 text-xs mb-2">Pre-existing Conditions</p>
                     <div className="flex flex-wrap gap-1.5">
                       {conditions.slice(0, 3).map((c, i) => (
                         <span key={i} className="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">{c}</span>
                       ))}
                     </div>
                   </div>
                 )}
              </motion.div>
           </div>
        </div>

        {/* BOTTOM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Top Hospitals Curator */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2"><Hospital className="w-5 h-5 text-blue-400"/> Top Indian Hospitals</h3>
                <button onClick={() => navigate("/journey")} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">Explore All <ArrowRight className="w-3 h-3"/></button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TOP_HOSPITALS.map((h, i) => (
                  <div key={i} className="group flex items-center gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl p-3 hover:bg-zinc-800 transition cursor-pointer" onClick={() => navigate("/journey")}>
                     <img src={h.image} alt={h.name} className="w-20 h-20 rounded-xl object-cover" />
                     <div>
                       <h4 className="font-bold text-white group-hover:text-blue-400 transition">{h.name}</h4>
                       <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1 font-medium"><MapPin className="w-3 h-3" /> {h.city}</p>
                       <div className="flex items-center gap-2 mt-2 text-[10px]">
                         <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">★ {h.rating}</span>
                         <span className="bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{h.specialty}</span>
                       </div>
                     </div>
                  </div>
                ))}
              </div>
           </motion.div>

           {/* Quick Actions & Chat */}
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-6">
              
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><Bot className="w-5 h-5 text-indigo-400"/> Consult HealAI</h3>
                  <p className="text-sm text-zinc-400 mb-4">Not sure which specialty you need? Chat with our AI doctor first.</p>
                  <button onClick={() => navigate("/heal-chat")} className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition">Start Consultation</button>
                </div>
                <Bot className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-500/10 rotate-12" />
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><Plane className="w-5 h-5 text-blue-400"/> Medical Visa Letters</h3>
                  <p className="text-sm text-zinc-400 mb-4">Generate professional visa request letters for your medical treatment.</p>
                  <button onClick={() => navigate("/visa-requests")} className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition">View Visa Requests</button>
                </div>
                <Plane className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-500/10 rotate-12" />
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                 <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-zinc-400 uppercase tracking-wider"><MessageSquare className="w-4 h-4"/> Recent AI Notes</h3>
                 {loadingHistory ? (
                   <div className="flex items-center justify-center py-6 text-zinc-600"><Loader2 className="w-5 h-5 animate-spin"/></div>
                 ) : recentMessages.length > 0 ? (
                   <div className="space-y-4">
                     {recentMessages.map((msg, i) => (
                       <div key={i} className="text-xs text-zinc-400 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 line-clamp-3">
                         {msg.content}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-6 text-sm text-zinc-600">No recent consultations</div>
                 )}
              </div>

           </motion.div>

        </div>

        {/* ACTIVE JOURNEY SECTION */}
        {profile.activeJourney && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 bg-zinc-900/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center shrink-0">
                   <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-xl font-bold">Your Upcoming Journey to {profile.activeJourney.city}</h3>
                   <p className="text-sm text-zinc-400">Everything is booked and ready.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                 {/* Hospital */}
                 <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold text-sm">
                       <Hospital className="w-4 h-4"/> Medical Facility
                    </div>
                    <p className="font-bold text-lg">{profile.activeJourney.hospital?.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">Multi-specialty • ★{profile.activeJourney.hospital?.rating || 4.5}</p>
                 </div>
                 
                 {/* Flight */}
                 <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-purple-400 mb-2 font-bold text-sm">
                       <Plane className="w-4 h-4"/> Flight
                    </div>
                    <p className="font-bold text-lg">{profile.activeJourney.flight?.airline}</p>
                    <p className="text-xs text-zinc-400 mt-1">{profile.homeCity || "Your City"} → {profile.activeJourney.city}</p>
                 </div>
                 
                 {/* Hotel */}
                 <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold text-sm">
                       <Hotel className="w-4 h-4"/> Accommodation
                    </div>
                    <p className="font-bold text-lg truncate">{profile.activeJourney.hotel?.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">Near {profile.activeJourney.hospital?.name}</p>
                 </div>
                 
                 {/* Taxi */}
                 <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-amber-400 mb-2 font-bold text-sm">
                       <Car className="w-4 h-4"/> Transport
                    </div>
                    <p className="font-bold text-lg">{profile.activeJourney.taxi?.name}</p>
                    <p className="text-xs text-zinc-400 mt-1">Booked for {profile.activeJourney.taxiDays} days</p>
                 </div>
              </div>
           </motion.div>
        )}

      </div>
    </div>
  );
}
