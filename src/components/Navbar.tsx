import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="flex flex-wrap justify-center gap-6 p-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-md">
      <Link to="/" className="hover:underline">Dashboard</Link>
      <Link to="/portfolio" className="hover:underline">Portfolio Map</Link>
      <Link to="/scenario" className="hover:underline">Scenario Simulator</Link>
      <Link to="/ai-advisor" className="hover:underline">AI Advisor</Link>
      <Link to="/paper-trading" className="hover:underline">Paper Trading</Link>
      <Link to="/options" className="hover:underline">Options Trading</Link>
    </nav>
  );
}
