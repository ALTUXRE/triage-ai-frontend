// src/pages/PatientEntry.tsx
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Users,
  Camera,
  X,
  Sparkles,
  Stethoscope,
  Image as ImageIcon,
  Activity,
  MessageSquare,
  RefreshCcw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  ChevronDown,
  Maximize2,
} from "lucide-react";

const QUICK_SYMPTOMS = [
  "Abdominal Pain", // Added: Crucial for GI issues or pregnancy complications
  "Body Ache", // Added: Classic sign of Dengue/Viral/Malaria
  "Breathing Difficulty",
  "Chest Pain",
  "Cough",
  "Diarrhea",
  "Dizziness", // Added: Common for BP issues or heatstroke
  "Fever",
  "Headache",
  "Rash",
  "Vomiting",
  "Weakness", // Added: Common in dehydration, anemia, or severe illness
];

const LOADING_MESSAGES = [
  "Initializing triage engine...",
  "Extracting symptom context...",
  "Evaluating visual data...",
  "Cross-referencing medical database...",
  "Generating final assessment...",
];

type ViewState = "entry" | "processing" | "result";

const normalizeToStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export default function PatientEntry() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>("entry");
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    gender: "Male",
    symptoms: "",
  });
  const [isGenderOpen, setIsGenderOpen] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiResult, setAiResult] = useState<any>(null);

  const hasText = formData.symptoms.trim().length > 0;
  const hasImage = imagePreview !== null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenderSelect = (gender: string) => {
    setFormData({ ...formData, gender });
    setIsGenderOpen(false);
  };

  const handleSymptomToggle = (symptom: string) => {
    setFormData((prev) => {
      const currentSymptoms = prev.symptoms
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (currentSymptoms.includes(symptom)) {
        return {
          ...prev,
          symptoms: currentSymptoms.filter((s) => s !== symptom).join(", "),
        };
      } else {
        return {
          ...prev,
          symptoms:
            currentSymptoms.length > 0
              ? `${prev.symptoms}, ${symptom}`
              : symptom,
        };
      }
    });
  };

  const handleImageUpload = (file: File) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const startAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Grab the logged-in worker's ID
    const workerId = localStorage.getItem("worker_id");
    if (!workerId) {
      alert("Authentication error: No worker logged in.");
      return;
    }

    setViewState("processing");
    setProgress(0);
    setLoadingMsgIndex(0);
    setIsAnalyzing(true);

    // PERFECTED PROGRESS BAR: Only goes up, strictly caps at 92% until done.
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 12;
        return Math.min(prev + increment, 92);
      });
    }, 450);

    const msgInterval = setInterval(() => {
      setLoadingMsgIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev,
      );
    }, 1200);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("age", formData.age);
      formDataToSend.append("gender", formData.gender);
      formDataToSend.append("symptoms", formData.symptoms);

      if (selectedImageFile) {
        formDataToSend.append("image", selectedImageFile);
      }

      const workerId = localStorage.getItem("worker_id");
      if (!workerId) {
        alert("Authentication error. Please log in again.");
        return;
      }

      const response = await fetch("http://192.168.0.106:8000/api/triage/analyze", {
        method: "POST",
        headers: { "worker-id": workerId }, // ADD THIS HEADER
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();

      clearInterval(progressInterval);
      clearInterval(msgInterval);
      setProgress(100);
      setLoadingMsgIndex(LOADING_MESSAGES.length - 1);

      // Wait for 600ms so the user can actually see the "100%" bar
      await new Promise((resolve) => setTimeout(resolve, 600));

      // --- THE FIX: DATA MAPPING ---
      const payload = data.aiAnalysis || data;

      // Safely map Python backend keys to the expected React UI keys
      let parsedLevel = payload.severity || payload.level || "Stable";
      if (parsedLevel === "Low") parsedLevel = "Stable"; // Catch any weird AI responses

      const normalizedResult = {
        level: parsedLevel,
        disease: String(payload.disease || "Undiagnosed"),
        actionPlan: normalizeToStringArray(
          payload.next_steps ?? payload.actionPlan,
        ),
        visualFindings: normalizeToStringArray(
          payload.visual_findings ?? payload.visualFindings,
        ),
      };

      setAiResult(normalizedResult);
      setViewState("result");
      setIsAnalyzing(false);
    } catch (error) {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
      console.error("Error connecting to AI Engine:", error);
      alert("Failed to connect to the backend or process data. Check console.");
      setViewState("entry");
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", phone: "", age: "", gender: "Male", symptoms: "" });
    setSelectedImageFile(null);
    setImagePreview(null);
    setAiResult(null);
    setViewState("entry");
  };

  const getSeverityUI = (level: string) => {
    if (level === "Emergency")
      return { bg: "bg-red-50 border-red-200 text-red-700", icon: AlertCircle };
    if (level === "Moderate")
      return {
        bg: "bg-orange-50 border-orange-200 text-orange-700",
        icon: AlertTriangle,
      };
    return {
      bg: "bg-green-50 border-green-200 text-green-700",
      icon: CheckCircle2,
    };
  };

  const severityUI = aiResult ? getSeverityUI(aiResult.level) : null;
  const ResultIcon = severityUI?.icon || CheckCircle2;
  const symptomTags = formData.symptoms
    .split(",")
    .map((symptom) => symptom.trim())
    .filter(Boolean);

  const fadeUp = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 200 },
    },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } },
  };

  return (
    <div
      className="h-[100dvh] lg:h-screen bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden relative"
      onClick={() => isGenderOpen && setIsGenderOpen(false)}
    >
      <div className="absolute top-0 left-0 right-0 h-[30vh] bg-gradient-to-b from-blue-100/50 to-slate-100 pointer-events-none -z-10" />

      {/* =========================================================
          PERFECTLY ALIGNED HEADER 
          ========================================================= */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.03)] shrink-0 z-40 border-b border-slate-200/60 w-full"
      >
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 lg:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-[10px] flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <HeartPulse className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base tracking-tight leading-tight">
                TRIAGE-AI
              </h1>
              <p className="text-[10px] text-slate-500 font-bold hidden lg:block tracking-wide uppercase">
                Patient Entry
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-[12px] font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 shadow-sm transition-all active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </motion.header>

      {/* =========================================================
          MAIN CONTENT AREA
          ========================================================= */}
      <main className="flex-1 overflow-y-auto w-full flex flex-col">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-5 lg:px-6 py-6 lg:py-8 flex flex-col flex-1 items-center justify-start lg:justify-center">
          <AnimatePresence mode="wait">
            {/* STATE 1: PATIENT ENTRY FORM */}
            {viewState === "entry" && (
              <motion.div
                key="entry"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full bg-white rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-6 lg:p-8 relative"
              >
                <div className="mb-6 lg:mb-8 relative z-10">
                  <h2 className="text-2xl lg:text-[28px] font-black tracking-tight text-slate-900 mb-1">
                    Patient Details
                  </h2>
                  <p className="text-[12px] lg:text-[13px] text-slate-500 font-medium">
                    Enter patient symptoms to begin triage.
                  </p>
                </div>

                <form
                  onSubmit={startAnalysis}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 relative z-10"
                >
                  {/* LEFT COLUMN */}
                  <div className="space-y-5 lg:space-y-6">
                    <section>
                      <div className="flex items-center gap-1.5 mb-3">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Demographics
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative group">
                          <User className="absolute inset-y-0 left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
                          <input
                            required
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            type="text"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all placeholder:text-slate-400"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="relative group">
                          <Phone className="absolute inset-y-0 left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
                          <input
                            required
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            type="tel"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all placeholder:text-slate-400"
                            placeholder="Phone"
                          />
                        </div>
                        <div className="relative group">
                          <Calendar className="absolute inset-y-0 left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none group-focus-within:text-blue-600 transition-colors" />
                          <input
                            required
                            name="age"
                            value={formData.age}
                            onChange={handleInputChange}
                            type="number"
                            min="0"
                            max="120"
                            className="w-full pl-9 pr-3 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm transition-all placeholder:text-slate-400"
                            placeholder="Age"
                          />
                        </div>

                        {/* Interactive Custom Gender Dropdown */}
                        <div className="relative group">
                          <Users className="absolute inset-y-0 left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none z-10 group-focus-within:text-blue-600 transition-colors" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsGenderOpen(!isGenderOpen);
                            }}
                            className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-[13px] font-bold outline-none shadow-sm flex items-center justify-between transition-all ${isGenderOpen ? "bg-white border-blue-500 ring-[2px] ring-blue-500/20 text-slate-900" : "bg-slate-50/80 border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300"}`}
                          >
                            <span>{formData.gender}</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${isGenderOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                            />
                          </button>

                          <AnimatePresence>
                            {isGenderOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden"
                              >
                                {["Male", "Female"].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenderSelect(opt);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-[12px] font-bold transition-colors flex items-center justify-between ${formData.gender === opt ? "bg-blue-50/80 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                                  >
                                    {opt}
                                    {formData.gender === opt && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </section>

                    <section>
                      <div className="flex items-center gap-1.5 mb-3">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Symptoms
                        </h3>
                      </div>
                      <textarea
                        name="symptoms"
                        value={formData.symptoms}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none shadow-sm resize-none mb-2.5 transition-all placeholder:text-slate-400 placeholder:font-medium"
                        placeholder="Describe symptoms..."
                      />
                      <div className="flex flex-wrap gap-2">
                        {QUICK_SYMPTOMS.map((symptom) => {
                          const isSelected =
                            formData.symptoms.includes(symptom);
                          return (
                            <button
                              key={symptom}
                              type="button"
                              onClick={() => handleSymptomToggle(symptom)}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${isSelected ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}
                            >
                              {isSelected ? "✓ " : "+ "}
                              {symptom}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="flex flex-col h-full">
                    <section className="flex-1 flex flex-col mb-5 lg:mb-6">
                      <div className="flex items-center gap-1.5 mb-3">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Image{" "}
                          <span className="text-slate-400 lowercase normal-case">
                            (optional)
                          </span>
                        </h3>
                      </div>

                      {/* HEIGHT-LOCKED IMAGE CONTAINER */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          handleImageUpload(e.dataTransfer.files[0]);
                        }}
                        className={`relative w-full h-[180px] lg:h-[220px] rounded-[1.25rem] border-2 border-dashed transition-all overflow-hidden flex flex-col ${isDragging ? "border-blue-500 bg-blue-50/80" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"}`}
                      >
                        <input
                          type="file"
                          accept="image/png, image/jpeg"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files)
                              handleImageUpload(e.target.files[0]);
                          }}
                          className="hidden"
                        />

                        <AnimatePresence mode="wait">
                          {imagePreview ? (
                            <motion.div
                              key="preview"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="relative p-1.5 h-full w-full group"
                            >
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-xl shadow-sm border border-slate-100"
                              />

                              {/* Overlay for clicking to expand */}
                              <div
                                onClick={() => setIsPreviewModalOpen(true)}
                                className="absolute inset-1.5 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-[2px]"
                              >
                                <div className="bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-lg">
                                  <Maximize2 className="w-3.5 h-3.5" /> View
                                  Full Image
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImageFile(null);
                                  setImagePreview(null);
                                  if (fileInputRef.current)
                                    fileInputRef.current.value = "";
                                }}
                                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 p-1.5 rounded-full shadow-md hover:text-red-600 hover:bg-white transition-colors z-10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="upload-prompt"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex-1 flex flex-col items-center justify-center p-6 text-center cursor-pointer group h-full"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-105 group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                <Camera className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                              <p className="text-[12px] font-bold text-slate-600 mb-0.5 group-hover:text-blue-600 transition-colors">
                                Click or drag photo
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium mt-1">
                                JPEG or PNG
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </section>

                    <section className="mt-auto">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={
                          isAnalyzing ||
                          !formData.name ||
                          (!hasText && !hasImage)
                        }
                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.2)] text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                        type="submit"
                      >
                        <Sparkles className="w-4 h-4" /> Run AI Triage
                      </motion.button>
                    </section>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STATE 2: LOADING SCREEN WITH PROGRESS BAR */}
            {viewState === "processing" && (
              <motion.div
                key="processing"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-slate-100 p-8 lg:p-10 flex flex-col items-center text-center mx-auto my-auto"
              >
                <div className="relative mb-5">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-blue-500 rounded-full blur-md"
                  />
                  <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-lg relative z-10">
                    <Activity className="text-white w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-lg lg:text-xl font-black text-slate-900 mb-6">
                  Analyzing Data
                </h2>

                <div className="w-full space-y-2">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <motion.div
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.45 }}
                    />
                  </div>
                  <div className="flex justify-between w-full px-1">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={loadingMsgIndex}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        className="text-[10px] font-bold text-slate-500 uppercase tracking-wide"
                      >
                        {LOADING_MESSAGES[loadingMsgIndex]}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[10px] font-black text-blue-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATE 3: COMPACT REPORT (FITS ON ONE PAGE) */}
            {viewState === "result" && aiResult && (
              <motion.div
                key="result"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`w-full bg-white rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 p-5 lg:p-6 relative transition-all ${hasImage ? "max-w-4xl" : "max-w-2xl mx-auto"}`}
              >
                <h2 className="text-lg lg:text-xl font-black text-slate-900 mb-4">
                  Patient Report
                </h2>

                <div
                  className={`grid grid-cols-1 ${hasImage ? "lg:grid-cols-2 gap-4 lg:gap-5" : "gap-4"}`}
                >
                  <div className="space-y-3.5">
                    <div
                      className={`p-3 rounded-xl border-2 flex items-center justify-between ${severityUI?.bg}`}
                    >
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                          Assessed Urgency
                        </p>
                        <p className="text-base lg:text-lg font-black leading-none">
                          {aiResult.level}
                        </p>
                      </div>
                      <ResultIcon className="w-6 h-6 opacity-80" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                          Patient
                        </p>
                        <p className="font-bold text-slate-900 text-[12px] truncate leading-tight">
                          {formData.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {formData.age}y • {formData.gender}
                        </p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                          Condition
                        </p>
                        <p className="font-bold text-slate-900 text-[12px] leading-tight">
                          {aiResult.disease}
                        </p>
                      </div>
                    </div>

                    {hasText && (
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                          Symptoms
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {symptomTags.map((symptom, idx) => (
                            <span
                              key={idx}
                              className="bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {aiResult.actionPlan && aiResult.actionPlan.length > 0 && (
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                          Action Plan
                        </p>
                        <div className="space-y-1.5">
                          {aiResult.actionPlan.map(
                            (action: string, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 bg-slate-50 border border-slate-200/60 p-2 rounded-lg"
                              >
                                <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-700 font-bold leading-snug">
                                  {action}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {hasImage && (
                    <div className="bg-slate-50 border border-slate-200 rounded-[1.25rem] p-3 flex flex-col h-full">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2 text-center">
                        AI Visual Analysis
                      </p>
                      <div
                        className="w-full h-32 lg:h-36 object-cover rounded-lg border border-slate-200 mb-2.5 shadow-sm overflow-hidden bg-white relative group cursor-pointer"
                        onClick={() => setIsPreviewModalOpen(true)}
                      >
                        <img
                          src={imagePreview as string}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-1.5 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                          <div className="bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-lg">
                            <Maximize2 className="w-3.5 h-3.5" /> View Full
                            Image
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200 flex-1 shadow-sm">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                          Detected Findings
                        </p>
                        {aiResult.visualFindings?.map(
                          (finding: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex items-start gap-1.5 text-[11px] text-slate-700 font-bold leading-snug"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                              {finding}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => {
                      // 1. Format the patient report into a clean text message
                      const message = `*TRIAGE-AI Clinical Report*\n\n*Patient Name:* ${formData.name}\n*Patient Age:* ${formData.age}y\n*Assessed Condition:* ${aiResult.disease}\n*Urgency Level:* ${aiResult.level}\n\n*Recommended Action Plan:*\n${aiResult.actionPlan.map((step: string, i: number) => `${i + 1}. ${step}`).join("\n")}\n\n_Generated by TRIAGE-AI Support System_`;

                      // 2. Open WhatsApp with the pre-filled message
                      // Note: Assumes an Indian country code (+91) for the demo
                      const whatsappUrl = `https://wa.me/91${formData.phone}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, "_blank");
                    }}
                    className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl text-[13px] flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(22,163,74,0.2)] hover:bg-green-700 transition-colors h-12"
                  >
                    <MessageSquare className="w-4 h-4" /> Send via WhatsApp
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-100 text-[13px] flex items-center justify-center gap-1.5 shadow-sm transition-colors h-12"
                  >
                    <RefreshCcw className="w-4 h-4" /> Next Patient
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* =========================================================
          FULLSCREEN IMAGE PREVIEW MODAL
          ========================================================= */}
      <AnimatePresence>
        {isPreviewModalOpen && imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4"
            onClick={() => setIsPreviewModalOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label="Close image preview"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
            <motion.img
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              src={imagePreview}
              alt="Full Preview"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
