import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useUserProfile } from "../context/UserProfileContext";
import {
  User, MapPin, Heart, Stethoscope, ChevronRight, ChevronLeft,
  Check, Loader2, Droplets, AlertCircle, Plus, X
} from "lucide-react";
import { BACKEND_URL } from "../apiUrl";

const STEPS = [
  { id: 1, title: "Personal Info", subtitle: "Tell us about yourself", icon: User, color: "from-blue-500 to-cyan-500" },
  { id: 2, title: "Health Profile", subtitle: "Your medical background", icon: Heart, color: "from-rose-500 to-pink-500" },
  { id: 3, title: "Symptoms", subtitle: "Why are you seeking care?", icon: Stethoscope, color: "from-emerald-500 to-teal-500" },
];

const BLOOD_GROUPS = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Unknown"];
const COMMON_CONDITIONS = ["Diabetes", "Hypertension", "Asthma", "Heart Disease", "Arthritis", "Cancer", "Thyroid Disorder", "Kidney Disease", "Liver Disease", "Neurological Disorder"];
const COMMON_SYMPTOMS = ["Chest Pain", "Shortness of Breath", "Chronic Fatigue", "Joint Pain", "Back Pain", "Headaches", "Vision Problems", "Digestive Issues", "Skin Conditions", "Neurological Symptoms"];
const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "UAE", "Singapore", "Germany", "France", "Japan", "Other"];

