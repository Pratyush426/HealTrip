import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Hospital, Plane, Hotel, Car, CheckCircle, 
  ChevronRight, ArrowRight, Star, Loader2, IndianRupee, Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { useUserProfile } from "../context/UserProfileContext";
import { useNavigate } from "react-router-dom";
import VisaRequirementsSlider from "../components/VisaRequirementsSlider";

// Constants & Mocks
const INDIAN_CITIES = ["Bangalore", "Mumbai", "New Delhi", "Chennai", "Hyderabad", "Kolkata", "Pune", "Ahmedabad"];
const TAXI_PROVIDERS = [
  { name: "Ola Rentals", type: "Sedan", basePrice: 1500, icon: "🚗", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { name: "Uber Extra", type: "SUV", basePrice: 2200, icon: "🚙", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { name: "Rapido Local", type: "Auto", basePrice: 800, icon: "🛺", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
];

const HOSPITAL_IMAGES = [
  "/hospital-1.png",
  "/hospital-2.png",
  "/hospital-3.png",
  "/hospital-4.png",
  "/hospital-5.png",
];

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
  "https://images.unsplash.com/photo-1551776235-dde6d4829808?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
];

const STEPS = [
  { id: 1, title: "Destination", icon: MapPin },
  { id: 2, title: "Hospital", icon: Hospital },
  { id: 3, title: "Flights", icon: Plane },
  { id: 4, title: "Hotels", icon: Hotel },
  { id: 5, title: "Transport", icon: Car },
  { id: 6, title: "Summary", icon: CheckCircle },
];

export default function JourneyPlanner() {
  const { profile, updateProfile } = useUserProfile();
  const navigate = useNavigate();

  // Active step
  const [activeStep, setActiveStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1);

  // Selections
  const [selections, setSelections] = useState({
    city: "",
    hospital: null,
    flight: null,
    hotel: null,
    taxi: null,
    taxiDays: 1
  });

  // Data states
  const [hospitals, setHospitals] = useState([]);
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({ hospitals: false, flights: false, hotels: false });

  // Update selection utility
  const select = (key, value) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  };

  // Progression
  const unlockNext = () => {
    if (activeStep < 6) {
      const next = activeStep + 1;
      setActiveStep(next);
      if (next > highestStep) setHighestStep(next);
    }
  };

  // Calculate Total
  const calculateTotal = () => {
    let total = 0;
    if (selections.flight) total += selections.flight.price;
    if (selections.hotel) total += selections.hotel.price; // Per night default
    if (selections.taxi) total += selections.taxi.basePrice * selections.taxiDays;
    return total;
  };

  // STEP 2: Fetch Hospitals when City is chosen
  useEffect(() => {
    if (selections.city && activeStep === 2 && hospitals.length === 0) {
      const fetchHospitals = async () => {
        setLoading(p => ({ ...p, hospitals: true }));
        try {
          // Combine user's conditions and symptoms to pass as the disease target
          const conditionsStr = profile.conditions?.join(" ") || "";
          const symptomsStr = profile.symptoms?.join(" ") || "";
          const healthQuery = `${conditionsStr} ${symptomsStr}`.trim();
          
          let url = `http://localhost:8001/hospitals-by-city?city=${encodeURIComponent(selections.city)}`;
          if (healthQuery) {
            url += `&disease=${encodeURIComponent(healthQuery)}`;
          }

          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            
            // If ML found curated results based on disease
            if (data && data.length > 0) {
                setHospitals(data.slice(0, 6)); // Top 6 curated
            } else if (healthQuery) {
                // Fallback to top rated in city if no specific ML match found for this disease in this city
                const fallbackRes = await fetch(`http://localhost:8001/hospitals-by-city?city=${encodeURIComponent(selections.city)}`);
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    setHospitals(fallbackData.slice(0, 6));
                } else {
                    setHospitals(MOCK_HOSPITALS);
                }
            } else {
                // If it was just a city query with no results
                setHospitals(MOCK_HOSPITALS);
            }
          } else {
            toast.error("ML Service down. Using mock data.");
            setHospitals(MOCK_HOSPITALS);
          }
        } catch (e) {
           setHospitals(MOCK_HOSPITALS);
        } finally {
          setLoading(p => ({ ...p, hospitals: false }));
        }
      };
      fetchHospitals();
    }
  }, [activeStep, selections.city, hospitals.length, profile.conditions, profile.symptoms]);

  // STEP 3: Fetch Flights (uses user's home city)
  useEffect(() => {
    if (activeStep === 3 && flights.length === 0) {
      if (!profile.homeCity) {
        toast("Please update your home city in profile to search flights easily", { icon: "ℹ️" });
      }
      const fetchFlights = async () => {
        setLoading(p => ({ ...p, flights: true }));
        try {
          const origin = profile.homeCity || "Delhi";
          const dest = selections.city || "Bangalore";
          const res = await fetch(`http://localhost:8002/recommend-flights?origin=${origin}&destination=${dest}`);
          if (res.ok) {
            const data = await res.json();
            setFlights(data.slice(0, 5).map((f, i) => ({
              id: i, airline: f.Airline, price: f.Price, origin: f.Origin, dest: f.Destination, stops: f.num_stops, duration: f.duration_minutes
            })));
          } else {
            setFlights(generateMockFlights(origin, dest));
          }
        } catch (e) {
          setFlights(generateMockFlights(profile.homeCity || "Delhi", selections.city));
        } finally {
          setLoading(p => ({ ...p, flights: false }));
        }
      };
      fetchFlights();
    }
  }, [activeStep, flights.length, profile.homeCity, selections.city]);

  // STEP 4: Fetch Hotels
  useEffect(() => {
    if (activeStep === 4 && hotels.length === 0) {
      const fetchHotels = async () => {
        setLoading(p => ({ ...p, hotels: true }));
        try {
          const res = await fetch(`http://localhost:8000/recommend?location=${selections.city}`);
          if (res.ok) {
            const data = await res.json();
            setHotels(data.results.slice(0, 6).map((h, i) => ({
              id: i, name: h.Hotel_Name, rating: h.Hotel_Rating, price: h.Hotel_Price, amenities: h.amenities
            })));
          } else {
            setHotels(MOCK_HOTELS);
          }
        } catch (e) {
          setHotels(MOCK_HOTELS);
        } finally {
          setLoading(p => ({ ...p, hotels: false }));
        }
      };
      fetchHotels();
    }
  }, [activeStep, selections.city, hotels.length]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex pt-20">
      
      {/* LEFT SIDEBAR - Progress Navigator */}
      <div className="w-64 border-r border-white/5 p-8 hidden lg:flex flex-col fixed left-0 top-20 bottom-0 bg-zinc-950 z-10">
         <h2 className="text-xl font-bold mb-8">Journey Planner</h2>
         
         <div className="flex flex-col gap-6 relative">
            {/* Connecting line */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-zinc-800 z-0" />
            
            {STEPS.map((step) => {
              const isActive = activeStep === step.id;
              const isLocked = step.id > highestStep;
              const isCompleted = step.id < activeStep || (step.id === 6 && activeStep === 6);
              
              return (
                <button 
                  key={step.id}
                  disabled={isLocked}
                  onClick={() => setActiveStep(step.id)}
                  className={`relative z-10 flex items-center gap-4 group transition-all ${isLocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      <step.icon className="w-4 h-4" />
                   </div>
                   <div className="text-left">
                     <p className={`font-medium transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500'}`}>{step.title}</p>
                     {isCompleted && step.id === 1 && <p className="text-xs text-blue-400">{selections.city}</p>}
                     {isCompleted && step.id === 2 && <p className="text-xs text-blue-400 truncate w-32">{selections.hospital?.name}</p>}
                     {isCompleted && step.id === 3 && <p className="text-xs text-blue-400">{selections.flight?.airline}</p>}
                   </div>
                </button>
              );
            })}
         </div>

         <div className="mt-auto bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
           <p className="text-xs text-blue-300">Need help? Chat with HealAI at any time.</p>
         </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:ml-64 p-6 md:p-12 pb-32 md:pb-32 overflow-hidden">
        <AnimatePresence mode="wait">
           
           {/* STEP 1: DESTINATION */}
           {activeStep === 1 && (
             <StepWrapper key="s1" title="Where would you like to travel for treatment?" subtitle="Select a major medical hub in India">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                 {INDIAN_CITIES.map(city => (
                   <button
                     key={city}
                     onClick={() => { select("city", city); select("hospital", null); unlockNext(); setHospitals([]); setFlights([]); setHotels([]); }}
                     className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                       selections.city === city 
                       ? "bg-blue-500/10 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.15)]" 
                       : "bg-zinc-900 border-white/5 hover:bg-zinc-800 hover:border-white/20"
                     }`}
                   >
                     <MapPin className={`w-8 h-8 ${selections.city === city ? "text-blue-400" : "text-zinc-500"}`} />
                     <span className="font-bold">{city}</span>
                     {selections.city === city && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 blur-[2px]" />}
                   </button>
                 ))}
               </div>
             </StepWrapper>
           )}

           {/* STEP 2: HOSPITAL */}
           {activeStep === 2 && (
             <StepWrapper key="s2" title={`Top Hospitals in ${selections.city}`} subtitle="AI-curated based on specialty rankings">
               {loading.hospitals ? <Loader msg="Analyzing medical data..." /> : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                   {hospitals.map((h, i) => (
                     <div key={i} className={`relative flex flex-col bg-zinc-900 border rounded-2xl overflow-hidden transition-all cursor-pointer ${
                       selections.hospital?.name === h.name ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] scale-[1.02]" : "border-white/5 hover:border-white/20 hover:-translate-y-1"
                     }`} onClick={() => select("hospital", h)}>
                        {selections.hospital?.name === h.name && (
                          <div className="absolute top-3 right-3 z-10 bg-emerald-500 text-white p-1 rounded-full"><CheckCircle className="w-5 h-5"/></div>
                        )}
                        <img src={HOSPITAL_IMAGES[i % HOSPITAL_IMAGES.length]} alt={h.name} className="h-40 w-full object-cover opacity-80" />
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="font-bold text-lg leading-tight mb-1">{h.name}</h3>
                          <p className="text-zinc-400 text-sm mb-3">{(h.city || h.address || selections.city).slice(0, 30)}</p>
                          <div className="flex gap-2 text-xs mb-4">
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-bold">★ {h.rating || 4.5}</span>
                            <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded truncate">Multi-specialty</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); select("hospital", h); unlockNext(); }} className={`mt-auto py-2 rounded-xl text-sm font-bold w-full transition-colors ${selections.hospital?.name === h.name ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                            {selections.hospital?.name === h.name ? "Selected ✓" : "Select Hospital"}
                          </button>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </StepWrapper>
           )}

           {/* STEP 3: FLIGHTS */}
           {activeStep === 3 && (
             <StepWrapper key="s3" title="Book Your Flight" subtitle={`From ${profile.homeCity || "Your City"} to ${selections.city}`}>
               {loading.flights ? <Loader msg="Searching airline databases..." /> : (
                 <div className="flex flex-col gap-4 mt-8 max-w-4xl">
                   {flights.map((f, i) => (
                     <div key={i} onClick={() => select("flight", f)} className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                       selections.flight?.id === f.id ? "bg-blue-900/20 border-blue-500" : "bg-zinc-900 border-white/5 hover:border-white/20"
                     }`}>
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-bold text-xl">{f.airline[0]}</div>
                           <div>
                             <h4 className="font-bold text-lg">{f.airline}</h4>
                             <p className="text-zinc-400 text-sm">HT-{1000 + i}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-8 flex-1 justify-center">
                           <div className="text-right">
                             <p className="font-bold text-lg">08:00 AM</p>
                             <p className="text-zinc-500 text-xs">{f.origin}</p>
                           </div>
                           <div className="flex flex-col items-center w-32">
                             <p className="text-[10px] text-zinc-500 mb-1">{Math.floor(f.duration/60)}h {Math.duration%60}m</p>
                             <div className="w-full h-px bg-zinc-700 relative flex justify-center items-center">
                               <Plane className="w-3 h-3 text-zinc-500 absolute bg-zinc-900" />
                             </div>
                             <p className="text-[10px] text-zinc-500 mt-1">{f.stops === 0 ? 'Non-stop' : `${f.stops} Stop`}</p>
                           </div>
                           <div className="text-left">
                             <p className="font-bold text-lg">11:30 AM</p>
                             <p className="text-zinc-500 text-xs">{f.dest}</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-6">
                           <div className="text-right">
                             <p className="text-xl font-bold text-white flex items-center justify-end"><IndianRupee className="w-4 h-4"/>{f.price}</p>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); select("flight", f); unlockNext(); }} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selections.flight?.id === f.id ? 'bg-blue-500 text-white shadow-lg' : 'bg-zinc-800 text-white'}`}>
                             {selections.flight?.id === f.id ? "Selected" : "Select"}
                           </button>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </StepWrapper>
           )}

           {/* STEP 4: HOTELS */}
           {activeStep === 4 && (
             <StepWrapper key="s4" title="Accommodation" subtitle={`Find a comfortable stay near ${selections.hospital?.name}`}>
               {loading.hotels ? <Loader msg="Finding nearest properties..." /> : (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
                   {hotels.map((h, i) => (
                     <div key={i} onClick={() => select("hotel", h)} className={`relative flex flex-col bg-zinc-900 border rounded-2xl overflow-hidden transition-all cursor-pointer ${
                       selections.hotel?.id === h.id ? "border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.15)] scale-[1.02]" : "border-white/5 hover:border-white/20 hover:-translate-y-1"
                     }`}>
                        <div className="h-48 bg-zinc-800 relative">
                           {/* Add multiple placeholder images */}
                           <img src={HOTEL_IMAGES[i % HOTEL_IMAGES.length]} alt={h.name} className="w-full h-full object-cover" />
                           <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white font-bold px-2 py-1 flex items-center gap-1 rounded text-sm"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500"/> {h.rating}</div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                           <h3 className="font-bold text-lg mb-1 truncate">{h.name}</h3>
                           <p className="text-zinc-400 text-xs mb-4">1.2 km from hospital</p>
                           <p className="text-2xl font-bold flex items-center mb-4"><IndianRupee className="w-5 h-5"/>{h.price} <span className="text-sm font-normal text-zinc-500 ml-1">/night</span></p>
                           <button onClick={(e) => { e.stopPropagation(); select("hotel", h); unlockNext(); }} className={`mt-auto py-2.5 rounded-xl text-sm font-bold w-full transition-colors ${selections.hotel?.id === h.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                             {selections.hotel?.id === h.id ? "Selected ✓" : "Select Hotel"}
                           </button>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </StepWrapper>
           )}

           {/* STEP 5: TAXI (MOCKUI) */}
           {activeStep === 5 && (
             <StepWrapper key="s5" title="Local Transport" subtitle="Book a cab for your internal city travel">
               <div className="max-w-4xl mt-8">
                  {/* Days Selector */}
                  <div className="bg-zinc-900 border border-white/5 p-6 rounded-2xl mb-8 flex items-center gap-6">
                     <div>
                       <h3 className="font-bold text-lg mb-1">Duration needed</h3>
                       <p className="text-sm text-zinc-400">How many days will you need the cab?</p>
                     </div>
                     <div className="flex items-center gap-4 bg-black/50 p-2 rounded-xl ml-auto border border-white/5">
                        <button onClick={() => select("taxiDays", Math.max(1, selections.taxiDays - 1))} className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700">-</button>
                        <span className="w-8 text-center font-bold text-lg">{selections.taxiDays}</span>
                        <button onClick={() => select("taxiDays", selections.taxiDays + 1)} className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center hover:bg-zinc-700">+</button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TAXI_PROVIDERS.map((t, i) => {
                      const total = t.basePrice * selections.taxiDays;
                      const isSelected = selections.taxi?.name === t.name;
                      return (
                        <div key={i} onClick={() => select("taxi", t)} className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-56 ${
                          isSelected ? "bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "bg-zinc-900 border-white/5 hover:bg-zinc-800"
                        }`}>
                           <div>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4 border ${t.color}`}>{t.icon}</div>
                              <h3 className="font-bold text-xl">{t.name}</h3>
                              <p className="text-zinc-500 text-sm mt-1">{t.type} • AC Included</p>
                           </div>
                           <div className="mt-4 flex items-end justify-between items-center">
                              <div>
                                <p className="text-2xl font-bold flex items-center"><IndianRupee className="w-5 h-5"/>{total}</p>
                                <p className="text-[10px] text-zinc-500">For {selections.taxiDays} days</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); select("taxi", t); unlockNext(); }} className={`px-4 py-2 rounded-lg text-sm font-bold ${isSelected ? 'bg-amber-500 text-black' : 'bg-white/10'}`}>
                                Select
                              </button>
                           </div>
                        </div>
                      )
                    })}
                  </div>
               </div>
             </StepWrapper>
           )}

           {/* STEP 6: SUMMARY */}
           {activeStep === 6 && (
             <StepWrapper key="s6" title="Journey Summary" subtitle="Review your medical trip details">
                <div className="max-w-3xl mt-8">
                   <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                      
                      <div className="space-y-8 relative z-10">
                         {/* Destination */}
                         <div className="flex gap-6 items-start">
                           <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-1"><MapPin className="w-5 h-5" /></div>
                           <div className="flex-1 pb-8 border-b border-white/5">
                             <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Treatment Destination</p>
                             <h3 className="text-2xl font-bold">{selections.city}</h3>
                           </div>
                         </div>

                         {/* Hospital */}
                         <div className="flex gap-6 items-start">
                           <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-1"><Hospital className="w-5 h-5" /></div>
                           <div className="flex-1 pb-8 border-b border-white/5">
                             <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Medical Facility</p>
                             <h3 className="text-xl font-bold">{selections.hospital?.name}</h3>
                             <p className="text-zinc-400 mt-1">Multi-specialty • Rated ★{selections.hospital?.rating || 4.5}</p>
                           </div>
                         </div>

                         {/* Flight & Hotel combo row */}
                         <div className="flex gap-6 items-start">
                           <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-1"><Plane className="w-5 h-5" /></div>
                           <div className="flex-1">
                             <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Flight</p>
                                  <p className="font-bold">{selections.flight?.airline}</p>
                                  <p className="text-zinc-400 text-sm">{profile.homeCity || "Delhi"} → {selections.city}</p>
                                  <p className="text-blue-400 text-sm font-bold mt-1">₹{selections.flight?.price}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Accommodation</p>
                                  <p className="font-bold truncate">{selections.hotel?.name}</p>
                                  <p className="text-zinc-400 text-sm">Near {selections.hospital?.name}</p>
                                  <p className="text-blue-400 text-sm font-bold mt-1">₹{selections.hotel?.price}/night</p>
                                </div>
                             </div>
                           </div>
                         </div>
                         
                         {/* Taxi */}
                         <div className="flex gap-6 items-start mt-8 pt-8 border-t border-white/5">
                           <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-1"><Car className="w-5 h-5" /></div>
                           <div className="flex-1">
                             <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Local Transport</p>
                             <h3 className="text-lg font-bold">{selections.taxi?.name} • {selections.taxi?.type}</h3>
                             <p className="text-zinc-400 text-sm mt-1">Booked for {selections.taxiDays} days</p>
                             <p className="text-blue-400 text-sm font-bold mt-1">₹{selections.taxi?.basePrice * selections.taxiDays}</p>
                           </div>
                         </div>
                         
                         {/* Total Sum */}
                         <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/5">
                           <div>
                             <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1">Total Estimated Cost</p>
                             <p className="text-xs text-zinc-500">Includes flight, 1 night hotel, and transport</p>
                           </div>
                           <div className="text-4xl font-bold text-emerald-400 flex items-center">
                             <IndianRupee className="w-8 h-8 mr-1 " />{calculateTotal()}
                           </div>
                         </div>

                      </div>
                   </div>

                   {/* Visa Requirements Slider */}
                   <div className="mt-12">
                     <VisaRequirementsSlider userCountry={profile.country || "India"} />
                   </div>

                   <div className="mt-8 flex justify-end">
                     <button onClick={() => {
                        updateProfile({ activeJourney: selections });
                        toast.success("Journey Confirmed! Redirecting to Dashboard...");
                        setTimeout(() => navigate('/dashboard'), 1000);
                     }} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition flex items-center gap-2">
                       Confirm Journey & View in Dashboard <ArrowRight className="w-5 h-5" />
                     </button>
                   </div>
                </div>
             </StepWrapper>
           )}
        </AnimatePresence>
      </div>
      
      {/* Floating Total Bar */}
      {calculateTotal() > 0 && activeStep < 6 && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-white/10 p-4 z-50 flex justify-between items-center px-6 md:px-12 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Estimated Total</span>
                <span className="text-2xl font-bold text-emerald-400 flex items-center">
                    <IndianRupee className="w-5 h-5 mr-1" />
                    {calculateTotal()}
                </span>
            </div>
            
            <div className="hidden md:flex gap-6 text-sm">
                {selections.flight && (
                  <div className="flex flex-col border-l border-white/10 pl-6">
                    <span className="text-zinc-500 text-xs">Flight</span>
                    <span className="font-bold text-zinc-300">₹{selections.flight.price}</span>
                  </div>
                )}
                {selections.hotel && (
                  <div className="flex flex-col border-l border-white/10 pl-6">
                    <span className="text-zinc-500 text-xs">Hotel (1 night)</span>
                    <span className="font-bold text-zinc-300">₹{selections.hotel.price}</span>
                  </div>
                )}
                {selections.taxi && (
                  <div className="flex flex-col border-l border-white/10 pl-6">
                    <span className="text-zinc-500 text-xs">Transport ({selections.taxiDays} days)</span>
                    <span className="font-bold text-zinc-300">₹{selections.taxi.basePrice * selections.taxiDays}</span>
                  </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

// UI Helpers
const StepWrapper = ({ title, subtitle, children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="h-full w-full"
    transition={{ duration: 0.3 }}
  >
    <div className="max-w-[1000px]">
      <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-xl text-zinc-400 mb-8">{subtitle}</p>
      {children}
    </div>
  </motion.div>
);

const Loader = ({ msg }) => (
  <div className="flex flex-col items-center justify-center p-20 text-zinc-500 gap-4">
    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    <p>{msg}</p>
  </div>
);

// Fallbacks
const MOCK_HOSPITALS = [
  { name: "Apollo Main", rating: 4.8 },
  { name: "Fortis Core", rating: 4.6 },
  { name: "Max Super Specialty", rating: 4.7 }
];
const generateMockFlights = (o, d) => [
  { id: 1, airline: "IndiGo", price: 5400, origin: o, dest: d, stops: 0, duration: 150 },
  { id: 2, airline: "Vistara", price: 8200, origin: o, dest: d, stops: 0, duration: 145 },
  { id: 3, airline: "Air India", price: 6100, origin: o, dest: d, stops: 1, duration: 240 },
];
const MOCK_HOTELS = [
  { id: 1, name: "Taj Residency", rating: 4.9, price: 8500 },
  { id: 2, name: "Lemon Tree Premier", rating: 4.5, price: 4200 },
  { id: 3, name: "Holiday Inn Express", rating: 4.2, price: 3100 },
];
