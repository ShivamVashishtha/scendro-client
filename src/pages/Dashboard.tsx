import Particles from "react-tsparticles";

export default function Dashboard() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
      {/* Particles Component for Interactive Background */}
      <Particles
        options={{
          particles: {
            number: { value: 50 },
            size: { value: 3 },
            move: { enable: true, speed: 2 },
            opacity: { value: 0.5 },
            shape: { type: "circle" },
            color: { value: "#ffffff" },
          },
          interactivity: {
            events: { onhover: { enable: true, mode: "repulse" } },
          },
        }}
      />

      {/* Title with glowing and 3D hover effects */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-600 to-pink-400 mb-8 transform transition duration-500 ease-in-out hover:scale-110 hover:text-pink-400">
        Welcome to Scendro
      </h1>

      {/* Subheading with smooth hover effect */}
      <p className="text-lg md:text-2xl text-gray-300 mb-10 transform transition duration-500 ease-in-out hover:scale-105 hover:translate-y-2 opacity-90">
        Smarter investing, powered by AI-driven simulations and real-time analytics.
      </p>

      {/* Glowing Button with Hover Effects */}
      <a 
        href="/portfolio" 
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-lg transition transform hover:scale-110 hover:shadow-lg hover:text-pink-400 duration-300 ease-in-out"
      >
        Explore Portfolio Map
      </a>

      {/* Pulsing Animated Circle */}
      <div className="absolute inset-0 z-[-2] bg-pink-500 rounded-full opacity-20 animate-ping"></div>

      {/* Glowing Outline */}
      <div className="absolute inset-0 border-4 border-white rounded-xl opacity-40 animate-pulse"></div>
    </div>
  );
}
