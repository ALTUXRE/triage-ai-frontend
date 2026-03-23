// src/pages/AuthPage.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  Lock,
  User,
  MapPin,
  CheckCircle2,
  HeartPulse,
  ArrowRight,
  Info,
  Check,
  X,
  AlertCircle,
  Zap,
  Shield,
  Microscope,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "Which city were you born in?",
  "What is the name of your primary PHC?",
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryOtp, setRecoveryOtp] = useState("");
  const [recoveryQuestion, setRecoveryQuestion] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [successType, setSuccessType] = useState<"register" | "reset">(
    "register",
  );
  const [isSecurityDropdownOpen, setIsSecurityDropdownOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);

  const navigate = useNavigate();

  // Reset any cached state when component mounts (helps clear forms after logout)
  useEffect(() => {
    setIsLogin(true);
    setShowSuccessMessage(false);
    setIsRegistering(false);
    setShowDisclaimer(false);
    setDisclaimerAccepted(false);
    setSelectedQuestion("");
    setIsSecurityDropdownOpen(false);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>; // <-- Changed this line
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsRegistering(true);

    if (!selectedQuestion) {
      setErrorMessage("Please select a security question.");
      setIsRegistering(false);
      return;
    }

    const form = e.currentTarget; // 1. SAVE THE FORM REFERENCE HERE
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch(
        "https://triage-ai-api.onrender.com/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.get("register-name"), // Grabs "Arihan Pattanaik"
            location: formData.get("register-location"), // Grabs "Khordha"
            phone: formData.get("register-phone-hidden"), // Grabs the actual phone number
            password: formData.get("register-pass-hidden"), // Grabs the actual password
            security_question: formData.get("security-question"),
            security_answer: formData.get("security-answer"),
          }),
        },
      );

      if (res.ok) {
        setIsRegistering(false);
        setSuccessType("register");
        setShowSuccessMessage(true);
        form.reset(); // 2. USE THE SAVED REFERENCE HERE INSTEAD OF e.currentTarget
      } else {
        setErrorMessage(
          "Registration failed. Phone number might already be in use.",
        );
        setIsRegistering(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Network error. Please check your connection and try again.",
      );
      setIsRegistering(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("https://triage-ai-api.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.get("login-phone-hidden"),
          password: formData.get("login-pass-hidden"),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("worker_id", data.worker_id);
        setShowDisclaimer(true);
      } else {
        // REPLACE alert() WITH THIS:
        setErrorMessage("Invalid phone number or password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      // ADD ERROR HANDLING FOR CRASHES:
      setErrorMessage(
        "Network error. Please check your connection and try again.",
      );
    }
  };

  const handleProceedToDashboard = () => {
    if (disclaimerAccepted) {
      navigate("/dashboard");
    }
  };

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const loginVariants = {
    initial: { opacity: 0, x: -40 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 },
    },
    exit: { opacity: 0, x: -40, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const registerVariants = {
    initial: { opacity: 0, x: 40 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.1 },
    },
    exit: { opacity: 0, x: 40, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  const features = [
    {
      icon: Zap,
      title: "Instant Analysis",
      desc: "Real-time AI evaluation of reported symptoms.",
      color: "text-amber-400",
    },
    {
      icon: Microscope,
      title: "Diagnostic Support",
      desc: "Evidence-based condition identification.",
      color: "text-emerald-400",
    },
    {
      icon: Shield,
      title: "Secure Triage",
      desc: "Prioritize patient care with high accuracy.",
      color: "text-rose-400",
    },
  ];

  return (
    <>
      <motion.div
        /* Mobile background is white at the bottom, Desktop is slate */
        className="min-h-[100dvh] lg:h-screen flex flex-col lg:flex-row bg-white lg:bg-slate-100 lg:overflow-hidden font-sans relative"
        onClick={() =>
          isSecurityDropdownOpen && setIsSecurityDropdownOpen(false)
        }
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {/* =========================================================
            MOBILE/TABLET TOP BLUE HEADER
            ========================================================= */}
        <div className="flex lg:hidden w-full bg-gradient-to-b from-blue-600 to-blue-800 text-white flex-col relative overflow-hidden z-0 pt-10 pb-20 px-6 items-center shadow-inner">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] border-[1px] border-white/20 rounded-full"
            />
          </div>

          {/* Centered Logo for Mobile */}
          <div className="relative z-10 flex flex-col items-center mt-4 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center shadow-lg border border-white/20 mb-4">
              <HeartPulse className="text-white w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">TRIAGE-AI</h1>
          </div>
        </div>

        {/* =========================================================
            LEFT PANEL (DESKTOP ONLY)
            ========================================================= */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 text-white flex-col justify-between p-8 xl:p-12 relative overflow-hidden shadow-2xl z-20 rounded-r-[2.5rem] xl:rounded-r-[3rem]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] border-[1px] border-white/20 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute top-[-5%] left-[-5%] w-[45rem] h-[45rem] border-[1px] border-white/10 rounded-full"
            />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6 xl:mb-10">
              <div className="w-10 h-10 xl:w-12 xl:h-12 bg-white/10 backdrop-blur-xl rounded-[1rem] flex items-center justify-center shadow-lg border border-white/20">
                <HeartPulse className="text-white w-5 h-5 xl:w-6 xl:h-6" />
              </div>
              <span className="text-lg xl:text-xl font-bold tracking-tight">
                TRIAGE-AI
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <h1 className="text-3xl xl:text-4xl font-bold tracking-tight mb-3 xl:mb-4 leading-[1.15]">
                  Transforming Rural <br />
                  <span className="text-blue-200">Clinical Triage</span>
                </h1>
                <p className="text-blue-100/90 text-sm xl:text-[15px] leading-relaxed mb-6 xl:mb-8 font-medium">
                  Empowering frontline health workers with cutting-edge AI. We
                  bridge the gap between initial symptom presentation and expert
                  medical assessment, ensuring timely prioritization of patient
                  care.
                </p>
                <div className="flex flex-col gap-2.5 xl:gap-3">
                  {features.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.1 }}
                        className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 xl:p-4 flex items-center gap-3 hover:bg-white/15 transition-colors"
                      >
                        <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                          <Icon className={`w-5 h-5 ${feature.color}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm xl:text-[15px] mb-0.5">
                            {feature.title}
                          </h3>
                          <p className="text-blue-100/80 text-xs xl:text-[13px] leading-snug">
                            {feature.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 border-t border-white/10 pt-4 mt-6 xl:mt-8">
              <p className="text-[11px] xl:text-xs text-white-200/60 font-medium tracking-wide">
                TRIAGE-AI is a decision-support tool and does not replace
                professional medical diagnosis or treatment.
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT PANEL (BOTTOM OVERLAPPING SHEET ON MOBILE)
            ========================================================= */}
        <div
          className={`w-full lg:w-[55%] xl:w-1/2 flex flex-col items-center justify-start lg:justify-center relative flex-1 z-30 
                         /* MOBILE: Overlapping white sheet */
                         bg-white lg:bg-transparent rounded-t-[2.5rem] lg:rounded-none -mt-10 lg:mt-0 pt-8 lg:pt-0 pb-10 px-5 sm:px-8
                         shadow-[0_-15px_40px_rgba(0,0,0,0.1)] lg:shadow-none`}
        >
          {/* Ambient Blobs (Desktop Only) */}
          <div className="hidden lg:block absolute top-[-5%] right-[-5%] w-[400px] h-[400px] xl:w-[500px] xl:h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none" />
          <div className="hidden lg:block absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] xl:w-[400px] xl:h-[400px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none" />

          {/* AUTH CARD / FORM CONTAINER */}
          <div className="w-full max-w-[420px] flex flex-col z-10 lg:bg-white/95 lg:backdrop-blur-xl lg:p-10 lg:rounded-[2rem] lg:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] lg:border lg:border-white">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  variants={loginVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="mb-8 text-center pt-2 lg:pt-0">
                    <h2 className="text-[26px] sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
                      Welcome Back
                    </h2>
                    <p className="text-[13px] sm:text-sm text-slate-500 font-medium">
                      Enter your details below to continue.
                    </p>
                  </div>

                  <form
                    id="login-form"
                    onSubmit={handleLoginSubmit}
                    autoComplete="off"
                    className="space-y-4"
                  >
                    {/* --- THE AUTOFILL TRAP --- */}
                    {/* Chrome will dump the saved data here instead of your real inputs */}
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        overflow: "hidden",
                        position: "absolute",
                      }}
                    >
                      <input
                        type="text"
                        autoComplete="username"
                        tabIndex={-1}
                      />
                      <input
                        type="password"
                        autoComplete="current-password"
                        tabIndex={-1}
                      />
                    </div>
                    {/* ------------------------- */}

                    <motion.div
                      variants={itemVariants}
                      className="relative group"
                    >
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block ml-1">
                        Mobile Number
                      </label>
                      <div className="absolute bottom-0 left-0 pl-4 pb-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        required
                        type="tel"
                        name="login-phone-hidden"
                        autoComplete="off"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Enter Mobile Number"
                      />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="relative group"
                    >
                      <div className="flex justify-between items-end mb-1 ml-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowRecovery(true)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 pl-4 pb-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        required
                        type={showLoginPassword ? "text" : "password"}
                        name="login-pass-hidden"
                        autoComplete="off"
                        className="w-full pl-11 pr-10 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Enter Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute bottom-0 right-0 pr-4 pb-3 flex items-center text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </motion.div>

                    <motion.button
                      variants={itemVariants}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-all text-[13px] sm:text-sm flex items-center justify-center gap-2"
                      type="submit"
                    >
                      Sign In
                    </motion.button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="register"
                  variants={registerVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="mb-6 text-center pt-2 lg:pt-0">
                    <h2 className="text-[26px] sm:text-3xl font-bold tracking-tight text-slate-900 mb-1.5">
                      Get started free.
                    </h2>
                    <p className="text-[13px] sm:text-sm text-slate-500 font-medium">
                      Register to access TRIAGE-AI.
                    </p>
                  </div>

                  <form
                    onSubmit={handleRegisterSubmit}
                    autoComplete="off"
                    className="space-y-3.5"
                  >
                    <motion.div
                      variants={itemVariants}
                      className="relative group"
                    >
                      <div className="absolute bottom-0 left-0 pl-4 pb-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        required
                        type="text"
                        name="register-name"
                        autoComplete="new-password"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Full Name"
                      />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="relative group"
                    >
                      <div className="absolute bottom-0 left-0 pl-4 pb-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        required
                        type="text"
                        name="register-location"
                        autoComplete="nope"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Location / District"
                      />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="relative group"
                    >
                      <div className="absolute bottom-0 left-0 pl-4 pb-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        required
                        type="tel"
                        name="register-phone-hidden"
                        autoComplete="off"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Mobile Number"
                      />
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="relative group"
                    >
                      <div className="absolute bottom-0 left-0 pl-4 pb-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <input
                        required
                        type={showRegisterPassword ? "text" : "password"}
                        name="register-pass-hidden"
                        autoComplete="off"
                        className="w-full pl-11 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Create Password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRegisterPassword(!showRegisterPassword)
                        }
                        className="absolute bottom-0 right-0 pr-4 pb-2.5 flex items-center text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </motion.div>

                    {/* Custom Interactive Security Question Dropdown */}
                    <motion.div
                      variants={itemVariants}
                      className="relative group z-20"
                    >
                      {/* Hidden input to keep form submission working seamlessly */}
                      <input
                        type="hidden"
                        name="security-question"
                        value={selectedQuestion}
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSecurityDropdownOpen(!isSecurityDropdownOpen);
                        }}
                        className={`w-full px-4 py-2.5 border rounded-xl text-[13px] font-semibold outline-none shadow-sm flex items-center justify-between transition-all ${isSecurityDropdownOpen ? "bg-white border-blue-500 ring-[2px] ring-blue-500/20 text-slate-900" : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"}`}
                      >
                        <span className="truncate pr-4">
                          {selectedQuestion || "Select a Security Question"}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform ${isSecurityDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                        />
                      </button>

                      <AnimatePresence>
                        {isSecurityDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
                          >
                            {SECURITY_QUESTIONS.map((q, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuestion(q);
                                  setIsSecurityDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors flex items-center justify-between ${selectedQuestion === q ? "bg-blue-50/80 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                              >
                                <span className="truncate pr-2">{q}</span>
                                {selectedQuestion === q && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="relative group"
                    >
                      <input
                        required
                        type="text"
                        name="security-answer"
                        autoComplete="off"
                        className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-[2px] focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                        placeholder="Your Answer (Remember this!)"
                      />
                    </motion.div>

                    <motion.button
                      variants={itemVariants}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isRegistering}
                      className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-[13px] sm:text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                      type="submit"
                    >
                      {isRegistering ? "Processing..." : "Sign Up"}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Link - Now visible on ALL devices below the form */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center pt-5 border-t border-slate-200 lg:border-slate-100"
            >
              <p className="text-[13px] text-slate-500 font-medium">
                {isLogin ? "Don't have an account? " : "Already registered? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setShowSuccessMessage(false);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors ml-1 focus:outline-none"
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* DISCLAIMER MODAL */}
      <AnimatePresence>
        {showDisclaimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-[500px] rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col border border-slate-100 relative"
            >
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-12 h-12 bg-blue-50/80 rounded-full flex items-center justify-center mb-3 border border-blue-100 shadow-sm">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Important Disclaimer
                </h2>
              </div>
              <div className="text-[13px] sm:text-[14px] text-slate-600 space-y-4 leading-relaxed mb-6 text-justify px-1">
                <div className="bg-red-50/80 border border-red-100 p-3.5 rounded-xl flex items-center text-left gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[12px] sm:text-[13px] text-red-800 font-medium leading-snug">
                    <strong>
                      TRIAGE-AI is a clinical triage demonstration system
                      developed strictly for academic purposes.
                    </strong>{" "}
                  </p>
                </div>
                <div className="bg-red-50/80 border border-red-100 p-3.5 rounded-xl flex items-center text-left gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[12px] sm:text-[13px] text-red-800 font-medium leading-snug">
                    <strong>
                      This results are not medical diagnoses and must not
                      replace professional medical advice.
                    </strong>
                  </p>
                </div>
                <div className="bg-red-50/80 border border-red-100 p-3.5 rounded-xl flex items-center text-left gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[12px] sm:text-[13px] text-red-800 font-medium leading-snug">
                    <strong>
                      Always consult qualified healthcare professionals for
                      real-world medical concerns.
                    </strong>
                  </p>
                </div>
              </div>
              <div
                onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer mb-6 select-none ${disclaimerAccepted ? "bg-blue-50/50 border-blue-500" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}
              >
                <div
                  className={`w-5 h-5 shrink-0 rounded-[4px] border-2 flex items-center justify-center transition-colors ${disclaimerAccepted ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"}`}
                >
                  {disclaimerAccepted && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <p
                  className={`text-[12px] sm:text-[13px] font-semibold transition-colors leading-snug ${disclaimerAccepted ? "text-blue-900" : "text-slate-700"}`}
                >
                  I acknowledge this is a project demonstration.
                </p>
              </div>
              <motion.button
                whileHover={disclaimerAccepted ? { scale: 1.01 } : {}}
                whileTap={disclaimerAccepted ? { scale: 0.98 } : {}}
                onClick={handleProceedToDashboard}
                disabled={!disclaimerAccepted}
                className={`w-full py-3.5 rounded-xl font-bold transition-all text-[13px] sm:text-sm flex items-center justify-center gap-2 ${disclaimerAccepted ? "bg-blue-600 text-white shadow-md" : "bg-slate-200 text-slate-600 cursor-not-allowed"}`}
              >
                Accept and continue <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowDisclaimer(false);
                  setDisclaimerAccepted(false);
                  localStorage.removeItem("worker_id");
                  (
                    document.getElementById("login-form") as HTMLFormElement
                  )?.reset();
                }}
                className="w-full mt-3 py-3.5 rounded-xl font-bold transition-all text-[13px] sm:text-sm flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 shadow-md"
              >
                Decline and sign out
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REGISTRATION SUCCESS MODAL */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-[400px] rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center border border-slate-100 relative"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-100 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                {successType === "reset"
                  ? "Password Reset Successful"
                  : "Registration Successful"}
              </h2>
              <p className="text-[13px] sm:text-[14px] text-slate-500 mb-8 leading-relaxed px-2">
                <strong>
                  {successType === "reset"
                    ? "Your password has been successfully updated. You can now sign in with your new credentials."
                    : "Your health worker account has been created. You can now sign in to access TRIAGE-AI."}
                </strong>
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowSuccessMessage(false);
                  setTimeout(() => setIsLogin(true), 150);
                }}
                className="w-full py-3.5 rounded-xl font-bold transition-all text-[13px] sm:text-sm flex items-center justify-center gap-2 bg-blue-600 text-white shadow-md hover:bg-blue-700"
              >
                Continue to Sign In <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PASSWORD RECOVERY MODAL */}
      <AnimatePresence>
        {showRecovery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-[400px] rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col border border-slate-100 relative"
            >
              <button
                onClick={() => {
                  setShowRecovery(false);
                  setRecoveryStep(1);
                  setRecoveryPhone("");
                  setRecoveryOtp("");
                }}
                className="absolute top-4 right-4 p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-full transition-all shadow-sm"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 border border-indigo-100 shadow-sm">
                  <Shield className="w-6 h-6 text-indigo-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Reset Your Password
                </h2>
                <p className="text-[13px] text-slate-700 mt-1 px-2">
                  {recoveryStep === 1 && "Enter your registered mobile number."}
                  {recoveryStep === 2 &&
                    "Enter the 6-digit OTP sent to your phone."}
                  {recoveryStep === 3 &&
                    "Answer your security question to reset password."}
                </p>
              </div>

              {/* STEP 1: REQUEST OTP */}
              {recoveryStep === 1 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch(
                        "https://triage-ai-api.onrender.com/api/request-recovery-otp",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phone: recoveryPhone }),
                        },
                      );
                      if (res.ok) {
                        setRecoveryStep(2);
                        setOtpCountdown(60);
                        setErrorMessage(null);
                      } else {
                        setErrorMessage(
                          "Phone number not found in our system.",
                        );
                      }
                    } catch (err) {
                      setErrorMessage("Network error.");
                    }
                  }}
                  className="space-y-4"
                >
                  <input
                    required
                    type="tel"
                    value={recoveryPhone}
                    onChange={(e) => setRecoveryPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="Mobile Number"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Send OTP
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY OTP */}
              {recoveryStep === 2 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch(
                        "https://triage-ai-api.onrender.com/api/verify-otp",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            phone: recoveryPhone,
                            otp: recoveryOtp,
                          }),
                        },
                      );
                      if (res.ok) {
                        const data = await res.json();
                        setRecoveryQuestion(data.security_question);
                        setErrorMessage(null);

                        // --- NEW ANIMATION LOGIC ---
                        setIsOtpVerified(true); // Trigger the green checkmark
                        setTimeout(() => {
                          setRecoveryStep(3); // Move to next step after 1.2 seconds
                          setIsOtpVerified(false); // Reset the button
                        }, 1200);
                      } else {
                        setErrorMessage("Invalid OTP. Please try again.");
                      }
                    } catch (err) {
                      setErrorMessage("Network error.");
                    }
                  }}
                  className="space-y-4"
                >
                  <input
                    required
                    type="text"
                    maxLength={6}
                    value={recoveryOtp}
                    onChange={(e) => setRecoveryOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center tracking-[0.5em] text-lg font-bold focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="••••••"
                  />
                  <motion.button
                    type="submit"
                    disabled={isOtpVerified}
                    animate={{
                      backgroundColor: isOtpVerified ? "#22c55e" : "#4f46e5",
                    }} // Transitions from indigo-600 to green-500
                    className="w-full py-3.5 text-white font-bold rounded-xl shadow-md transition-shadow flex items-center justify-center gap-2"
                  >
                    {isOtpVerified ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Verified!
                      </motion.div>
                    ) : (
                      "Verify OTP"
                    )}
                  </motion.button>

                  {/* --- NEW RESEND & GO BACK CONTROLS --- */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            "https://triage-ai-api.onrender.com/api/request-recovery-otp",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ phone: recoveryPhone }),
                            },
                          );
                          if (res.ok) {
                            setOtpCountdown(60); // Restart the timer
                            setErrorMessage(null);
                          } else {
                            setErrorMessage(
                              "Failed to resend OTP. Please try again later.",
                            );
                          }
                        } catch (err) {
                          setErrorMessage("Network error.");
                        }
                      }}
                      className={`w-full text-[12px] font-bold transition-all ${
                        otpCountdown > 0
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-indigo-600 hover:text-indigo-800"
                      }`}
                    >
                      {otpCountdown > 0
                        ? `Resend OTP in ${otpCountdown}s`
                        : "Resend OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryStep(1);
                        setOtpCountdown(0); // Clear timer if they go back
                        setRecoveryOtp("");
                      }}
                      className="w-full text-[12px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Wrong number? Go back
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SECURITY QUESTION & RESET */}
              {recoveryStep === 3 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    try {
                      const res = await fetch(
                        "https://triage-ai-api.onrender.com/api/reset-password",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            phone: recoveryPhone,
                            answer: formData.get("recovery-answer"),
                            new_password: formData.get("new-password"),
                          }),
                        },
                      );
                      if (res.ok) {
                        setShowRecovery(false);
                        setRecoveryStep(1);
                        setRecoveryOtp("");
                        setErrorMessage(null);
                        setSuccessType("reset");
                        setShowSuccessMessage(true);
                      } else {
                        setErrorMessage(
                          "Incorrect security answer. Please try again.",
                        );
                      }
                    } catch (err) {
                      setErrorMessage("Network error.");
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5 mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Security Question
                    </label>
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm cursor-not-allowed">
                      {recoveryQuestion}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Your Answer
                    </label>
                    <input
                      required
                      name="recovery-answer"
                      type="text"
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-[2px] focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all"
                      placeholder="Type your answer"
                    />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                      Create New Password
                    </label>
                    <div className="relative">
                      <input
                        required
                        name="new-password"
                        type={showRecoveryPassword ? "text" : "password"}
                        autoComplete="off"
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:ring-[2px] focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all"
                        placeholder="Enter a new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRecoveryPassword(!showRecoveryPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                      >
                        {showRecoveryPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md transition-all"
                  >
                    Reset Password
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR MODAL */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-[400px] rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center border border-slate-100 relative"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 border border-red-100 shadow-sm">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Authentication Error
              </h2>
              <p className="text-[13px] sm:text-[14px] text-slate-700 font-medium mb-8 leading-relaxed px-2">
                {errorMessage}
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setErrorMessage(null)}
                className="w-full py-3.5 rounded-xl font-bold transition-all text-[13px] sm:text-sm flex items-center justify-center gap-2 bg-blue-600 text-white shadow-md hover:bg-blue-700"
              >
                Try Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
