import React, { useState } from "react";
import Tilt from "react-parallax-tilt";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";

const rollingWords = ["investments", "holdings", "portfolio", "simulations"];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("portfolio");
  const [currentWord, setCurrentWord] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % rollingWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    setMousePosition({ x: clientX, y: clientY });
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
    >
      {/* Radial Background + Mouse Parallax */}
      <div
        className="bg-gradient-radial absolute inset-0"
        style={{
          transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
          transition: "transform 0.2s ease-out",
        }}
      ></div>

      {/* Animated Light Beams */}
      <div className="absolute top-0 left-10 light-beam" style={{ animationDelay: "0s" }}></div>
      <div className="absolute top-0 left-60 light-beam" style={{ animationDelay: "2s" }}></div>
      <div className="absolute top-0 left-96 light-beam" style={{ animationDelay: "4s" }}></div>

      {/* Particles Layer */}
      <Particles
        id="tsparticles"
        options={{
          fpsLimit: 60,
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              resize: true,
            },
            modes: {
              repulse: { distance: 100, duration: 0.4 },
            },
          },
          particles: {
            color: { value: "#ffffff" },
            links: { enable: true, color: "#ffffff", distance: 150 },
            move: { enable: true, speed: 2 },
            number: { value: 60 },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
          detectRetina: true,
        }}
        style={{ zIndex: -1 }}
      />

      {/* Main Dashboard Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen text-white px-8 py-16 dashboard-container">
        
        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold mb-8 text-center"
        >
          Welcome to Your Dashboard
        </motion.h1>

        {/* Rolling Words */}
        <motion.p
          key={currentWord}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="text-xl mb-12 text-center"
        >
          Track your <span className="text-blue-400">{rollingWords[currentWord]}</span>
        </motion.p>

        {/* Tabs */}
        <div className="tabs">
          {["portfolio", "scenario", "ai"].map((tab) => (
            <motion.div
              key={tab}
              className={`tab ${activeTab === tab ? "active-tab" : ""}`}
              onClick={() => setActiveTab(tab)}
              whileHover={{ scale: 1.05 }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </motion.div>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="mt-6">
          {activeTab === "portfolio" && (
            <Tilt glareEnable={true} glareMaxOpacity={0.2} scale={1.02} tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <div className="glass-card p-6 text-center">
                <h2 className="text-2xl font-semibold mb-4">Portfolio Overview</h2>
                <p className="text-lg text-gray-400">Track the current state of your investments.</p>
              </div>
            </Tilt>
          )}
          {activeTab === "scenario" && (
            <Tilt glareEnable={true} glareMaxOpacity={0.2} scale={1.02} tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <div className="glass-card p-6 text-center">
                <h2 className="text-2xl font-semibold mb-4">Scenario Simulation</h2>
                <p className="text-lg text-gray-400">Run different scenarios to forecast your portfolio's future.</p>
              </div>
            </Tilt>
          )}
          {activeTab === "ai" && (
            <Tilt glareEnable={true} glareMaxOpacity={0.2} scale={1.02} tiltMaxAngleX={10} tiltMaxAngleY={10}>
              <div className="glass-card p-6 text-center">
                <h2 className="text-2xl font-semibold mb-4">AI Advisor</h2>
                <p className="text-lg text-gray-400">Get advice on how to optimize your portfolio with AI.</p>
              </div>
            </Tilt>
          )}
        </div>

        {/* CTA Button */}
        <motion.div className="mt-8" whileHover={{ scale: 1.1 }}>
          <button className="cta-button bg-blue-600 text-white py-2 px-6 rounded-lg">
            Get Started
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
