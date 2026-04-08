import { useState, useEffect } from "react";
import HospitalCard from "../components/HospitalCard";
import MapView from "../components/MapView";
import Threads from "../components/Threads";
import MagicBento from "../components/MagicBento";
import { Search, Loader2, ServerCrash } from "lucide-react";
import toast from "react-hot-toast";

const HOSPITAL_IMAGES = [
  "/hospital-1.png",
  "/hospital-2.png",
  "/hospital-3.png",
  "/hospital-4.png",
  "/hospital-5.png",
];

const getImageForHospital = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return HOSPITAL_IMAGES[Math.abs(hash) % HOSPITAL_IMAGES.length];
};

const ML_HOSPITAL_URL = "http://localhost:8001";

export default function Hospitals() {
  const [search, setSearch] = useState("");
  const [cityInput, setCityInput] = useState("Bangalore");
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mlError, setMlError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Fetch hospitals from ML service on mount (default: Bangalore)
  useEffect(() => {
    fetchHospitals("Bangalore");
  }, []);

  const fetchHospitals = async (city) => {
    setLoading(true);
    setMlError(false);
    try {
      const url = `${ML_HOSPITAL_URL}/hospitals-by-city?city=${encodeURIComponent(city)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("ML service error");
      const data = await res.json();

      if (data && data.length > 0) {
        const mapped = data.map((h, i) => ({
          name: h.name,
          address: `${h.city}`,
          rating: parseFloat(h.rating?.toFixed ? h.rating.toFixed(1) : h.rating),
          beds: Math.floor(Math.random() * 20) + 5, // Not in ML data
          phone: "+91 " + Math.floor(Math.random() * 9000000000 + 1000000000),
          coords: null,
          image: HOSPITAL_IMAGES[i % HOSPITAL_IMAGES.length],
          summary: h.summary || "",
          specialties: h.summary
            ? h.summary.split(" ").slice(0, 4).map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            : ["General Medicine", "Surgery", "Emergency Care"],
          matchScore: h.match_score,
        }));
        setHospitals(mapped);
        toast.success(`Found ${mapped.length} hospitals in ${city}`);
      } else {
        setHospitals([]);
        toast.error(`No hospitals found in "${city}". Try another city.`);
      }
    } catch (err) {
      console.error("Hospital ML Error:", err);
      setMlError(true);
      toast.error("Hospital ML service is not running. Start it: python main.py in ml/hospitals");
      // Fall back to static data if ML unavailable
      setHospitals(FALLBACK_HOSPITALS);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) fetchHospitals(cityInput.trim());
  };

  // Client-side search filter
  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.address.toLowerCase().includes(search.toLowerCase()) ||
      h.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pt-28 px-6 pb-20 min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Threads amplitude={1} distance={0} color={[0.4, 0.2, 0.8]} />
      </div>

      <div className="relative z-10">
        <h1 className="text-4xl font-heading font-bold text-white">Hospital Finder</h1>
        <p className="text-zinc-400 mt-2 font-light">
          AI-ranked hospitals by city — powered by real hospital data.
        </p>

        {/* ML Status Banner */}
        {mlError && (
          <div className="mt-4 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 text-sm">
            <ServerCrash className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>ML service offline.</strong> Showing fallback data. Run:{" "}
              <code className="bg-zinc-800 px-1 py-0.5 rounded text-xs">cd backend/ml/hospitals &amp;&amp; python main.py</code>
            </span>
          </div>
        )}

        {/* City Search */}
        <form onSubmit={handleSearch} className="mt-6 flex gap-3 max-w-2xl">
          <input
            type="text"
            placeholder="Search by city (e.g. Mumbai, Delhi, Chennai)..."
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-zinc-500"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Filter hospitals by name/specialty */}
        {hasLoaded && hospitals.length > 0 && (
          <div className="mt-4 max-w-xl">
            <input
              type="text"
              placeholder="Filter by name or specialty..."
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-zinc-500 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-20 flex flex-col items-center gap-4 text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p>Fetching AI-ranked hospitals for <strong>{cityInput}</strong>...</p>
          </div>
        )}

        {/* MAP VIEW */}
        {!loading && filtered.length > 0 && filtered.some((h) => h.coords) && (
          <div className="mt-10">
            <MapView hospitals={filtered.filter((h) => h.coords)} />
          </div>
        )}

        {/* HOSPITALS GRID */}
        {!loading && filtered.length > 0 && (
          <div className="mt-12">
            <p className="text-zinc-500 text-sm mb-6">
              Showing <strong className="text-white">{filtered.length}</strong> hospitals
              {search && ` matching "${search}"`}
            </p>
            <MagicBento
              cards={filtered.map((h) => ({
                title: h.name,
                description: h.address,
                label: h.specialties[0] || "Hospital",
                color: "rgba(0,0,0,0.5)",
                content: (
                  <div className="flex flex-col h-full">
                    <div className="h-32 w-full rounded-lg overflow-hidden mb-4">
                      <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-heading text-lg font-bold">{h.name}</h3>
                    <p className="text-sm text-zinc-400 mb-2">{h.address}</p>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {h.specialties.slice(0, 3).map((spec, i) => (
                        <span key={i} className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full text-zinc-300">
                          {spec}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex justify-between items-center text-xs text-zinc-500 pt-3 border-t border-zinc-800">
                      <span>{h.phone}</span>
                      <span className="text-green-400">★ {typeof h.rating === "number" ? h.rating.toFixed(1) : h.rating}</span>
                    </div>
                  </div>
                ),
              }))}
              glowColor="52, 211, 153"
              enableStars={true}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && hasLoaded && filtered.length === 0 && (
          <div className="mt-20 text-center text-zinc-600">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No hospitals found</p>
            <p className="text-sm mt-2">Try a different city or specialty</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Static fallback data (used only when ML service is offline)
const FALLBACK_HOSPITALS = [
  {
    name: "Apollo Hospital",
    address: "HSR Layout, Bangalore",
    rating: 4.6,
    beds: 18,
    phone: "+918044111111",
    coords: [12.9121, 77.6446],
    image: "/hospital-1.png",
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Emergency Care"],
    summary: "Premier multi-specialty hospital",
    matchScore: 0.9,
  },
  {
    name: "Fortis Healthcare",
    address: "Bannerghatta Road, Bangalore",
    rating: 4.3,
    beds: 12,
    phone: "+918066222222",
    coords: [12.9081, 77.6042],
    image: "/hospital-2.png",
    specialties: ["Cancer Care", "Urology", "Heart Institute", "Radiology"],
    summary: "Specialized oncology and cardiac care",
    matchScore: 0.85,
  },
  {
    name: "Manipal Hospital",
    address: "Whitefield, Bangalore",
    rating: 4.4,
    beds: 20,
    phone: "+918030333333",
    coords: [12.9698, 77.75],
    image: "/hospital-3.png",
    specialties: ["Neurosurgery", "Pediatrics", "Transplants"],
    summary: "Leading multi-specialty care center",
    matchScore: 0.88,
  },
  {
    name: "Narayana Health City",
    address: "Bommasandra, Bangalore",
    rating: 4.5,
    beds: 22,
    phone: "+918022666666",
    coords: [12.82, 77.68],
    image: "/hospital-4.png",
    specialties: ["Cardiac Sciences", "Oncology", "Neonatal ICU"],
    summary: "Affordable world-class cardiac care",
    matchScore: 0.92,
  },
];
