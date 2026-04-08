import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function DiagnosisUpload() {
  const [file, setFile] = useState(null);
  const { user } = useUser();
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleFileSelect = (e) => {
    const uploaded = e.target.files[0];
    setFile(uploaded);

    // If image file → show preview
    if (uploaded && uploaded.type.startsWith("image")) {
      setPreview(URL.createObjectURL(uploaded));
    } else {
      setPreview("");
    }
  };

  const analyzeReport = async () => {
    if (!file) return;

    setLoading(true);
    setResult("");

    // Simulating backend AI call
    setTimeout(async () => {
      setLoading(false);
      setResult(
        "Possible diagnosis: Mild respiratory infection.\nRecommended tests: CBC, Chest X-Ray.\nSuggested specialist: Pulmonologist."
      );

      // Sync mock disease into health baseline history
      if (user) {
        try {
          await fetch(`http://localhost:5000/api/chat/update-record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              diseaseInfo: "Respiratory infection"
            })
          });
        } catch (e) {
          console.error("Failed to sync diagnosis to baseline", e);
        }
      }
    }, 2500);
  };

  return (
    <div className="pt-28 px-6 pb-20 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold">Medical Diagnosis Assistant</h1>
      <p className="text-gray-600 mt-2">
        Upload your medical reports to get AI-powered insights instantly.
      </p>

      {/* UPLOAD CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 bg-white rounded-xl shadow-md p-8 border max-w-2xl"
      >
        <label
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 transition"
        >
          <Upload className="w-12 h-12 text-gray-500" />
          <span className="mt-3 text-gray-600 font-medium">
            Click to upload medical report
          </span>

          <input
            type="file"
            className="hidden"
            accept="image/*, .pdf"
            onChange={handleFileSelect}
          />
        </label>

        {/* FILE PREVIEW */}
        {file && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Selected File:</h3>
            <div className="flex items-center gap-4">
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="w-32 h-32 rounded-lg object-cover border"
                />
              ) : (
                <FileText className="w-12 h-12 text-gray-600" />
              )}
              <p className="text-gray-700">{file.name}</p>
            </div>

            <button
              onClick={analyzeReport}
              className="mt-6 bg-green-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Analyze Report
            </button>
          </div>
        )}
      </motion.div>

      {/* LOADING ANIMATION */}
      {loading && (
        <div className="mt-10 flex justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <Loader2 className="w-10 h-10 text-green-600" />
          </motion.div>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 bg-white p-6 rounded-xl shadow-md border max-w-2xl"
        >
          <h2 className="text-2xl font-bold mb-3">AI Diagnosis Result</h2>
          <pre className="whitespace-pre-wrap text-gray-700 text-lg">
            {result}
          </pre>
        </motion.div>
      )}
    </div>
  );
}
