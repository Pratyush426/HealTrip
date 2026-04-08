import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, FileText, X, Bot, User, Sparkles, Activity, Hospital, Loader2, Download } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@clerk/clerk-react";
import Threads from "../components/Threads";
import SpotlightCard from "../components/SpotlightCard";
import { BACKEND_URL } from "../apiUrl";

// We'll use the backend proxy for ML hospitals if needed, or make this configurable
const ML_HOSPITAL_URL = "http://localhost:8001";

export default function HealChat() {
  const { user, isSignedIn } = useUser();

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      content:
        "Hello! I'm HealAI 🩺 I can help organize your medical records and guide your health journey. Describe your symptoms, upload a PDF report, or ask me anything!",
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [medicalRecord, setMedicalRecord] = useState({
    symptoms: [],
    history: [],
    files: [],
  });

  // ML detection results
  const [detectedDisease, setDetectedDisease] = useState(null);
  const [mlHospitals, setMlHospitals] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const loadHistory = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/chat/history/${user.id}`);
        const data = await res.json();
        let hasMedicalData = false;

        if (res.ok && data.data) {
          if (data.data.messages?.length > 0) {
            setMessages(data.data.messages.map((m, i) => ({ id: i, ...m, type: "text" })));
          }
          if (data.data.medicalRecord) {
            const rec = data.data.medicalRecord;
            setMedicalRecord({
              symptoms: rec.symptoms || [],
              history: rec.history || [],
              files: (rec.files || []).map((f) => f.fileName || f),
            });
            hasMedicalData = (rec.symptoms && rec.symptoms.length > 0) || (rec.history && rec.history.length > 0);
          }
        }
        
        // If no medical data exists, clear any old empty chats and start a fresh convo with a boilerplate
        if (!hasMedicalData) {
          try {
            await fetch(`${BACKEND_URL}/api/chat/history/${user.id}`, { method: 'DELETE' });
          } catch (e) {
            console.error("Failed to clear initial history", e);
          }
          
          setMessages([
            {
              id: 1,
              role: "bot",
              content: "Welcome to HealAI! Let's build your health baseline. Could you please tell me your current symptoms and past medical history?",
              type: "text",
            }
          ]);
        }
      } catch (err) {
        setMessages([
            {
              id: 1,
              role: "bot",
              content: "Welcome to HealAI! Let's build your health baseline. Could you please tell me your current symptoms and past medical history?",
              type: "text",
            }
        ]);
      }
    };
    loadHistory();
  }, [isSignedIn, user]);

  // Client-side keyword extraction for immediate panel update (supplementary only)
  const extractLocalKeywords = (text) => {
    const lowerText = text.toLowerCase();
    const symptomWords = ["fever", "headache", "pain", "cough", "nausea", "dizzy", "fatigue", "rash", "swelling", "vomiting", "chills", "breathless", "chest pain"];
    const historyWords = ["diabetes", "asthma", "hypertension", "surgery", "allergy", "thyroid", "cancer", "bp", "heart disease"];
    return {
      symptoms: symptomWords.filter((s) => lowerText.includes(s)),
      history: historyWords.filter((h) => lowerText.includes(h)),
    };
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!isSignedIn) {
      toast.error("Please login to use HealAI");
      return;
    }

    const userMsg = { id: Date.now(), role: "user", content: input, type: "text" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Immediate local keyword extraction for side panel
    const extracted = extractLocalKeywords(userMsg.content);
    if (extracted.symptoms.length > 0 || extracted.history.length > 0) {
      setMedicalRecord((prev) => {
        const newRec = { ...prev };
        extracted.symptoms.forEach((s) => { if (!newRec.symptoms.includes(s)) newRec.symptoms.push(s); });
        extracted.history.forEach((h) => { if (!newRec.history.includes(h)) newRec.history.push(h); });
        return newRec;
      });
    }

    try {
      // ✅ FIXED: Call the correct Groq-powered chat endpoint (same as ChatWidget)
      const res = await fetch(`${BACKEND_URL}/api/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "guest",
          message: userMsg.content,
          context: medicalRecord,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        content: data.data.reply,
        type: "text",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
      toast.error("HealAI is offline. Retrying...");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          content: "I'm having trouble connecting. Please check your connection and try again.",
          type: "text",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ✅ Real ML file upload — sends PDF to hospitals ML service
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      toast.error("Please upload a PDF or image file");
      return;
    }

    // Show file in chat
    const fileMsg = {
      id: Date.now(),
      role: "user",
      content: `Uploaded: ${file.name}`,
      type: "file",
      fileName: file.name,
    };
    setMessages((prev) => [...prev, fileMsg]);
    setIsUploading(true);
    setIsTyping(true);

    try {
      const formData = new FormData();
      if (file.type === "application/pdf") {
        formData.append("file", file);
      } else {
        // Image fallback — send as text prompt
        formData.append("text", `[Image uploaded: ${file.name}]`);
      }

      // ✅ Call the ML hospital service to extract disease + get hospital recommendations
      const mlRes = await fetch(`${ML_HOSPITAL_URL}/predict-all`, {
        method: "POST",
        body: formData,
      });

      if (mlRes.ok) {
        const mlData = await mlRes.json();
        const { disease, specialty, top_hospitals } = mlData;

        setDetectedDisease({ disease, specialty, confidence: 0.9 });
        setMlHospitals(top_hospitals || []);

        setMedicalRecord((prev) => ({
          ...prev,
          files: [...prev.files, file.name],
        }));

        const botMsg = {
          id: Date.now() + 1,
          role: "bot",
          content: `📋 I've analyzed your report **"${file.name}"**.\n\n🔍 **Detected Condition**: ${disease}\n🏥 **Medical Specialty**: ${specialty}\n\nI've found the top hospitals for your condition in the panel on the right. Would you like me to plan a medical travel itinerary?`,
          type: "text",
        };
        setMessages((prev) => [...prev, botMsg]);
        toast.success(`Detected: ${disease}`);
      } else {
        throw new Error("ML service returned an error");
      }
    } catch (err) {
      console.error("ML Upload Error:", err);

      // Friendly fallback message
      setMedicalRecord((prev) => ({
        ...prev,
        files: [...prev.files, file.name],
      }));

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        content: `I received your file **"${file.name}"** 📎. The AI analysis service isn't available right now — please make sure the Hospital ML service is running (python main.py in ml/hospitals). I've saved the file to your record.`,
        type: "text",
      };
      setMessages((prev) => [...prev, botMsg]);
      toast.error("ML analysis service not running. Start it with: python main.py in ml/hospitals");
    } finally {
      setIsUploading(false);
      setIsTyping(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ FIXED: Wire Generate Report button to backend
  const handleGenerateReport = async () => {
    if (!isSignedIn) {
      toast.error("Please login to generate a report");
      return;
    }
    setIsGeneratingReport(true);
    const toastId = toast.loading("Generating Medical Report...");
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Report Generated!", { id: toastId });
        const blob = new Blob([data.data.report], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `HealTrip_Report_${user.firstName || "Patient"}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to generate report");
      }
    } catch (err) {
      toast.error("Could not generate report. Chat first to build your record.", { id: toastId });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="relative pt-24 pb-10 min-h-screen bg-zinc-950 flex justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Threads amplitude={1} distance={0} color={[0.4, 0.2, 0.8]} />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 flex gap-6 h-[85vh]">
        {/* LEFT: CHAT INTERFACE */}
        <SpotlightCard className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 flex flex-col overflow-hidden rounded-2xl">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-white text-lg">HealAI</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-zinc-400">Online • Groq AI • Medical Assistant</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
            {messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-zinc-800" : "bg-transparent"}`}>
                    {msg.role === "user" ? <User className="w-5 h-5 text-zinc-400" /> : null}
                  </div>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-white text-black rounded-tr-none font-medium"
                        : "bg-zinc-800/80 text-zinc-100 border border-white/5 rounded-tl-none"
                    }`}
                  >
                    {msg.type === "file" ? (
                      <div className="flex items-center gap-3 bg-zinc-700/50 p-3 rounded-lg border border-white/5">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span className="font-medium underline decoration-blue-400/30 underline-offset-4">{msg.fileName}</span>
                        {isUploading && <Loader2 className="w-4 h-4 text-purple-400 animate-spin ml-auto" />}
                      </div>
                    ) : (
                      <p style={{ whiteSpace: "pre-line" }}>{msg.content}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start pl-11">
                <div className="bg-zinc-800/50 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-white/5 flex gap-3 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="Upload medical report (PDF)"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe symptoms or ask about medical travel..."
              className="flex-1 bg-zinc-900/50 border border-white/10 rounded-full px-6 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </SpotlightCard>

        {/* RIGHT: LIVE RECORD SUMMARY */}
        <div className="w-80 hidden lg:flex flex-col gap-4">
          <SpotlightCard className="bg-black/40 backdrop-blur-md border border-white/10 p-6 flex-1 rounded-2xl overflow-y-auto">
            <h3 className="font-heading font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Live Context
            </h3>

            <div className="space-y-6">
              {/* ML Disease Detection result */}
              {detectedDisease && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> AI Detection
                  </h4>
                  <p className="text-white font-bold text-lg capitalize">{detectedDisease.disease}</p>
                  <p className="text-zinc-400 text-xs mt-1">Specialty: {detectedDisease.specialty}</p>
                </div>
              )}

              {/* Symptoms */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Detected Symptoms</h4>
                <div className="flex flex-wrap gap-2">
                  {medicalRecord.symptoms.length > 0 ? (
                    medicalRecord.symptoms.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-medium rounded-full border border-red-500/20 capitalize">
                        {s}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-600 italic">No symptoms detected yet</p>
                  )}
                </div>
              </div>

              {/* History */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Medical History</h4>
                <ul className="space-y-2">
                  {medicalRecord.history.length > 0 ? (
                    medicalRecord.history.map((h, i) => (
                      <li key={i} className="text-sm text-zinc-300 flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-white/5 capitalize">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        {h}
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-600 italic">No history recorded</p>
                  )}
                </ul>
              </div>

              {/* ML Recommended Hospitals */}
              {mlHospitals.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                    <Hospital className="w-3 h-3" /> Recommended Hospitals
                  </h4>
                  <ul className="space-y-2">
                    {mlHospitals.slice(0, 4).map((h, i) => (
                      <li key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                        <p className="text-sm font-semibold text-white truncate">{h.name}</p>
                        <p className="text-xs text-zinc-400">{h.city} · ★ {h.rating?.toFixed(1)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attached Files */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Attachments</h4>
                <div className="space-y-2">
                  {medicalRecord.files.length > 0 ? (
                    medicalRecord.files.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                        <div className="p-2 bg-zinc-800 rounded-lg">
                          <FileText className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-xs text-zinc-300 truncate w-32">{f}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-600 italic">No files uploaded yet</p>
                  )}
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Generate Report Card */}
          <div className="relative group overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90 transition-opacity group-hover:opacity-100"></div>
            <div className="relative p-6 text-white text-center">
              <Download className="w-6 h-6 mx-auto mb-2 opacity-80" />
              <h4 className="font-heading font-bold text-lg mb-2">Generate Report</h4>
              <p className="text-white/70 text-sm mb-4">Download your structured medical summary as a text file.</p>
              {/* ✅ FIXED: Wired to real backend handler */}
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="w-full bg-white text-black py-3 rounded-xl font-bold font-heading hover:scale-105 active:scale-95 transition-transform shadow-xl disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  "Download Report"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