export default function MedicalForm() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { updateProfile, completeOnboarding } = useUserProfile();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [conditionInput, setConditionInput] = useState("");
  const [symptomInput, setSymptomInput] = useState("");

  const [formData, setFormData] = useState({
    fullName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    age: "",
    gender: "",
    country: "",
    homeCity: "",
    bloodGroup: "",
    allergies: "",
    conditions: [],
    symptoms: [],
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }));
    }
  }, [user]);

  const update = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  const addTag = (key, value, setInput) => {
    const trimmed = value.trim();
    if (trimmed && !formData[key].includes(trimmed)) {
      update(key, [...formData[key], trimmed]);
    }
    setInput("");
  };

  const removeTag = (key, value) => {
    update(key, formData[key].filter((v) => v !== value));
  };

  const canProceed = () => {
    if (step === 1) return formData.fullName && formData.age && formData.gender && formData.country && formData.homeCity;
    if (step === 2) return formData.bloodGroup;
    return formData.symptoms.length > 0;
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (step < 3) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      updateProfile({ ...formData, onboardingComplete: true });
      completeOnboarding();

      if (user) {
        await fetch(`${BACKEND_URL}/api/chat/update-record`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            symptoms: formData.symptoms,
            history: formData.conditions,
          }),
        }).catch(() => {});
      }

      await new Promise((r) => setTimeout(r, 800));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Welcome to HealTrip — Let's set up your profile
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Your Health{" "}
            <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Profile
            </span>
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Takes 2 minutes • Helps us personalize your medical journey
          </p>
        </motion.div>

        {/* Step Progress */}
        <div className="flex items-center justify-center mb-10 gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  className={`flex flex-col items-center gap-1 cursor-default`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isDone
                        ? "bg-emerald-500 shadow-emerald-500/30 shadow-lg"
                        : isActive
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 shadow-blue-500/30 shadow-lg"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-white" : isDone ? "text-emerald-400" : "text-zinc-600"}`}>
                    {s.title}
                  </span>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <div className={`w-20 h-px mx-2 mt-[-14px] transition-all duration-500 ${step > s.id ? "bg-emerald-500" : "bg-zinc-800"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Step Header */}
          <div className={`bg-gradient-to-r ${STEPS[step - 1].color} p-px`}>
            <div className="bg-zinc-900/95 px-8 pt-6 pb-4">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={`header-${step}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                    Step {step} of {STEPS.length}
                  </p>
                  <h2 className="text-2xl font-bold text-white">{STEPS[step - 1].title}</h2>
                  <p className="text-zinc-400 text-sm mt-0.5">{STEPS[step - 1].subtitle}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-8 py-8 min-h-[340px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`body-${step}`}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="e.g. Rahul Sharma"
                        value={formData.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        icon={<User className="w-4 h-4" />}
                      />
                    </div>
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 34"
                        value={formData.age}
                        onChange={(e) => update("age", e.target.value)}
                        min="1"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={formData.gender}
                        onChange={(e) => update("gender", e.target.value)}
                        options={[
                          { value: "", label: "Select gender" },
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "non-binary", label: "Non-binary" },
                          { value: "prefer-not-to-say", label: "Prefer not to say" },
                        ]}
                      />
                    </div>
                    <div>
                      <Label>Country of Origin</Label>
                      <Select
                        value={formData.country}
                        onChange={(e) => update("country", e.target.value)}
                        options={[
                          { value: "", label: "Select country" },
                          ...COUNTRIES.map((c) => ({ value: c, label: c })),
                        ]}
                      />
                    </div>
                    <div>
                      <Label>Your Home City</Label>
                      <Input
                        placeholder="e.g. Mumbai, Delhi, Dubai"
                        value={formData.homeCity}
                        onChange={(e) => update("homeCity", e.target.value)}
                        icon={<MapPin className="w-4 h-4" />}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Health Profile */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <Label>Blood Group</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {BLOOD_GROUPS.map((bg) => (
                          <button
                            key={bg}
                            onClick={() => update("bloodGroup", bg)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                              formData.bloodGroup === bg
                                ? "bg-red-500/20 border-red-500 text-red-300 shadow-red-500/20 shadow-lg"
                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >
                            <Droplets className="w-3 h-3 inline mr-1" />
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label optional>Known Allergies</Label>
                      <Input
                        placeholder="e.g. Penicillin, Peanuts, Latex"
                        value={formData.allergies}
                        onChange={(e) => update("allergies", e.target.value)}
                        icon={<AlertCircle className="w-4 h-4" />}
                      />
                    </div>

                    <div>
                      <Label optional>Existing Conditions</Label>
                      <p className="text-xs text-zinc-500 mb-2">Select or type your own</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {COMMON_CONDITIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() =>
                              formData.conditions.includes(c)
                                ? removeTag("conditions", c)
                                : update("conditions", [...formData.conditions, c])
                            }
                            className={`px-3 py-1 rounded-full text-xs transition-all border ${
                              formData.conditions.includes(c)
                                ? "bg-blue-500/20 border-blue-500 text-blue-300"
                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>

                      {/* Custom input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add custom condition..."
                          value={conditionInput}
                          onChange={(e) => setConditionInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag("conditions", conditionInput, setConditionInput)}
                        />
                        <button
                          onClick={() => addTag("conditions", conditionInput, setConditionInput)}
                          className="px-3 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tags */}
                      {formData.conditions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {formData.conditions.map((c) => (
                            <span key={c} className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-full">
                              {c}
                              <button onClick={() => removeTag("conditions", c)}>
                                <X className="w-3 h-3 hover:text-white" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: Symptoms */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <Label>What are your current symptoms?</Label>
                      <p className="text-xs text-zinc-500 mb-3">Select all that apply — this helps us match the right hospital specialties</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {COMMON_SYMPTOMS.map((s) => (
                          <button
                            key={s}
                            onClick={() =>
                              formData.symptoms.includes(s)
                                ? removeTag("symptoms", s)
                                : update("symptoms", [...formData.symptoms, s])
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-sm transition-all border ${
                              formData.symptoms.includes(s)
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-emerald-500/20 shadow-md"
                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Add custom symptom..."
                          value={symptomInput}
                          onChange={(e) => setSymptomInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag("symptoms", symptomInput, setSymptomInput)}
                        />
                        <button
                          onClick={() => addTag("symptoms", symptomInput, setSymptomInput)}
                          className="px-3 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {formData.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {formData.symptoms.map((s) => (
                            <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-full">
                              {s}
                              <button onClick={() => removeTag("symptoms", s)}>
                                <X className="w-3 h-3 hover:text-white" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Footer */}
          <div className="px-8 pb-8 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                step === 1
                  ? "opacity-0 pointer-events-none"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex gap-2">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    step === s.id ? "bg-white w-6" : step > s.id ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>

            <motion.button
              onClick={goNext}
              disabled={!canProceed() || submitting}
              whileHover={canProceed() ? { scale: 1.03 } : {}}
              whileTap={canProceed() ? { scale: 0.97 } : {}}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                canProceed()
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Setting up...
                </>
              ) : step === STEPS.length ? (
                <>
                  <Check className="w-4 h-4" /> Complete Setup
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable components
function Label({ children, optional }) {
  return (
    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
      {children}
      {optional && <span className="text-zinc-600 ml-1.5 text-xs font-normal">(optional)</span>}
    </label>
  );
}

function Input({ icon, className = "", ...props }) {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">{icon}</div>
      )}
      <input
        className={`w-full px-4 py-2.5 ${icon ? "pl-9" : ""} bg-zinc-800/80 border border-zinc-700 text-white rounded-xl placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm ${className}`}
        {...props}
      />
    </div>
  );
}

function Select({ options, className = "", ...props }) {
  return (
    <select
      className={`w-full px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm appearance-none ${className}`}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-zinc-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}
