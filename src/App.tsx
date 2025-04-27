import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PortfolioMap from './pages/PortfolioMap';
import ScenarioSim from './pages/ScenarioSim';
import AIAdvisor from './pages/AIAdvisor';
import PaperTrading from './pages/PaperTrading';
import OptionsTrading from './pages/OptionsTrading';
import { TradingProvider } from './context/TradingContext';

function App() {
  return (
    <TradingProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />}>
            <Route path="portfolio" element={<PortfolioMap />} />
            <Route path="scenario" element={<ScenarioSim />} />
          </Route>
          <Route path="/ai-advisor" element={<AIAdvisor />} />
          <Route path="/paper-trading" element={<PaperTrading />} />
          <Route path="/options" element={<OptionsTrading />} />
        </Routes>
      </Router>
    </TradingProvider>
  );
}

export default App;
