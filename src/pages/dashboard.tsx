// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  LogOut,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Search,
  X,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar,
  Activity,
  ChevronDown,
  Phone,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Patient = {
  id: string;
  name: string;
  phone?: string;
  gender: string;
  date: string;
  displayDate?: string;
  time: string;
  disease: string;
  severity: "Emergency" | "Moderate" | "Stable";
  symptoms: string[];
  actionPlan: string[];
  imageUrl?: string | null;
  visualFindings?: string[];
  age?: string | number; // Added age to support the new demographic chart
};

const DISEASE_GROUPS: Record<string, string[]> = {
  "Respiratory Infection": [
    "pneumonia",
    "bronchitis",
    "cough",
    "respiratory",
    "ari",
    "asthma",
    "tb",
    "covid",
    "tuberculosis",
  ],
  "Febrile Illness": [
    "fever",
    "viral",
    "dengue",
    "malaria",
    "typhoid",
    "chikungunya",
  ],
  Gastrointestinal: [
    "vomiting",
    "diarrhea",
    "dehydration",
    "gastro",
    "food poisoning",
    "cholera",
    "acidity",
    "abdominal",
  ],
  "Hepatic / Jaundice": ["hepatitis", "jaundice"],
  "Skin Condition": ["fungal", "scabies", "rash", "ringworm", "cellulitis"],
  Cardiovascular: [
    "heart",
    "cardiac",
    "stroke",
    "myocardial",
    "hypertension",
    "bp",
  ],
  "Injury / Trauma": [
    "fracture",
    "burn",
    "cut",
    "wound",
    "bite",
    "injury",
    "trauma",
  ],
};

const SYMPTOM_GROUPS: Record<string, string[]> = {
  Fever: ["fever", "bukhar", "temp", "chill", "hot"],
  "Cough & Cold": [
    "cough",
    "khansi",
    "cold",
    "runny nose",
    "sneez",
    "sore throat",
  ],
  "Breathing Difficulty": ["breath", "saans", "wheez", "chest"],
  "Nausea / Vomiting": ["vomit", "ulti", "nausea"],
  Diarrhea: ["diarrhea", "dast", "loose motion"],
  Headache: ["headache", "sar dard"],
  "Abdominal Pain": ["stomach", "abdomen", "pet dard", "belly"],
  "Fatigue / Weakness": ["weak", "fatigue", "tired", "kamzori"],
  "Rash / Skin Issue": ["rash", "itch", "skin", "swelling"],
};

const normalizeDisease = (disease: string) => {
  if (!disease) return "Unknown";
  const normalizedDisease = disease.trim();
  const lowerDisease = normalizedDisease.toLowerCase();

  for (const [label, keywords] of Object.entries(DISEASE_GROUPS)) {
    if (keywords.some((keyword) => lowerDisease.includes(keyword))) {
      return label;
    }
  }
  return normalizedDisease;
};

