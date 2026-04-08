import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Trash2,
  MapPin,
  Hospital,
  Flag,
  DollarSign,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../context/UserProfileContext";
import { API_BASE_URL } from "../apiUrl";

const VISA_REQUIREMENTS = {
  India: {
    country: "India",
    flag: "🇮🇳",
    requirements: [
      { title: "Medical Visa Letter", description: "Visa request letter from the treatment facility", icon: "📄", color: "from-blue-500 to-blue-600" },
      { title: "Passport", description: "Valid passport with minimum 6 months validity", icon: "🛂", color: "from-purple-500 to-purple-600" },
      { title: "Medical Documents", description: "Patient medical reports and test results", icon: "🏥", color: "from-emerald-500 to-emerald-600" },
      { title: "Proof of Funds", description: "Bank statements or financial documents", icon: "💳", color: "from-yellow-500 to-yellow-600" },
      { title: "Travel Insurance", description: "Health/travel insurance covering treatment", icon: "🛡️", color: "from-red-500 to-red-600" },
    ],
    processingTime: "5-7 days",
    validityPeriod: "6-12 months",
    cost: "Free",
  },
  USA: {
    country: "USA",
    flag: "🇺🇸",
    requirements: [
      { title: "Medical Visa Letter", description: "Letter from verified medical institution", icon: "📄", color: "from-blue-500 to-blue-600" },
      { title: "DS-160 Form", description: "Online visa application form", icon: "📋", color: "from-purple-500 to-purple-600" },
      { title: "Valid Passport", description: "At least 6 months validity required", icon: "🛂", color: "from-emerald-500 to-emerald-600" },
      { title: "Medical Records", description: "Complete medical history and documents", icon: "🏥", color: "from-yellow-500 to-yellow-600" },
      { title: "Proof of Residence", description: "Address verification documents", icon: "🏠", color: "from-orange-500 to-orange-600" },
      { title: "Financial Documents", description: "Evidence of funds for treatment & stay", icon: "💰", color: "from-pink-500 to-pink-600" },
    ],
    processingTime: "15-30 days",
    validityPeriod: "Single entry",
    cost: "$160",
  },
  Canada: {
    country: "Canada",
    flag: "🇨🇦",
    requirements: [
      { title: "Medical Visa Letter", description: "From Canadian medical facility", icon: "📄", color: "from-blue-500 to-blue-600" },
      { title: "Passport", description: "Valid for entire stay duration", icon: "🛂", color: "from-purple-500 to-purple-600" },
      { title: "Medical Documents", description: "All relevant medical test results", icon: "🏥", color: "from-emerald-500 to-emerald-600" },
      { title: "IMM 1444 Form", description: "Temporary Resident Visa Application", icon: "📋", color: "from-yellow-500 to-yellow-600" },
      { title: "Proof of Financial Support", description: "Bank statements and financial records", icon: "💳", color: "from-red-500 to-red-600" },
    ],
    processingTime: "10-20 days",
    validityPeriod: "2-3 years",
    cost: "CAD 100",
  },
  UK: {
    country: "UK",
    flag: "🇬🇧",
    requirements: [
      { title: "PVT Sponsor Letter", description: "From private healthcare provider", icon: "📄", color: "from-blue-500 to-blue-600" },
      { title: "Valid Passport", description: "Minimum 6 months validity", icon: "🛂", color: "from-purple-500 to-purple-600" },
      { title: "Medical Test Reports", description: "Complete medical documentation", icon: "🏥", color: "from-emerald-500 to-emerald-600" },
      { title: "Tuberculosis Test", description: "TB clearance certificate if required", icon: "✓", color: "from-yellow-500 to-yellow-600" },
      { title: "Financial Evidence", description: "Proof of funds for treatment costs", icon: "💰", color: "from-pink-500 to-pink-600" },
    ],
    processingTime: "3-8 weeks",
    validityPeriod: "Up to 11 months",
    cost: "£719",
  },
  Thailand: {
    country: "Thailand",
    flag: "🇹🇭",
    requirements: [
      { title: "Medical Visa Letter", description: "From registered Thai hospital", icon: "📄", color: "from-blue-500 to-blue-600" },
      { title: "Passport", description: "Valid for at least 6 months", icon: "🛂", color: "from-purple-500 to-purple-600" },
      { title: "Medical Records", description: "Diagnosis and treatment plan", icon: "🏥", color: "from-emerald-500 to-emerald-600" },
      { title: "Bank Statement", description: "Proof of financial ability", icon: "💳", color: "from-yellow-500 to-yellow-600" },
    ],
    processingTime: "1-3 days",
    validityPeriod: "90 days",
    cost: "Free",
  },
  Germany: {
    country: "Germany",
    flag: "🇩🇪",
    requirements: [
      { title: "Medical Visa Letter", description: "From German medical institution", icon: "📄", color: "from-blue-500 to-blue-600" },
      { title: "Schengen Requirements", description: "Standard Schengen visa requirements", icon: "🛂", color: "from-purple-500 to-purple-600" },
      { title: "Medical Documents", description: "Complete medical history", icon: "🏥", color: "from-emerald-500 to-emerald-600" },
      { title: "Travel Insurance", description: "Medical insurance coverage €30,000+", icon: "🛡️", color: "from-red-500 to-red-600" },
      { title: "Proof of Funds", description: "Bank statements and income proof", icon: "💰", color: "from-pink-500 to-pink-600" },
    ],
    processingTime: "5-15 days",
    validityPeriod: "90 days (Schengen)",
    cost: "€90",
  },
  Turkey: {
    country: "Turkey",
    flag: "🇹🇷",
    requirements: [
      { title: "Medical Visa Letter", description: "From Turkish healthcare facility", icon: "📄", color: "from-blue-500 to-blue-600" },
      { title: "Passport", description: "Valid for stay duration", icon: "🛂", color: "from-purple-500 to-purple-600" },
      { title: "Medical Reports", description: "Treatment documentation", icon: "🏥", color: "from-emerald-500 to-emerald-600" },
      { title: "Bank Statement", description: "Financial proof", icon: "💳", color: "from-yellow-500 to-yellow-600" },
    ],
    processingTime: "1-3 days",
    validityPeriod: "30-90 days",
    cost: "Free",
  },
};

