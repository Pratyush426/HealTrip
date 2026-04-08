import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Button from "./Button";
import axios from "axios";
import toast from "react-hot-toast";

export default function DiseaseDetectionModal({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Please upload a valid PDF file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Assuming the ML service runs on port 8001
      const response = await axios.post("http://localhost:8001/extract-disease", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        setResult(response.data);
        toast.success("Analysis complete!");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setError("Failed to analyze the report. Please try again.");
      toast.error("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h2 className="text-xl font-bold text-white">Medical Report Analysis</h2>
                  <p className="text-zinc-400 text-sm mt-1">AI-powered disease detection</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {!result ? (
                  /* Upload State */
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center bg-zinc-900/50 transition-colors hover:border-zinc-600 hover:bg-zinc-900">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="pdf-upload"
                      />
                      
                      {!file ? (
                        <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400">
                            <Upload size={24} />
                          </div>
                          <div>
                            <p className="text-white font-medium">Click to upload PDF</p>
                            <p className="text-zinc-500 text-sm mt-1">Max file size 10MB</p>
                          </div>
                        </label>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <FileText size={24} />
                          </div>
                          <div>
                            <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                            <button 
                              onClick={handleReset}
                              className="text-red-400 text-sm mt-1 hover:text-red-300"
                            >
                              Remove file
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500">
                        <AlertCircle size={20} />
                        <span className="text-sm">{error}</span>
                      </div>
                    )}

                    <Button
                      onClick={handleUpload}
                      disabled={!file || loading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={18} className="animate-spin" />
                          Analyzing Report...
                        </span>
                      ) : (
                        "Detect Disease"
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Result State */
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mx-auto mb-4">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Analysis Complete</h3>
                      <p className="text-zinc-400">Here's what we found in your report</p>
                    </div>

                    <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-zinc-400 text-sm uppercase tracking-wider">Detected Condition</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.confidence > 0.8 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {Math.round(result.confidence * 100)}% Confidence
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-white capitalize break-words">
                        {result.disease}
                      </p>
                      {result.disease === "Unknown" && (
                         <p className="text-sm text-yellow-500/80 mt-2">
                           We couldn't identify a specific disease with high confidence. Please consult a doctor.
                         </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={onClose}
                        variant="secondary"
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white"
                      >
                        Close
                      </Button>
                      <Button
                        onClick={handleReset}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        Analyze Another
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
