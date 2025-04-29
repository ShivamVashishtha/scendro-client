import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PortfolioMap from './pages/PortfolioMap';
import ScenarioSim from './pages/ScenarioSim';
import AIAdvisor from './pages/AIAdvisor';
import PaperTrading from './pages/PaperTrading';
import OptionsTrading from './pages/OptionsTrading';
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { TradingProvider } from './context/TradingContext';
import { AuthProvider } from './context/AuthContext'; // <-- ✨ added
import Navbar from './components/Navbar';
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from 'react-hot-toast'; // ✨ Toast added

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/portfolio" element={<PortfolioMap />} />
        <Route path="/scenario" element={<ScenarioSim />} />
        <Route path="/ai-advisor" element={<AIAdvisor />} />
        <Route path="/paper-trading" element={<PaperTrading />} />
        <Route path="/options" element={<OptionsTrading />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <TradingProvider>
      <AuthProvider> {/* ✨ Wrapped whole app */}
        <Router>
          <Navbar />
          <motion.div 
            className="pt-20 transition-all duration-300 ease-in-out"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatedRoutes />
          </motion.div>
          <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
        </Router>
      </AuthProvider>
    </TradingProvider>
  );
}

export default App;
