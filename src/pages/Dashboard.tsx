import { Outlet, Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 px-6 py-4 flex gap-6 text-lg font-medium">
        <Link to="/portfolio" className="text-white hover:text-blue-400 transition">
          Portfolio Map
        </Link>
        <Link to="/scenario" className="text-white hover:text-blue-400 transition">
          ScenarioSim
        </Link>
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
