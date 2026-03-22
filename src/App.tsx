// src/App.tsx
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AuthPage from './pages/AuthPage';
// We will create these in the next steps:
import Dashboard from './pages/dashboard';
import PatientEntry from './pages/PatientEntry';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AuthPage />} />
        {<Route path="/dashboard" element={<Dashboard />} />}
        {<Route path="/patient-entry" element={<PatientEntry />} />}
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-100">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}