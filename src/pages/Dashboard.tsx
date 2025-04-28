import React, { useState } from "react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-black px-8 py-16">
        <h1 className="text-5xl font-bold mb-8 text-center">
          Welcome to Your Dashboard
        </h1>
        <p className="text-xl mb-12 text-center">
          Track your{" "}
          <span className="text-transition">investments and forecasts</span> here.
        </p>

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

        {/* Widgets (example: Portfolio Summary and Trending Stocks) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Portfolio Summary</h3>
            <p className="text-gray-700">Current Value: $25,000</p>
            <p className="text-gray-700">Growth: 5.5%</p>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Trending Stocks</h3>
            <ul className="text-gray-700">
              <li>TSLA - $700 (+3.5%)</li>
              <li>APPL - $150 (+2.0%)</li>
              <li>AMZN - $3300 (+4.2%)</li>
            </ul>
          </div>
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
