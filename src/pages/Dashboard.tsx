import React from "react";

const Dashboard = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 flex justify-center items-center z-10">
        <div className="particle animate-glow"></div>
        <div className="particle animate-glow" style={{ animationDelay: "1s" }}></div>
        <div className="particle animate-glow" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-white px-8 py-16 dashboard-container">
        <h1 className="text-5xl font-bold animate-glow mb-8">Welcome to Your Dashboard</h1>
        <p className="text-xl mb-12">Track your investments and forecasts here.</p>

        {/* Interactive Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          <div className="card bg-white p-6 rounded-lg shadow-lg text-center hover:bg-gray-100 transition-all">
            <h2 className="text-2xl font-semibold mb-4">Portfolio Overview</h2>
            <p className="text-lg text-gray-700">Track the current state of your investments.</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow-lg text-center hover:bg-gray-100 transition-all">
            <h2 className="text-2xl font-semibold mb-4">Performance Analytics</h2>
            <p className="text-lg text-gray-700">Analyze your portfolio's historical performance.</p>
          </div>
          <div className="card bg-white p-6 rounded-lg shadow-lg text-center hover:bg-gray-100 transition-all">
            <h2 className="text-2xl font-semibold mb-4">Scenario Simulation</h2>
            <p className="text-lg text-gray-700">Run different scenarios to forecast your portfolio's future.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