const normalizeSymptom = (symptom: string) => {
  if (!symptom) return "Unknown";
  const normalized = symptom.trim();
  const lower = normalized.toLowerCase();

  for (const [label, keywords] of Object.entries(SYMPTOM_GROUPS)) {
    if (keywords.some((k) => lower.includes(k))) {
      return label;
    }
  }
  // Fallback: Capitalize first letter if it doesn't match any group
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getBarColor = (
  count: number,
  max: number,
  theme: "blue" | "purple" | "slate" = "blue",
) => {
  if (max === 0)
    return theme === "blue"
      ? "bg-blue-200"
      : theme === "purple"
        ? "bg-purple-200"
        : "bg-slate-200";
  const ratio = count / max;
  if (theme === "blue") {
    if (ratio >= 0.8) return "bg-blue-600";
    if (ratio >= 0.5) return "bg-blue-400";
    return "bg-blue-200";
  } else if (theme === "purple") {
    if (ratio >= 0.8) return "bg-purple-600";
    if (ratio >= 0.5) return "bg-purple-400";
    return "bg-purple-200";
  } else {
    if (ratio >= 0.8) return "bg-slate-600";
    if (ratio >= 0.5) return "bg-slate-400";
    return "bg-slate-200";
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedSeverity, setSelectedSeverity] = useState<
    "Emergency" | "Moderate" | "Stable" | null
  >(null);
  const [genderFilter, setGenderFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Gender modal dropdown

  const [timeFilter, setTimeFilter] = useState("Today");
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false); // NEW: Dashboard time dropdown

  const [searchQuery, setSearchQuery] = useState("");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const workerId = localStorage.getItem("worker_id");
        if (!workerId) {
          navigate("/"); // Redirect to login if not authenticated
          return;
        }
        const response = await fetch(
          "https://triage-ai-api.onrender.com/api/patients",
          {
            headers: { "worker-id": workerId },
          },
        );

        if (response.ok) {
          const data = await response.json();

          // --- DATA SANITIZER: Protects against AI JSON formatting errors ---
          const safeData = data.map((patient: any) => ({
            ...patient,
            // Force actionPlan to be an array
            actionPlan: Array.isArray(patient.actionPlan)
              ? patient.actionPlan
              : typeof patient.actionPlan === "string"
                ? [patient.actionPlan]
                : [],
            // Force visualFindings to be an array
            visualFindings: Array.isArray(patient.visualFindings)
              ? patient.visualFindings
              : typeof patient.visualFindings === "string"
                ? [patient.visualFindings]
                : [],
          }));

          setPatients(safeData);
        }
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const startOfLocalDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const isDateMatch = (dateStr: string, filter: string) => {
    if (!dateStr) return false;

    const patientDate = new Date(dateStr);
    if (Number.isNaN(patientDate.getTime())) return false;

    const today = startOfLocalDay(new Date());
    const patientDay = startOfLocalDay(patientDate);

    const diffDays = Math.floor(
      (today.getTime() - patientDay.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) return false;

    if (filter === "Today") return diffDays === 0;
    if (filter === "Last 7 Days") return diffDays <= 7;
    if (filter === "Last 30 Days") return diffDays <= 30;

    return true;
  };

  const timeFilteredPatients = patients.filter((p) =>
    isDateMatch(p.date, timeFilter),
  );

  // --- CARD 1: URGENCY ---
  const urgencyTotal = timeFilteredPatients.length;
  const safeTotal = urgencyTotal || 1;
  const emergencyCount = timeFilteredPatients.filter(
    (p) => p.severity === "Emergency",
  ).length;
  const moderateCount = timeFilteredPatients.filter(
    (p) => p.severity === "Moderate",
  ).length;
  const stableCount = timeFilteredPatients.filter(
    (p) => p.severity === "Stable",
  ).length;

  const pieDataSeverity = [
    { name: "Stable", value: stableCount, color: "#10b981" },
    { name: "Moderate", value: moderateCount, color: "#f59e0b" },
    { name: "Emergency", value: emergencyCount, color: "#ef4444" },
  ];
  const criticalPercentage = Math.round((emergencyCount / safeTotal) * 100);
  const needsAttentionPercentage = Math.round(
    (moderateCount / safeTotal) * 100,
  );
  const stablePercentage = Math.round((stableCount / safeTotal) * 100);

  // --- CARD 2: CONDITIONS ---
  const diseaseCounts: Record<string, number> = {};
  timeFilteredPatients.forEach((p) => {
    const normalizedDisease = normalizeDisease(p.disease);
    diseaseCounts[normalizedDisease] =
      (diseaseCounts[normalizedDisease] || 0) + 1;
  });
  const topDiseases = Object.entries(diseaseCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4); // show 4 instead of 3
  const maxDiseaseCount =
    topDiseases.length > 0 ? Math.max(...topDiseases.map((d) => d.count)) : 1;

  // --- CARD 3: DEMOGRAPHICS ---
  const maleCount = timeFilteredPatients.filter(
    (p) => p.gender === "Male",
  ).length;
  const femaleCount = timeFilteredPatients.filter(
    (p) => p.gender === "Female",
  ).length;

  const pieDataGender = [
    { name: "Male", value: maleCount, color: "#3b82f6" },
    { name: "Female", value: femaleCount, color: "#ec4899" },
  ];

  const ageGroups = { "0-18": 0, "19-40": 0, "41-60": 0, "60+": 0 };
  timeFilteredPatients.forEach((p) => {
    // Use a realistic default fallback of 35 if age is missing to keep charts populated
    const age = Number(p.age) || 0;
    if (age <= 18) ageGroups["0-18"]++;
    else if (age <= 40) ageGroups["19-40"]++;
    else if (age <= 60) ageGroups["41-60"]++;
    else ageGroups["60+"]++;
  });
  const maxAgeCount = Math.max(...Object.values(ageGroups)) || 1;

  // --- CARD 4: SYMPTOMS ---
  const symptomCounts: Record<string, number> = {};
  timeFilteredPatients.forEach((p) => {
    if (p.symptoms && Array.isArray(p.symptoms)) {
      // Use a Set to prevent double-counting if a patient has "fever" and "102 temp"
      const uniqueSymptoms = new Set(p.symptoms.map(normalizeSymptom));

      uniqueSymptoms.forEach((s) => {
        if (s !== "Unknown") {
          symptomCounts[s] = (symptomCounts[s] || 0) + 1;
        }
      });
    }
  });

  const topSymptoms = Object.entries(symptomCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const maxSymptomCount =
    topSymptoms.length > 0 ? Math.max(...topSymptoms.map((s) => s.count)) : 1;

  // FINAL MODAL FILTER
  // If the user is actively searching, look through ALL patients in the database.
  // Otherwise, only show patients that match the current Time Filter.
  const basePatientList = searchQuery ? patients : timeFilteredPatients;
  const fullyFilteredPatients = basePatientList.filter((p) => {
    const matchSeverity = selectedSeverity
      ? p.severity === selectedSeverity
      : true;
    const matchGender =
      genderFilter !== "All" ? p.gender === genderFilter : true;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSeverity && matchGender && matchSearch;
  });

  const closePatientModal = () => {
    setSelectedSeverity(null);
    setSearchQuery("");
    setGenderFilter("All");
    setIsFilterOpen(false);
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const slideUpItem = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 200 },
    },
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-blue-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm font-bold">Syncing Records...</p>
        </div>
      </div>
    );
  }

  return (
    // STRICT OVERFLOW HIDDEN ON DESKTOP to enforce single screen fit
    <div className="h-[100dvh] lg:h-screen bg-slate-100 font-sans text-slate-900 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-[30vh] bg-gradient-to-b from-blue-100/50 to-slate-100 pointer-events-none -z-10" />

      {/* PERFECTLY ALIGNED HEADER */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.03)] shrink-0 z-20 border-b border-slate-200/60 w-full"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-3 grid grid-cols-2 lg:grid-cols-[auto_1fr_auto] gap-3 lg:gap-10 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5 justify-start">
            <div className="w-8 h-8 bg-blue-600 rounded-[10px] flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <HeartPulse className="text-white w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base tracking-tight leading-tight">
                TRIAGE-AI
              </h1>
              <p className="text-[10px] text-slate-500 font-bold hidden lg:block tracking-wide uppercase">
                Clinical Dashboard
              </p>
            </div>
          </div>

          {/* Search Bar - Full width row 2 on Mobile/Tablet, Flexible middle column on Desktop */}
          <div className="relative w-full col-span-2 row-start-2 lg:col-span-1 lg:row-start-auto group lg:max-w-4xl lg:mr-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search patient by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-full text-[12px] font-semibold outline-none focus:bg-white focus:border-blue-500 focus:ring-[2px] focus:ring-blue-500/20 transition-all shadow-sm"
            />
          </div>

          {/* Actions - Top right on Mobile, Far right on Desktop */}
          <div className="flex items-center justify-end w-full gap-2 lg:gap-2.5 relative col-start-2 row-start-1 lg:col-start-auto lg:row-start-auto">
            {/* Custom Interactive Time Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
                className={`flex items-center gap-1.5 bg-white border rounded-full px-3 py-1.5 shadow-sm transition-all cursor-pointer select-none ${isTimeFilterOpen ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 hover:bg-slate-50 hover:border-blue-400"}`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 whitespace-nowrap">
                  {timeFilter}
                </span>
                <ChevronDown
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${isTimeFilterOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                />
              </button>

              <AnimatePresence>
                {isTimeFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-[1rem] shadow-xl z-50 py-1.5 overflow-hidden"
                  >
                    {["Today", "Last 7 Days", "Last 30 Days"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setTimeFilter(opt);
                          setIsTimeFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[12px] font-bold transition-colors flex items-center justify-between ${timeFilter === opt ? "bg-blue-50/80 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                      >
                        {opt}
                        {timeFilter === opt && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sign Out Pill - Removed 'hidden', text hides on mobile, icon stays */}
            <button
              onClick={() => {
                localStorage.removeItem("worker_id");
                navigate("/");
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 bg-white border border-slate-200 rounded-full text-[12px] font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm transition-all active:scale-95 shrink-0"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* MAIN CONTENT AREA */}
      <motion.main
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex-1 w-full flex flex-col overflow-y-auto lg:overflow-hidden min-h-0"
      >
        <div
          className="w-full max-w-7xl mx-auto px-4 sm:px-5 py-5 flex flex-col gap-4 lg:gap-3 flex-1 lg:min-h-0"
          onClick={() => isTimeFilterOpen && setIsTimeFilterOpen(false)}
        >
          <LayoutGroup>
            {/* Action Cards - Top Row (Shrink 0 to never compress) */}
            <motion.section layout variants={slideUpItem} className="shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  layout
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/patient-entry")}
                  className="p-4.5 rounded-[1.25rem] bg-white border border-slate-200/60 shadow-sm cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-[10px]">
                      <Plus className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px]">
                      New Patient
                    </h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Start Assessment
                    </p>
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                  </div>
                </motion.div>
                <motion.div
                  layout
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSeverity("Emergency")}
                  className="p-4.5 rounded-[1.25rem] bg-white border border-slate-200/60 shadow-sm cursor-pointer hover:border-red-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 bg-red-50 border border-red-100 text-red-600 rounded-[10px]">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px]">
                      Emergency
                    </h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Critical Care Needed
                    </p>
                    <span className="text-2xl font-black text-red-600 leading-none">
                      {emergencyCount}
                    </span>
                  </div>
                </motion.div>
                <motion.div
                  layout
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSeverity("Moderate")}
                  className="p-4.5 rounded-[1.25rem] bg-white border border-slate-200/60 shadow-sm cursor-pointer hover:border-orange-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-[10px]">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px]">
                      Moderate
                    </h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Medical Attention Needed
                    </p>
                    <span className="text-2xl font-black text-orange-600 leading-none">
                      {moderateCount}
                    </span>
                  </div>
                </motion.div>
                <motion.div
                  layout
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSeverity("Stable")} // Changed
                  className="p-4.5 rounded-[1.25rem] bg-white border border-slate-200/60 shadow-sm cursor-pointer hover:border-green-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 bg-green-50 border border-green-100 text-green-600 rounded-[10px]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px]">
                      Stable {/* Changed */}
                    </h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Monitoring / Home Care
                    </p>
                    <span className="text-2xl font-black text-green-600 leading-none">
                      {stableCount} {/* Changed */}
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.section>

            {/* Symmetrical 2x2 Overview Grid (Flex-1 Min-H-0 to dynamic fit) */}
            <motion.section
              layout
              variants={slideUpItem}
              className="flex-1 flex flex-col shrink-0 lg:shrink lg:min-h-0 pb-6 lg:pb-0"
            >
              <h2 className="text-[14px] lg:text-[15px] font-bold text-slate-900 tracking-tight mb-2 pl-1 shrink-0">
                Quick Insights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 lg:gap-3 flex-1 lg:min-h-0">
                {/* UPGRADED URGENCY */}
                <div className="bg-white px-5 py-4 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex flex-col lg:h-full lg:min-h-0">
                  <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px] shrink-0">
                    Patient Urgency
                  </h3>
                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 lg:gap-8 w-full mt-4 sm:mt-2 lg:min-h-0">
                    {/* Left: Pie Chart */}
                    <div className="flex flex-col items-center justify-center w-full sm:w-1/2 shrink-0">
                      <div className="h-32 w-32 lg:h-36 lg:w-36 relative shrink-0 mb-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieDataSeverity}
                              innerRadius="60%"
                              outerRadius="100%"
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                              activeIndex={-1}
                            >
                              {pieDataSeverity.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                          <span className="text-2xl lg:text-[28px] font-black text-slate-900 leading-none">
                            {urgencyTotal}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">
                            Total
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Urgent Distribution Bars (Like Demographics Age Bars) */}
                    <div className="w-full sm:w-1/2 flex flex-col justify-center gap-3 px-4">
                      <div className="w-full py-1.5">
                        <div className="flex items-center justify-between text-[11px] lg:text-[12px] font-bold mb-1.5">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500" />{" "}
                            Emergency
                          </span>
                          <span className="shrink-0 tabular-nums">
                            <span className="text-slate-700">
                              {emergencyCount}
                            </span>{" "}
                            <span className="text-slate-500">
                              ({criticalPercentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-black mt-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(emergencyCount / safeTotal) * 100}%`,
                            }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full bg-red-500"
                          />
                        </div>
                      </div>
                      <div className="w-full py-1.5">
                        <div className="flex items-center justify-between text-[11px] lg:text-[12px] font-bold mb-1.5">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />{" "}
                            Moderate
                          </span>
                          <span className="shrink-0 tabular-nums">
                            <span className="text-slate-700">
                              {moderateCount}
                            </span>{" "}
                            <span className="text-slate-500">
                              ({needsAttentionPercentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hiddend-full border border-black h-2 overflow-hidden mt-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(moderateCount / safeTotal) * 100}%`,
                            }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full bg-orange-500"
                          />
                        </div>
                      </div>
                      <div className="w-full py-1.5">
                        <div className="flex items-center justify-between text-[11px] lg:text-[12px] font-bold mb-1.5">
                          <span className="text-slate-600 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500" />{" "}
                            Stable
                          </span>
                          <span className="shrink-0 tabular-nums">
                            <span className="text-slate-700">
                              {stableCount}
                            </span>{" "}
                            <span className="text-slate-500">
                              ({stablePercentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-black mt-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(stableCount / safeTotal) * 100}%`,
                            }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full bg-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Conditions Bars */}
                <div className="bg-white px-5 py-4 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex flex-col lg:h-full">
                  <div className="flex justify-between items-center mb-1 shrink-0">
                    <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px]">
                      Frequent Conditions
                    </h3>
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  </div>

                  {/* flex-1 min-h-0 to dynamic fit */}
                  <div className="flex-1 flex flex-col justify-center gap-3 px-3 mt-3">
                    {topDiseases.map((disease, idx) => (
                      <div key={idx} className="w-full">
                        <div className="flex items-center justify-between text-[11px] lg:text-[12px] font-bold mb-1">
                          <span className="text-slate-800 truncate pr-2">
                            {disease.name}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            <span className="text-slate-700">
                              {disease.count}
                            </span>{" "}
                            <span className="text-slate-500">
                              ({Math.round((disease.count / safeTotal) * 100)}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden  mt-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(disease.count / safeTotal) * 100}%`,
                            }}
                            transition={{ duration: 1 }}
                            className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(disease.count, maxDiseaseCount, "blue")}`}
                          />
                        </div>
                      </div>
                    ))}
                    {topDiseases.length === 0 && (
                      <div className="text-center p-3 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-[11px] text-slate-400 font-medium">
                          Awaiting data
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 3: UPGRADED DEMOGRAPHICS (Gender + Age) */}
                <div className="bg-white px-5 py-4 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex flex-col lg:h-full">
                  <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px] shrink-0">
                    Demographics
                  </h3>

                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6 lg:gap-8 w-full mt-2 pb-4 min-h-0">
                    {/* Left Side: Gender Pie Chart */}
                    <div className="flex flex-col items-center justify-center w-full sm:w-1/2 shrink-0">
                      <div className="h-32 w-32 lg:h-36 lg:w-36 relative shrink-0 mb-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieDataGender}
                              innerRadius="60%"
                              outerRadius="100%"
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                              activeIndex={-1}
                            >
                              {pieDataGender.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                          <span className="text-2xl lg:text-[28px] font-black text-slate-900 leading-none">
                            {timeFilteredPatients.length}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mt-1">
                            Total
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 w-full mt-2">
                        <div className="px-2.5 py-1 bg-blue-50 rounded-md border border-blue-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-[10px] font-bold text-blue-700">
                            Male {maleCount}
                          </span>
                        </div>
                        <div className="px-2.5 py-1 bg-pink-50 rounded-md border border-pink-100 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-pink-500 rounded-full" />
                          <span className="text-[10px] font-bold text-pink-700">
                            Female {femaleCount}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Age Distribution Bars */}
                    <div className="w-full sm:w-1/2 flex flex-col justify-center gap-4 px-4">
                      {Object.entries(ageGroups).map(([group, count], idx) => (
                        <div key={idx} className="w-full py-0.5">
                          <div className="flex items-center justify-between text-[11px] lg:text-[12px] font-bold mb-1">
                            <span className="text-slate-600 tracking-wide">
                              {group} Yrs
                            </span>
                            <span className="tabular-nums">
                              <span className="text-slate-700">{count}</span>{" "}
                              <span className="text-slate-500">
                                ({Math.round((count / safeTotal) * 100)}%)
                              </span>
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-black bg-slate-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(count / safeTotal) * 100}%`,
                              }}
                              transition={{ duration: 1 }}
                              className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor(count, maxAgeCount, "slate")}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card 4: Symptoms Bars */}
                <div className="bg-white px-5 py-4 rounded-[1.25rem] shadow-sm border border-slate-200/60 flex flex-col lg:h-full">
                  <div className="flex justify-between items-center mb-1 shrink-0">
                    <h3 className="font-bold text-slate-900 text-[13px] lg:text-[14px]">
                      Frequent Symptoms
                    </h3>
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  {/* flex-1 min-h-0 to dynamic fit */}
                  <div className="flex-1 flex flex-col justify-center gap-3 px-3 mt-3">
                    {topSymptoms.map((symptom, idx) => (
                      <div key={idx} className="w-full">
                        <div className="flex items-center justify-between text-[11px] lg:text-[12px] font-bold mb-1">
                          <span className="text-slate-800 truncate pr-2">
                            {symptom.name}
                          </span>
                          <span className="shrink-0 tabular-nums">
                            <span className="text-slate-700">
                              {symptom.count}
                            </span>{" "}
                            <span className="text-slate-500">
                              ({Math.round((symptom.count / safeTotal) * 100)}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(symptom.count / safeTotal) * 100}%`,
                            }}
                            transition={{ duration: 1 }}
                            className={`h-full rounded-full ${getBarColor(symptom.count, maxSymptomCount, "purple")}`}
                          />
                        </div>
                      </div>
                    ))}
                    {topSymptoms.length === 0 && (
                      <div className="text-center p-3 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-[11px] text-slate-400 font-medium">
                          Awaiting data
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          </LayoutGroup>
        </div>
      </motion.main>

      {/* PATIENT LIST MODAL (Centered Search & Custom Dropdown) */}
      <AnimatePresence>
        {(selectedSeverity || searchQuery) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePatientModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-4 sm:inset-10 lg:inset-x-[15%] xl:inset-x-[20%] lg:inset-y-[10vh] bg-slate-100 shadow-2xl z-50 rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden flex flex-col border border-white/50"
            >
              {/* Modal Header */}
              <div className="bg-white px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 shrink-0 z-20 relative shadow-sm">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                  {/* Top Row (Mobile): Title & Close Button */}
                  <div className="flex items-center justify-between w-full md:w-auto shrink-0">
                    <h2 className="text-[15px] lg:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
                      {searchQuery && !selectedSeverity
                        ? "Search Results"
                        : `${selectedSeverity || "All"} Cases`}
                    </h2>
                    <button
                      onClick={closePatientModal}
                      className="md:hidden flex items-center justify-center w-8 h-8 bg-slate-100 border border-slate-300 rounded-full text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm shrink-0"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Bottom Row (Mobile) / Right Side (Desktop): Search & Filters */}
                  <div className="flex flex-row items-center gap-2 sm:gap-3 w-full md:flex-1 md:justify-end">
                    {/* Gender Filter */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center justify-center gap-1.5 bg-white border border-slate-300 rounded-full px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-400 shadow-sm transition-all whitespace-nowrap"
                      >
                        {genderFilter === "All" ? "All Genders" : genderFilter}
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isFilterOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                        />
                      </button>

                      <AnimatePresence>
                        {isFilterOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden"
                          >
                            {["All", "Male", "Female"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  setGenderFilter(opt);
                                  setIsFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-[11px] font-bold transition-colors flex items-center justify-between ${genderFilter === opt ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                              >
                                {opt === "All" ? "All Genders" : opt}
                                {genderFilter === opt && (
                                  <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 sm:pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-full text-[12px] font-semibold outline-none focus:border-blue-500 focus:ring-[2px] focus:ring-blue-500/20 transition-all shadow-sm"
                      />
                    </div>

                    {/* Desktop Close Button */}
                    <button
                      onClick={closePatientModal}
                      className="hidden md:flex items-center justify-center w-10 h-10 bg-slate-100 border border-slate-300 rounded-full text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm shrink-0 ml-1 lg:ml-2"
                    >
                      <X className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Patient List container with invisible scrollbar via arbitrary Tailwind classes */}
              <div className="p-4 sm:p-5 overflow-y-auto h-full relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  onClick={() => isFilterOpen && setIsFilterOpen(false)}
                >
                  <AnimatePresence mode="popLayout">
                    {fullyFilteredPatients.map((patient) => (
                      <motion.div
                        key={patient.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -1, scale: 1.01 }}
                        onClick={() => setSelectedPatient(patient)}
                        className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between cursor-pointer border border-slate-200/60 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 shrink-0 rounded-full ${patient.severity === "Emergency" ? "bg-red-500" : patient.severity === "Moderate" ? "bg-orange-500" : "bg-green-500"}`}
                              />
                              <h4 className="font-bold text-slate-900 text-[13px] lg:text-[14px] truncate">
                                {patient.name}
                              </h4>
                            </div>

                            {/* NEW CALL BUTTON: Only shows for Emergency/Moderate */}
                            {(patient.severity === "Emergency" ||
                              patient.severity === "Moderate") && (
                              <a
                                href={`tel:${patient.phone}`}
                                onClick={(e) => e.stopPropagation()} // Prevents the card from opening when you click call!
                                // Increased from w-7/h-7 to w-10/h-10 for a much larger touch target
                                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 bg-green-50 border border-green-200 text-green-600 rounded-full hover:bg-green-100 hover:text-green-700 transition-colors shadow-sm shrink-0"
                                title="Call Patient"
                              >
                                {/* Increased the icon size from w-3 to w-5 */}
                                <Phone className="w-5 h-5" />
                              </a>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-bold">
                            {patient.id} <span className="mx-1">•</span>{" "}
                            {patient.gender}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 gap-2">
                          <div className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold text-slate-700 truncate max-w-[65%] sm:max-w-[70%]">
                            {patient.disease}
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold shrink-0 text-right">
                            {/* Explicitly forces the display to Indian Standard Time (IST) */}
                            {new Date(patient.date).toLocaleDateString(
                              "en-US",
                              {
                                timeZone: "Asia/Kolkata",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                            {" • "}
                            {new Date(patient.date).toLocaleTimeString(
                              "en-US",
                              {
                                timeZone: "Asia/Kolkata",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {fullyFilteredPatients.length === 0 && (
                    <div className="col-span-1 md:col-span-2 flex justify-center py-10">
                      <p className="text-sm font-bold text-slate-400">
                        No patients found matching this criteria.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] ${selectedPatient.imageUrl ? "max-w-4xl" : "max-w-sm lg:max-w-md"} bg-white shadow-2xl z-[70] rounded-[1.5rem] lg:rounded-[2rem] p-5 sm:p-6 overflow-y-auto max-h-[90vh] border border-slate-100`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-[16px] lg:text-lg font-bold text-slate-900 tracking-tight">
                    Patient Report
                  </h2>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                    Generated by TRIAGE-AI
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-slate-700 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  aria-label="Close patient report"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <div
                className={`grid grid-cols-1 ${selectedPatient.imageUrl ? "lg:grid-cols-2 gap-5" : "gap-4.5"}`}
              >
                <div className="space-y-3.5">
                  <div
                    className={`p-3 rounded-xl border-2 flex items-center justify-between ${selectedPatient.severity === "Emergency" ? "bg-red-50 border-red-200 text-red-700" : selectedPatient.severity === "Moderate" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-green-50 border-green-200 text-green-700"}`}
                  >
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                        Assessed Urgency
                      </p>
                      <p className="text-base lg:text-lg font-black leading-none">
                        {selectedPatient.severity} Case
                      </p>
                    </div>
                    {selectedPatient.severity === "Emergency" ? (
                      <AlertCircle className="w-6 h-6 opacity-80" />
                    ) : selectedPatient.severity === "Moderate" ? (
                      <AlertTriangle className="w-6 h-6 opacity-80" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 opacity-80" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        Patient
                      </p>
                      <p className="font-bold text-slate-900 text-[13px] truncate leading-tight">
                        {selectedPatient.name}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                        {selectedPatient.age}y • {selectedPatient.gender}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        Condition
                      </p>
                      <p className="font-bold text-slate-900 text-[13px] leading-tight">
                        {selectedPatient.disease}
                      </p>
                    </div>
                  </div>
                  {selectedPatient.symptoms.length > 0 && (
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                        Symptoms
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPatient.symptoms.map((symptom, idx) => (
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
                  {selectedPatient.actionPlan &&
                    selectedPatient.actionPlan.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                          Action Plan
                        </p>
                        <div className="space-y-1.5">
                          {selectedPatient.actionPlan.map((action, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 bg-slate-50 border border-slate-200/60 p-2 rounded-lg"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <p className="text-[11px] lg:text-[12px] text-slate-700 font-bold leading-snug">
                                {action}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {selectedPatient.imageUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-[1.25rem] p-3 flex flex-col h-full">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-2 text-center">
                      AI Visual Analysis
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImageUrl(selectedPatient.imageUrl ?? null)
                      }
                      className="group relative w-full h-32 lg:h-36 rounded-lg border border-slate-200 mb-2.5 shadow-sm overflow-hidden bg-white cursor-zoom-in text-left"
                    >
                      <img
                        src={selectedPatient.imageUrl}
                        className="w-full h-full object-cover"
                        alt="Upload"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 to-transparent px-3 py-2">
                        <p className="text-[10px] font-bold text-white opacity-90 transition-opacity group-hover:opacity-100">
                          Click to view full screen
                        </p>
                      </div>
                    </button>
                    <ul className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-200 flex-1 shadow-sm overflow-hidden">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                        Findings
                      </p>
                      {selectedPatient.visualFindings?.map(
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewImageUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImageUrl(null)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="fixed inset-4 z-[90] flex items-center justify-center"
            >
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-white/20"
                aria-label="Close image preview"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              <img
                src={previewImageUrl}
                alt="Patient history full screen preview"
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
