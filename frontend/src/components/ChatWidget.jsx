import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, X, FileText, Sparkles, Trash2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { BACKEND_URL, API_BASE_URL } from "../apiUrl";

export default function ChatWidget() {
  const { user, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Client-side keyword extraction for baseline update
  const extractLocalKeywords = (text) => {
    const lowerText = text.toLowerCase();
    const symptomWords = ["fever", "headache", "pain", "cough", "nausea", "dizzy", "fatigue", "rash", "swelling", "vomiting", "chills", "breathless", "chest pain"];
    const historyWords = ["diabetes", "asthma", "hypertension", "surgery", "allergy", "thyroid", "cancer", "bp", "heart disease"];
    return {
      symptoms: symptomWords.filter((s) => lowerText.includes(s)),
      history: historyWords.filter((h) => lowerText.includes(h)),
    };
  };

  // Load History & Auto-Open Logic
  useEffect(() => {
    if (!isSignedIn || !user) return;

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/chat/history/${user.id}`);
            const data = await res.json();
            
            if (res.ok && data.data) {
                const history = data.data.messages;
                setMessages(history);

                // Auto-open ONLY if new user (created < 5 mins ago) and empty history
                const isNewUser = user.createdAt && (new Date() - new Date(user.createdAt) < 5 * 60 * 1000);

                if (history.length === 0 && !hasOpened && isNewUser) {
                    setIsOpen(true);
                    setHasOpened(true);
                    // Add local welcome message if history empty
                    setMessages([{
                        role: 'bot',
                        content: `Hello ${user.firstName}! I'm HealAI. Detailed medical records help me plan better. Could you describe your symptoms or medical history?`
                    }]);
                }
            }
        } catch (err) {
            console.error("Failed to load chat history", err);
        }
    };

    fetchHistory();
  }, [isSignedIn, user, hasOpened]);

    // Delete Chat History
    const handleDeleteChat = async () => {
        if (!user || messages.length === 0) return;
        if (!window.confirm("Are you sure you want to clear the chat history?")) return;

        try {
            await fetch(`${API_BASE_URL}/chat/history/${user.id}`, { method: 'DELETE' });
            setMessages([{
                role: 'bot',
                content: `Chat history cleared. How can I help you now, ${user.firstName}?`
            }]);
            toast.success("Chat history cleared");
        } catch (error) {
            console.error("Failed to delete chat", error);
            toast.error("Failed to clear chat");
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple validation
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("File too large (max 5MB)");
            return;
        }

        setAttachment(file);
    };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;

    if (!isSignedIn) {
        toast.error("Please login to chat");
        return;
    }

    const tempMsg = { 
        role: 'user', 
        content: input + (attachment ? ` [Attached: ${attachment.name}]` : ''), 
        timestamp: new Date() 
    };
    setMessages(prev => [...prev, tempMsg]);
    
    const messageToSend = input;
    const currentAttachment = attachment;

    setInput("");
    setAttachment(null);
    setIsTyping(true);

    try {
        let attachmentData = null;
        if (currentAttachment) {
            // Convert to Base64
            const reader = new FileReader();
            attachmentData = await new Promise((resolve) => {
                reader.onload = (e) => resolve({
                    name: currentAttachment.name,
                    type: currentAttachment.type,
                    data: e.target.result.split(',')[1] // Remove prefix
                });
                reader.readAsDataURL(currentAttachment);
            });
        }

        const extracted = extractLocalKeywords(messageToSend);
        const contextPayload = {
            symptoms: extracted.symptoms,
            history: extracted.history,
            files: []
        };

        const res = await fetch(`${API_BASE_URL}/chat/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                message: messageToSend,
                attachment: attachmentData,
                context: contextPayload 
            })
        });
        const data = await res.json();

        if (res.ok) {
            const botMsg = { role: 'bot', content: data.data.reply, timestamp: new Date() };
            setMessages(prev => [...prev, botMsg]);
        } else {
             throw new Error("Failed");
        }
    } catch (error) {
        setMessages(prev => [...prev, { role: 'bot', content: "Network error. Please try again." }]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleGenerateReport = async () => {
      if (!isSignedIn) return;
      const toastId = toast.loading("Generating Medical Report...");
      try {
          const res = await fetch(`${API_BASE_URL}/chat/report`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id })
          });
          const data = await res.json();
          if (res.ok) {
              toast.success("Report Generated!", { id: toastId });
              // Create a blob and download
              const blob = new Blob([data.data.report], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Medical_Report_${user.firstName}.txt`;
              a.click();
          } else {
              throw new Error("Failed");
          }
      } catch (e) {
          toast.error("Failed to generate report", { id: toastId });
      }
  };

  if (!isSignedIn) return null; // Hide if not logged in? Or show prompt?

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
        <div className="pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[350px] md:w-[400px] h-[600px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-800/50 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">HealAI Assistant</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-zinc-400">Online • Saving Chat</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                    onClick={handleDeleteChat}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    title="Clear Chat"
                >
                    <Trash2 size={18} className="text-white/80" />
                </button>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={20} className="text-white" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-zinc-800 text-zinc-200 border border-white/10 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                 <div className="flex justify-start">
                    <div className="bg-zinc-800 px-3 py-2 rounded-2xl rounded-tl-none border border-white/10 flex gap-1">
                      <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce delay-150"></span>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Actions: Generate Report */}
            <div className="px-4 py-2 bg-zinc-900 border-t border-white/5">
                <button 
                    onClick={handleGenerateReport}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg flex items-center justify-center gap-2 transition"
                >
                    <FileText className="w-3 h-3" />
                    Generate Medical Report
                </button>
            </div>

            {/* Input */}
            <div className="p-3 bg-zinc-800/50 border-t border-white/5 space-y-2">
                {attachment && (
                    <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg relative group">
                       <FileText size={16} className="text-blue-400" />
                       <span className="text-xs text-zinc-300 truncate max-w-[200px]">{attachment.name}</span>
                       <button 
                         onClick={() => setAttachment(null)}
                         className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                        >
                           <X size={10} className="text-white" />
                       </button>
                    </div>
                )}
                
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden" 
                        accept="image/*,application/pdf"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-zinc-700 text-zinc-400 rounded-full hover:bg-zinc-600 hover:text-white transition-colors"
                        title="Attach file"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() && !attachment}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Toggle Button with Bot Icon */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-lg shadow-purple-500/30 text-white flex items-center justify-center group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
             <X key="close" className="w-6 h-6" />
          ) : (
             <Bot key="open" className="w-8 h-8 group-hover:animate-bounce" />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