const STATUS_COLORS = {
  draft: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  generated: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  verified: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  submitted: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_ICONS = {
  draft: Clock,
  generated: FileText,
  verified: CheckCircle,
  submitted: AlertCircle,
  approved: CheckCircle,
  rejected: AlertCircle,
};

export default function VisaRequests() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  const [visaLetters, setVisaLetters] = useState([]);
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Fetch visa letters on mount
  useEffect(() => {
    if (isLoaded && user) {
      fetchVisaLetters();
    }
  }, [isLoaded, user]);

  const fetchVisaLetters = async () => {
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/visa/user/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVisaLetters(data.data?.visaLetters || []);
      } else {
        toast.error("Failed to load visa letters");
      }
    } catch (error) {
      console.error("Error fetching visa letters:", error);
      toast.error("Error loading visa letters");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisa = async (visaId) => {
    if (!window.confirm("Are you sure you want to delete this visa letter?")) return;

    try {
      setDeleting(visaId);
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE_URL}/visa/${visaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Visa letter deleted");
        setVisaLetters(visaLetters.filter((v) => v._id !== visaId));
        setSelectedVisa(null);
      } else {
        toast.error("Failed to delete visa letter");
      }
    } catch (error) {
      console.error("Error deleting visa:", error);
      toast.error("Error deleting visa letter");
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadPDF = (pdfUrl) => {
    window.open(pdfUrl, "_blank");
  };

  if (!isLoaded) {
    return (
      <div className="pt-28 px-8 pb-20 min-h-screen bg-zinc-950 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="pt-28 px-8 pb-20 min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-400" />
            Medical Visa Requirements
          </h1>
          <p className="text-zinc-400">
            Explore visa requirements for medical travel to different countries
          </p>
        </motion.div>

        {/* Visa Requirements Grid - All Countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.keys(VISA_REQUIREMENTS).map((countryKey) => {
              const countryData = VISA_REQUIREMENTS[countryKey];
              return (
                <motion.div
                  key={countryKey}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-xl border border-white/10 overflow-hidden hover:border-blue-400/30 transition"
                >
                  {/* Country Header */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-white/10 px-6 py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{countryData.flag}</span>
                      <h2 className="text-2xl font-bold text-white">
                        {countryData.country}
                      </h2>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span className="text-zinc-400">Processing</span>
                        </div>
                        <p className="font-semibold text-white text-xs">
                          {countryData.processingTime}
                        </p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="w-3 h-3 text-purple-400" />
                          <span className="text-zinc-400">Validity</span>
                        </div>
                        <p className="font-semibold text-white text-xs">
                          {countryData.validityPeriod}
                        </p>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span className="text-zinc-400">Cost</span>
                        </div>
                        <p className="font-semibold text-white text-xs">
                          {countryData.cost}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">
                      Required Documents
                    </h3>
                    <div className="space-y-3">
                      {countryData.requirements.map((req, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group cursor-pointer"
                        >
                          <div
                            className={`h-full p-4 rounded-xl bg-gradient-to-br ${req.color} bg-opacity-10 border border-white/5 hover:border-white/20 transition-all duration-300`}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-2xl">{req.icon}</span>
                            </div>
                            <h4 className="font-semibold text-white mb-2 text-sm">
                              {req.title}
                            </h4>
                            <p className="text-xs text-zinc-400">
                              {req.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Visa Letters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Your Visa Letters</h2>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : visaLetters.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-zinc-900 border border-white/10 rounded-xl"
            >
              <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h2 className="text-2xl font-bold text-zinc-400 mb-2">
                No Visa Letters Yet
              </h2>
              <p className="text-zinc-500">
                Your generated visa letters will appear here
              </p>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-zinc-800/50">
                    <h3 className="font-semibold text-white">
                      Your Letters ({visaLetters.length})
                    </h3>
                  </div>

                  <div className="max-h-[600px] overflow-y-auto">
                    {visaLetters.map((visa) => {
                      const StatusIcon = STATUS_ICONS[visa.status] || FileText;
                      return (
                        <motion.button
                          key={visa._id}
                          onClick={() => setSelectedVisa(visa)}
                          whileHover={{ x: 4 }}
                          className={`w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition ${
                            selectedVisa?._id === visa._id
                              ? "bg-white/10 border-l-2 border-l-blue-400"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <StatusIcon className="w-5 h-5 mt-1 flex-shrink-0 text-blue-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white truncate text-sm">
                                {visa.visaCountry || "Medical Visa"}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {new Date(visa.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs px-2 py-1 rounded border ${
                                STATUS_COLORS[visa.status]
                              }`}
                            >
                              {visa.status}
                            </span>
                            <span className="text-xs text-zinc-500">v{visa.currentVersion}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Right: Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                {selectedVisa ? (
                  <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 sticky top-32">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                          {selectedVisa.visaCountry || "Medical Visa Request"}
                        </h2>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span
                            className={`text-sm px-3 py-1 rounded-full border font-medium ${
                              STATUS_COLORS[selectedVisa.status]
                            }`}
                          >
                            {selectedVisa.status}
                          </span>
                          <span className="text-sm text-zinc-400">
                            Version {selectedVisa.currentVersion}
                          </span>
                          <span className="text-sm text-zinc-400">
                            {new Date(selectedVisa.generatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {deleting !== selectedVisa._id && (
                        <button
                          onClick={() => handleDeleteVisa(selectedVisa._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    {deleting === selectedVisa._id && (
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        <span className="text-red-400 text-sm">Deleting...</span>
                      </div>
                    )}

                    {/* Content Preview */}
                    <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg max-h-60 overflow-y-auto border border-white/5">
                      <div className="prose prose-invert max-w-none text-sm">
                        {selectedVisa.letterContent.split("\n").map((line, idx) => (
                          <p key={idx} className="text-zinc-300 mb-2">
                            {line.replace(/[#*]/g, "")}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Medical Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {selectedVisa.medicalInfo?.conditions?.length > 0 && (
                        <div className="bg-zinc-800/30 p-3 rounded-lg border border-white/5">
                          <p className="text-xs text-zinc-400 mb-1">Conditions</p>
                          <p className="text-sm text-white">
                            {selectedVisa.medicalInfo.conditions.join(", ")}
                          </p>
                        </div>
                      )}
                      {selectedVisa.medicalInfo?.bloodGroup && (
                        <div className="bg-zinc-800/30 p-3 rounded-lg border border-white/5">
                          <p className="text-xs text-zinc-400 mb-1">Blood Group</p>
                          <p className="text-sm text-white">{selectedVisa.medicalInfo.bloodGroup}</p>
                        </div>
                      )}
                    </div>

                    {/* Treatment Details */}
                    {selectedVisa.treatmentDetails && (
                      <div className="bg-zinc-800/30 p-4 rounded-lg border border-white/5 mb-6">
                        <h4 className="text-sm font-semibold text-white mb-3">
                          Treatment Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          {selectedVisa.treatmentDetails.hospital && (
                            <div className="flex gap-3">
                              <Hospital className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-zinc-400 text-xs">Hospital</p>
                                <p className="text-white">
                                  {selectedVisa.treatmentDetails.hospital}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedVisa.treatmentDetails.doctor && (
                            <div className="flex gap-3">
                              <span className="text-blue-400 mt-0.5">👨‍⚕️</span>
                              <div>
                                <p className="text-zinc-400 text-xs">Doctor</p>
                                <p className="text-white">{selectedVisa.treatmentDetails.doctor}</p>
                              </div>
                            </div>
                          )}
                          {selectedVisa.treatmentDetails.treatment && (
                            <div className="flex gap-3">
                              <span className="text-blue-400 mt-0.5">🏥</span>
                              <div>
                                <p className="text-zinc-400 text-xs">Treatment</p>
                                <p className="text-white">{selectedVisa.treatmentDetails.treatment}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      {selectedVisa.letterPdfUrl && (
                        <button
                          onClick={() => handleDownloadPDF(selectedVisa.letterPdfUrl)}
                          className="flex-1 px-4 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition font-semibold flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                      )}
                    </div>

                    {/* Version History */}
                    {selectedVisa.versions && selectedVisa.versions.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-semibold text-white mb-3">Version History</h4>
                        <div className="space-y-2">
                          {selectedVisa.versions.map((version, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm p-2 bg-zinc-800/20 rounded border border-white/5"
                            >
                              <span className="text-zinc-400">v{version.version}</span>
                              <span className="text-xs text-zinc-500">
                                {new Date(version.generatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                    <p className="text-zinc-400">Select a visa letter to view details</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
