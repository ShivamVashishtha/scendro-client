import React, { useState } from "react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
      {/* Parallax Background */}
      <div className="parallax"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 flex justify-center items-center z-10">
        <div className="particle animate-glow"></div>
        <div className="particle animate-glow" style={{ animationDelay: "1s" }}></div>
        <div className="particle animate-glow" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-white px-8 py-16 dashboard-container">
        <h1 className="text-5xl font-bold animate-glow mb-8 text-center">
          Welcome to Your Dashboard
        </h1>
        <p className="text-xl mb-12 text-center">Track your investments and forecasts here.</p>

        {/* Tabs for navigation */}
        <div className="tabs">
          <div
            className={`tab ${activeTab === "portfolio" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("portfolio")}
          >
            Portfolio
          </div>
          <div
            className={`tab ${activeTab === "scenario" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("scenario")}
          >
            Scenario Sim
          </div>
          <div
            className={`tab ${activeTab === "ai" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            AI Advisor
          </div>
        </div>

        {/* Dynamic Content based on selected Tab */}
        <div className="mt-6">
          {activeTab === "portfolio" && (
            <div className="glass-card p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">Portfolio Overview</h2>
              <p className="text-lg text-gray-700">Track the current state of your investments.</p>
            </div>
          )}
          {activeTab === "scenario" && (
            <div className="glass-card p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">Scenario Simulation</h2>
              <p className="text-lg text-gray-700">Run different scenarios to forecast your portfolio's future.</p>
            </div>
          )}
          {activeTab === "ai" && (
            <div className="glass-card p-6 text-center">
              <h2 className="text-2xl font-semibold mb-4">AI Advisor</h2>
              <p className="text-lg text-gray-700">Get advice on how to optimize your portfolio with AI.</p>
            </div>
          )}
        </div>

        {/* Call-to-Action Button */}
        <div className="mt-8">
          <button className="cta-button bg-blue-600 text-white py-2 px-6 rounded-lg">Get Started</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
